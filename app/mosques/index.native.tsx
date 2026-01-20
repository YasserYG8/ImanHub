import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Platform, Alert, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useThemeColor';

interface Mosque {
    id: number;
    lat: number;
    lon: number;
    tags?: {
        name?: string;
        'name:en'?: string;
        'name:ar'?: string;
    };
}

export default function MosquesMap() {
    const theme = useTheme();
    const router = useRouter();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [mosques, setMosques] = useState<Mosque[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                setLoading(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
            fetchMosques(location.coords.latitude, location.coords.longitude);
        })();
    }, []);

    const fetchMosques = async (lat: number, lon: number) => {
        try {
            // Overpass API Query: Find nodes with amenity=place_of_worship AND religion=muslim within 5000m (5km)
            const query = `
                [out:json];
                (
                  node["amenity"="place_of_worship"]["religion"="muslim"](around:5000,${lat},${lon});
                  way["amenity"="place_of_worship"]["religion"="muslim"](around:5000,${lat},${lon});
                );
                out center;
            `;

            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `data=${encodeURIComponent(query)}`
            });

            const data = await response.json();

            // Process data to unify nodes and ways (ways need 'center' which 'out center' provides)
            const processedMosques = data.elements.map((element: any) => ({
                id: element.id,
                lat: element.lat || element.center?.lat,
                lon: element.lon || element.center?.lon,
                tags: element.tags
            })).filter((m: any) => m.lat && m.lon);

            setMosques(processedMosques);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch nearby mosques');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header / Back Button */}
            <TouchableOpacity
                style={[styles.backButton, { backgroundColor: theme.cardBackground }]}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-forward" size={24} color={theme.text} />
            </TouchableOpacity>

            {!location ? (
                <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.text }]}>
                        {errorMsg ? errorMsg : 'Jari Menentukan Lokasi...'}
                    </Text>
                </View>
            ) : (
                <MapView
                    style={styles.map}
                    provider={PROVIDER_DEFAULT}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                    initialRegion={{
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                >
                    {mosques.map((mosque) => (
                        <Marker
                            key={mosque.id}
                            coordinate={{ latitude: mosque.lat, longitude: mosque.lon }}
                            title={mosque.tags?.['name:ar'] || mosque.tags?.name || 'Mosque'}
                            description={mosque.tags?.name || 'Masjid'}
                            pinColor="green"
                        />
                    ))}
                </MapView>
            )}

            {/* Loading Indicator for Mosques */}
            {location && loading && (
                <View style={styles.searchingOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.searchingText}>Searching nearby...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
        borderRadius: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontFamily: 'Tajawal-Medium'
    },
    searchingOverlay: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    searchingText: {
        color: '#fff',
        fontFamily: 'Tajawal-Medium'
    }
});
