import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Pressable, ScrollView, Linking } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useThemeColor';
import { BlurView } from 'expo-blur';

interface Mosque {
    id: number;
    lat: number;
    lon: number;
    tags?: {
        name?: string;
        'name:en'?: string;
        'name:ar'?: string;
        addr_street?: string;
    };
    distance?: number;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

export default function MosquesMap() {
    const theme = useTheme();
    const router = useRouter();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [mosques, setMosques] = useState<Mosque[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchMosques(lat: number, lon: number) {
        try {
            const query = `
                [out:json][timeout:25];
                (
                  node["amenity"="place_of_worship"]["religion"="muslim"](around:10000,${lat},${lon});
                  way["amenity"="place_of_worship"]["religion"="muslim"](around:10000,${lat},${lon});
                );
                out center;
            `;

            const response = await fetch('https://overpass.kumi.systems/api/interpreter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'AthkarApp/1.0'
                },
                body: `data=${encodeURIComponent(query)}`
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const text = await response.text();
            if (text.trim().startsWith('<')) {
                throw new Error('Server returned HTML');
            }

            const data = JSON.parse(text);
            const processedMosques = data.elements.map((element: any) => {
                const mLat = element.lat || element.center?.lat;
                const mLon = element.lon || element.center?.lon;
                return {
                    id: element.id,
                    lat: mLat,
                    lon: mLon,
                    tags: element.tags,
                    distance: getDistance(lat, lon, mLat, mLon)
                };
            }).filter((m: any) => m.lat && m.lon)
              .sort((a: Mosque, b: Mosque) => (a.distance || 0) - (b.distance || 0));

            setMosques(processedMosques);
        } catch (error) {
            console.error(error);
            setErrorMsg('تعذر الاتصال بخادم تحديد المواقع القريبة');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('الرجاء السماح بالوصول إلى الموقع الجغرافي');
                setLoading(false);
                return;
            }

            try {
                const currentLocation = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                });
                setLocation(currentLocation);
                fetchMosques(currentLocation.coords.latitude, currentLocation.coords.longitude);
            } catch (err) {
                const fallbackCoords = { coords: { latitude: 32.987, longitude: 10.339 } } as any;
                setLocation(fallbackCoords);
                fetchMosques(32.987, 10.339);
            }
        })();
    }, []);

    const openNavigation = (mosque: Mosque) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${mosque.lat},${mosque.lon}`;
        Linking.openURL(url);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    style={({ pressed }) => [
                        styles.backButton,
                        { backgroundColor: 'rgba(255,255,255,0.05)', opacity: pressed ? 0.7 : 1 }
                    ]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
                </Pressable>
                <Text style={styles.headerTitle}>المساجد القريبة</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4DD0E1" />
                    <Text style={styles.loadingText}>جاري البحث عن المساجد القريبة...</Text>
                </View>
            ) : errorMsg && mosques.length === 0 ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#FF7043" />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {mosques.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="map-outline" size={48} color="rgba(255,255,255,0.3)" />
                            <Text style={styles.emptyText}>لم يتم العثور على مساجد في نطاق 10 كم</Text>
                        </View>
                    ) : (
                        mosques.map((mosque) => {
                            const name = mosque.tags?.['name:ar'] || mosque.tags?.name || 'مسجد غير مسمى';
                            const distanceStr = mosque.distance 
                                ? (mosque.distance < 1 
                                    ? `${Math.round(mosque.distance * 1000)} متر` 
                                    : `${mosque.distance.toFixed(1)} كم`)
                                : '';

                            return (
                                <View key={mosque.id} style={styles.card}>
                                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                                    <View style={styles.cardHeader}>
                                        <View style={styles.iconWrap}>
                                            <Ionicons name="navigate-circle-outline" size={22} color="#4DD0E1" />
                                        </View>
                                        <View style={styles.infoCol}>
                                            <Text style={styles.mosqueName}>{name}</Text>
                                            <Text style={styles.mosqueSub}>{distanceStr} • {mosque.tags?.addr_street || 'موقع جغرافي قريب'}</Text>
                                        </View>
                                    </View>
                                    <Pressable
                                        onPress={() => openNavigation(mosque)}
                                        style={({ pressed }) => [
                                            styles.navButton,
                                            pressed && { opacity: 0.8 }
                                        ]}
                                    >
                                        <Text style={styles.navButtonText}>الاتجاهات (خرائط Google)</Text>
                                        <Ionicons name="map-outline" size={16} color="#121214" />
                                    </Pressable>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        gap: 15,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        fontFamily: 'Tajawal-Bold',
        textAlign: 'right',
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        color: 'rgba(255,255,255,0.7)',
        fontFamily: 'Tajawal-Medium',
        fontSize: 15,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        gap: 12,
    },
    errorText: {
        color: '#FF7043',
        fontFamily: 'Tajawal-Medium',
        fontSize: 16,
        textAlign: 'center',
    },
    scrollContent: {
        padding: 20,
        gap: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
        gap: 12,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.4)',
        fontFamily: 'Tajawal-Medium',
        fontSize: 16,
    },
    card: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: 20,
        gap: 16,
    },
    cardHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 14,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(77, 208, 225, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoCol: {
        flex: 1,
        gap: 4,
    },
    mosqueName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        fontFamily: 'Tajawal-Bold',
        textAlign: 'right',
    },
    mosqueSub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        fontFamily: 'Tajawal-Regular',
        textAlign: 'right',
    },
    navButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#4DD0E1',
        borderRadius: 16,
        paddingVertical: 12,
    },
    navButtonText: {
        color: '#121214',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-Bold',
    },
});
