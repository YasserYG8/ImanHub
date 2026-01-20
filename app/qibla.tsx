import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import { useTheme } from '@/hooks/useThemeColor';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Compass } from '@/components/qibla/Compass';
import { calculateQiblaDirection } from '@/utils/qibla';
import Animated, {
    useSharedValue,
    withTiming,
    useAnimatedStyle,
    interpolateColor,
    FadeInDown,
    FadeInUp
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function QiblaScreen() {
    const theme = useTheme();
    const router = useRouter();
    const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [locationName, setLocationName] = useState<string>('');
    const [qiblaBearing, setQiblaBearing] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [isAligned, setIsAligned] = useState(false);

    const bgProgress = useSharedValue(0);

    const handleAlignChange = (aligned: boolean) => {
        setIsAligned(aligned);
        bgProgress.value = withTiming(aligned ? 1 : 0, { duration: 500 });
    };

    const animatedBgStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            bgProgress.value,
            [0, 1],
            [theme.background, '#064E3B']
        );
        return { backgroundColor };
    });

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            setPermissionStatus(status);

            if (status !== 'granted') {
                Alert.alert('تنبيه', 'نحتاج إلى إذن الموقع لتحديد القبلة بدقة.');
                setLoading(false);
                return;
            }

            try {
                let location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                setCoords(location.coords);

                // Get location name
                const reverseGeo = await Location.reverseGeocodeAsync({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                });

                if (reverseGeo.length > 0) {
                    const place = reverseGeo[0];
                    const name = [place.city, place.country].filter(Boolean).join(', ');
                    setLocationName(name || 'موقعك الحالي');
                }

                const bearing = calculateQiblaDirection(
                    location.coords.latitude,
                    location.coords.longitude
                );
                setQiblaBearing(bearing);
                setLoading(false);
            } catch (error) {
                console.error(error);
                Alert.alert('خطأ', 'تعذر تحديد الموقع الحالي.');
                setLoading(false);
            }
        })();
    }, []);

    return (
        <Animated.View style={[styles.container, animatedBgStyle]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton, { backgroundColor: theme.cardBackground }]}
                >
                    <Ionicons name="arrow-forward" size={22} color={theme.text} />
                </TouchableOpacity>
            </View>

            {/* Location Info */}
            <Animated.View
                entering={FadeInDown.delay(100).springify()}
                style={styles.locationSection}
            >
                <Text style={[styles.locationLabel, { color: isAligned ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}>
                    حاليًا يقع في
                </Text>
                <View style={styles.locationRow}>
                    <Ionicons name="location" size={18} color={theme.primary} />
                    <Text style={[styles.locationName, { color: isAligned ? '#FFF' : theme.text }]}>
                        {locationName || 'جاري التحديد...'}
                    </Text>
                </View>
            </Animated.View>

            {/* Main Content */}
            <View style={styles.content}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                            جاري تحديد موقعك...
                        </Text>
                    </View>
                ) : permissionStatus !== 'granted' ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="location-outline" size={56} color="#EF4444" />
                        <Text style={[styles.errorTitle, { color: theme.text }]}>
                            الموقع غير متاح
                        </Text>
                        <Text style={[styles.errorText, { color: theme.textSecondary }]}>
                            يرجى تفعيل خدمة الموقع لاستخدام البوصلة
                        </Text>
                    </View>
                ) : (
                    <Animated.View
                        entering={FadeInUp.delay(200).springify()}
                        style={styles.compassWrapper}
                    >
                        <Compass qiblaBearing={qiblaBearing} onAlignChange={handleAlignChange} />
                    </Animated.View>
                )}
            </View>

            {/* Bottom Tip */}
            <Animated.View
                entering={FadeInUp.delay(300).springify()}
                style={styles.bottomSection}
            >
                <View style={[styles.tipCard, { backgroundColor: theme.cardBackground }]}>
                    <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary} />
                    <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                        ضع الهاتف على سطح مستوٍ
                    </Text>
                </View>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 56,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationSection: {
        alignItems: 'center',
        marginTop: 16,
    },
    locationLabel: {
        fontSize: 14,
        fontFamily: 'Tajawal-Regular',
        marginBottom: 6,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    locationName: {
        fontSize: 18,
        fontFamily: 'Tajawal-Bold',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'Tajawal-Regular',
    },
    errorContainer: {
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 40,
    },
    errorTitle: {
        fontSize: 20,
        fontFamily: 'Tajawal-Bold',
        marginTop: 8,
    },
    errorText: {
        fontSize: 15,
        fontFamily: 'Tajawal-Regular',
        textAlign: 'center',
    },
    compassWrapper: {
        alignItems: 'center',
    },
    bottomSection: {
        paddingHorizontal: 20,
        paddingBottom: 36,
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 14,
    },
    tipText: {
        fontSize: 13,
        fontFamily: 'Tajawal-Regular',
    },
});
