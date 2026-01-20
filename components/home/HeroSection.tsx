import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    interpolate,
    SharedValue,
    FadeInDown
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useThemeColor';
import { useThemeContext } from '@/context/ThemeContext';
import { PrayerName } from '@/hooks/usePrayerTimes';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 320;

// Prayer-specific background images
const PRAYER_IMAGES: Record<PrayerName, any> = {
    fajr: require('../../assets/images/salat_fajer_time.png'),
    sunrise: require('../../assets/images/salat_dhoher_time.png'),
    dhuhr: require('../../assets/images/salat_dhoher_time.png'),
    asr: require('../../assets/images/salat_aser_time.png'),
    maghrib: require('../../assets/images/salat_meghreb_time.png'),
    isha: require('../../assets/images/salat_icha_time.png'),
    none: require('../../assets/images/islam.jpg'),
};

interface HeroSectionProps {
    hijriDate: string;
    gregorianDate: string;
    greeting: string;
    locationName?: string;
    currentPrayer: PrayerName;
    scrollY: SharedValue<number>;
    children?: React.ReactNode;
}

export function HeroSection({ hijriDate, gregorianDate, greeting, locationName, currentPrayer, scrollY, children }: HeroSectionProps) {
    const theme = useTheme();
    const { isDark } = useThemeContext();
    const router = useRouter();

    const heroAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: interpolate(
                        scrollY.value,
                        [-HERO_HEIGHT, 0, HERO_HEIGHT],
                        [-HERO_HEIGHT / 2, 0, HERO_HEIGHT * 0.75]
                    ),
                },
                {
                    scale: interpolate(
                        scrollY.value,
                        [-HERO_HEIGHT, 0, HERO_HEIGHT],
                        [2, 1, 1]
                    ),
                },
            ],
        };
    });

    const backgroundImage = PRAYER_IMAGES[currentPrayer] || PRAYER_IMAGES.fajr;

    return (
        <View style={styles.heroContainer}>
            <Animated.View style={[styles.heroImageContainer, heroAnimatedStyle]}>
                <ImageBackground
                    source={backgroundImage}
                    style={styles.heroImage}
                    resizeMode="cover"
                >
                    <LinearGradient
                        colors={isDark
                            ? ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', theme.background]
                            : ['rgba(0,0,0,0.1)', 'rgba(255,255,255,0.3)', theme.background] as any}
                        style={styles.heroGradient}
                        locations={[0, 0.5, 1]}
                    />
                </ImageBackground>
            </Animated.View>

            {/* AI Chatbot Entry Point - Top Right Button */}
            <View style={styles.headerControls}>
                <TouchableOpacity
                    style={[
                        styles.aiButton,
                        {
                            backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                        }
                    ]}
                    onPress={() => router.push('/chatbot')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="sparkles" size={18} color={isDark ? '#FFD700' : theme.primary} />
                    <Text style={[styles.aiButtonText, { color: isDark ? '#FFF' : theme.text }]}>المساعد الذكي</Text>
                </TouchableOpacity>
            </View>

            {/* Settings Entry Point - Top Left Button */}
            <View style={styles.headerControlsLeft}>
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <TouchableOpacity
                        style={[
                            styles.settingsButton,
                            {
                                backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                            }
                        ]}
                        onPress={() => router.push('/settings')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="settings-outline" size={24} color={isDark ? '#FFF' : theme.text} />
                    </TouchableOpacity>

                </Animated.View>
            </View>

            <View style={styles.heroContent}>
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    {/* Top Row: Greeting (Left) + Location (Right) */}
                    <View style={styles.infoRow}>
                        {/* Location - Right side (because of row-reverse) */}
                        <View style={[styles.locationContainer, { opacity: locationName ? 1 : 0 }]}>
                            <Ionicons name="location-sharp" size={14} color="#FFF" style={{ opacity: 0.9 }} />
                            <Text style={styles.locationText}>{locationName || '...'}</Text>
                        </View>

                        {/* Greeting - Left side */}
                        <Text style={[styles.greetingText, { color: '#FFFFFF' }]}>
                            {greeting}
                        </Text>
                    </View>

                    {/* Bottom Row: Dates */}
                    <View style={styles.dateRow}>
                        <Text style={[styles.dateText, { color: isDark ? '#FFD700' : '#FFF' }]}>
                            {hijriDate}
                        </Text>
                        <Text style={[styles.dateText, { color: '#FFFFFF', fontSize: 20 }]}>
                            {gregorianDate}
                        </Text>
                    </View>
                </Animated.View>

                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    heroContainer: {
        height: HERO_HEIGHT,
        width: '100%',
        position: 'relative',
        justifyContent: 'flex-end',
    },
    heroImageContainer: {
        ...StyleSheet.absoluteFillObject,
        height: HERO_HEIGHT + 100,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    heroContent: {
        paddingHorizontal: 20,
        paddingBottom: 24,
        zIndex: 10,
    },
    greetingText: {
        fontSize: 16,
        fontFamily: 'Tajawal-Medium',
        marginBottom: 0,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    dateText: {
        fontSize: 24, // Reduced slightly to fit both
        fontFamily: 'Tajawal-Bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    infoRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6, // Space between info row and date row
        width: '100%',
    },
    dateRow: {
        flexDirection: 'row-reverse', // Ensure RTL separation
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 16,
        width: '100%',
    },
    headerControls: {
        position: 'absolute',
        top: 60, // Safe Area offset
        right: 20,
        zIndex: 50,
    },
    aiButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 100,
        gap: 8,
        borderWidth: 1,
        // Shadow for visibility over images
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 5,
    },
    aiButtonText: {
        fontSize: 14,
        fontWeight: '700',
        fontFamily: 'Tajawal-Bold',
    },
    headerControlsLeft: {
        position: 'absolute',
        top: 60, // Safe Area offset
        left: 20,
        zIndex: 50,
    },
    settingsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        // Shadow for visibility over images
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 5,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    locationText: {
        fontSize: 12,
        fontFamily: 'Tajawal-Regular',
        color: '#FFFFFF',
        opacity: 0.9,
    }
});

export { HERO_HEIGHT };
