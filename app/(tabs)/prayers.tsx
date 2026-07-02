import { View, Text, StyleSheet, ActivityIndicator, ScrollView, ImageBackground, Dimensions, Platform, Image, Pressable, Modal, TextInput, FlatList } from 'react-native';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { getPrayerTimes, getNextPrayer } from '../../utils/prayerTimes';
import { Prayer } from 'adhan';
import { schedulePrayerNotifications } from '../../utils/notifications';
import { useTheme } from '@/hooks/useThemeColor';
import { useThemeContext } from '@/context/ThemeContext';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment-hijri';
import 'moment/locale/ar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedProps, withRepeat, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle as SvgCircle, Defs, RadialGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

// Configure moment
moment.locale('ar');
moment.updateLocale('ar', {
    postformat: (str: string) => str,
});

const { width } = Dimensions.get('window');

// Defined colors for prayers based on premium Stitch palette
const PRAYER_COLORS = {
    [Prayer.Fajr]: '#4DD0E1',     // Dawn Teal
    [Prayer.Sunrise]: '#FF7043',  // Sunrise Coral
    [Prayer.Dhuhr]: '#FFC107',    // Noon Amber
    [Prayer.Asr]: '#FFB300',      // Afternoon Bronze
    [Prayer.Maghrib]: '#AB47BC',  // Sunset Plum
    [Prayer.Isha]: '#7C4DFF',     // Night Indigo
    [Prayer.None]: '#10B981'      // Default Emerald
};

export default function PrayerTimesScreen() {
    const theme = useTheme();
    const { isDark } = useThemeContext();
    const router = useRouter();

    const defaultLocation: Location.LocationObject = {
        coords: {
            latitude: 32.987,
            longitude: 10.339,
            accuracy: 1,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
        },
        timestamp: Date.now()
    };

    const [location, setLocation] = useState<Location.LocationObject | null>(defaultLocation);
    const [locationName, setLocationName] = useState<string>('غمراسن، تونس');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [prayerTimes, setPrayerTimes] = useState<any>(
        getPrayerTimes({ latitude: 32.987, longitude: 10.339 })
    );
    const [isManualLocation, setIsManualLocation] = useState<boolean>(false);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [hasSearched, setHasSearched] = useState<boolean>(false);

    const glowValue = useSharedValue(0);

    useEffect(() => {
        glowValue.value = withRepeat(
            withTiming(1, { duration: 2500 }),
            -1, // infinite loop
            true // reverse direction (pulse in and out)
        );
    }, []);

    const animatedProps1 = useAnimatedProps(() => {
        return {
            r: 16 + glowValue.value * 8,
            opacity: 0.06 + (1 - glowValue.value) * 0.12
        };
    });

    const animatedProps2 = useAnimatedProps(() => {
        return {
            r: 28 + glowValue.value * 12,
            opacity: 0.01 + (1 - glowValue.value) * 0.05
        };
    });

    // Derived state for next prayer to prevent flicker
    const getNextPrayerWithDetails = () => {
        if (!prayerTimes) return null;
        const next = getNextPrayer(prayerTimes);

        const prayerNames: { [key: string]: string } = {
            [Prayer.Fajr]: 'الفجر',
            [Prayer.Sunrise]: 'الشروق',
            [Prayer.Dhuhr]: 'الظهر',
            [Prayer.Asr]: 'العصر',
            [Prayer.Maghrib]: 'المغرب',
            [Prayer.Isha]: 'العشاء',
            [Prayer.None]: 'الصلاة القادمة'
        };

        return {
            ...next,
            name: prayerNames[next.prayer] || 'الصلاة القادمة'
        };
    };

    const nextPrayerInfo = getNextPrayerWithDetails();

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchLocationAndAddress = async (): Promise<{ location: Location.LocationObject, name: string }> => {
        // 1. Check if location services (GPS) are enabled on the device
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
            throw new Error('الرجاء تفعيل الـ GPS لتحديث الموقع');
        }

        let freshLocation: Location.LocationObject;
        try {
            // Force a fresh high-accuracy GPS lookup (Accuracy.High)
            freshLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            });
        } catch (e) {
            console.log('getCurrentPositionAsync High failed, trying Balanced:', e);
            try {
                freshLocation = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
            } catch (err2) {
                console.log('getCurrentPositionAsync Balanced failed, falling back to getLastKnown:', err2);
                const lastKnown = await Location.getLastKnownPositionAsync({});
                const now = Date.now();
                // Only accept cached location if it is fresh (within 30 minutes = 1800000 ms)
                if (lastKnown && (now - lastKnown.timestamp) < 1800000) {
                    freshLocation = lastKnown;
                } else {
                    throw new Error('تعذر رصد الموقع. يرجى تفعيل الـ GPS والإنترنت');
                }
            }
        }

        let name = 'الموقع الحالي';
        // 1. Try OSM Nominatim reverse geocoding for forced Arabic
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${freshLocation.coords.latitude}&lon=${freshLocation.coords.longitude}&accept-language=ar`,
                { headers: { 'User-Agent': 'AthkarApp/1.0' } }
            );
            const data = await response.json();
            if (data && data.address) {
                const addr = data.address;
                const city = addr.city || addr.town || addr.village || addr.county || addr.state;
                const country = addr.country;
                name = [city, country].filter(Boolean).join('، ') || 'الموقع الحالي';
            } else {
                throw new Error('OSM returned empty address');
            }
        } catch (osmError) {
            console.log('OSM Geocode failed, falling back to native reverse geocoding:', osmError);
            // 2. Fallback to Native reverse geocoding
            try {
                const address = await Location.reverseGeocodeAsync({
                    latitude: freshLocation.coords.latitude,
                    longitude: freshLocation.coords.longitude
                });
                if (address && address.length > 0) {
                    const place = address[0];
                    let countryArabic = place.country;
                    if (place.isoCountryCode) {
                        try {
                            const regionNames = new Intl.DisplayNames(['ar'], { type: 'region' });
                            countryArabic = regionNames.of(place.isoCountryCode) || place.country;
                        } catch (e) { }
                    }
                    const parts = [];
                    if (place.city && place.city !== place.country) parts.push(place.city);
                    if (countryArabic) parts.push(countryArabic);
                    name = parts.join('، ') || 'الموقع الحالي';
                }
            } catch (nativeError) {
                console.log('Native reverseGeocode failed:', nativeError);
            }
        }

        return { location: freshLocation, name };
    };

    useEffect(() => {
        (async () => {
            // Load from cache immediately
            try {
                const cachedLocationStr = await AsyncStorage.getItem('location');
                const cachedLocationName = await AsyncStorage.getItem('location_name');
                const cachedIsManual = await AsyncStorage.getItem('isManualLocation');

                if (cachedIsManual === 'true') {
                    setIsManualLocation(true);
                }

                if (cachedLocationStr) {
                    const cachedLocation = JSON.parse(cachedLocationStr);
                    setLocation(cachedLocation);

                    if (cachedLocationName) {
                        setLocationName(cachedLocationName);
                    }

                    const times = getPrayerTimes({
                        latitude: cachedLocation.coords.latitude,
                        longitude: cachedLocation.coords.longitude
                    });
                    setPrayerTimes(times);
                } else {
                    // Fallback to Ghomrassen, Tunisia on clean install
                    setLocation(defaultLocation);
                    setLocationName('غمراسن، تونس');
                    const times = getPrayerTimes({
                        latitude: defaultLocation.coords.latitude,
                        longitude: defaultLocation.coords.longitude
                    });
                    setPrayerTimes(times);
                    
                    await AsyncStorage.setItem('location', JSON.stringify(defaultLocation));
                    await AsyncStorage.setItem('location_name', 'غمراسن، تونس');
                }
            } catch (e) {
                console.log('Error loading cached location:', e);
            }
        })();
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('ar-u-nu-latn', { hour: '2-digit', minute: '2-digit' });
    };

    const mNow = moment(currentTime);
    const gregorianDate = mNow.format('dddd، D MMMM YYYY');

    // Manual Hijri Month Mapping to ensure Arabic
    const hijriMonths = [
        'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر',
        'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
        'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];
    const hDay = mNow.format('iD');
    const hMonthIndex = parseInt(mNow.format('iM')) - 1; // 0-based index
    const hYear = mNow.format('iYYYY');
    const hijriMonthName = hijriMonths[hMonthIndex] || mNow.format('iMMMM');

    const hijriDate = `${hDay} ${hijriMonthName} ${hYear}`;

    const nextPrayer = nextPrayerInfo?.prayer || Prayer.None;

    const prayers = prayerTimes ? [
        { name: 'الفجر', key: Prayer.Fajr, time: formatTime(prayerTimes.fajr), rawTime: prayerTimes.fajr, color: PRAYER_COLORS[Prayer.Fajr] },
        { name: 'الشروق', key: Prayer.Sunrise, time: formatTime(prayerTimes.sunrise), rawTime: prayerTimes.sunrise, color: PRAYER_COLORS[Prayer.Sunrise] },
        { name: 'الظهر', key: Prayer.Dhuhr, time: formatTime(prayerTimes.dhuhr), rawTime: prayerTimes.dhuhr, color: PRAYER_COLORS[Prayer.Dhuhr] },
        { name: 'العصر', key: Prayer.Asr, time: formatTime(prayerTimes.asr), rawTime: prayerTimes.asr, color: PRAYER_COLORS[Prayer.Asr] },
        { name: 'المغرب', key: Prayer.Maghrib, time: formatTime(prayerTimes.maghrib), rawTime: prayerTimes.maghrib, color: PRAYER_COLORS[Prayer.Maghrib] },
        { name: 'العشاء', key: Prayer.Isha, time: formatTime(prayerTimes.isha), rawTime: prayerTimes.isha, color: PRAYER_COLORS[Prayer.Isha] },
    ] : [];

    // --- Logic for Previous/Current Prayer and Progress ---
    const getPreviousPrayerKey = (nextKey: string): string => {
        switch (nextKey) {
            case Prayer.Fajr: return Prayer.Isha;
            case Prayer.Sunrise: return Prayer.Fajr;
            case Prayer.Dhuhr: return Prayer.Sunrise;
            case Prayer.Asr: return Prayer.Dhuhr;
            case Prayer.Maghrib: return Prayer.Asr;
            case Prayer.Isha: return Prayer.Maghrib;
            default: return Prayer.Fajr;
        }
    };

    const currentPrayerKey = getPreviousPrayerKey(nextPrayer);

    // Find current prayer name
    const currentPrayerObj = prayers.find(p => p.key === currentPrayerKey);
    const currentPrayerName = currentPrayerObj ? currentPrayerObj.name : (nextPrayer === Prayer.Fajr ? 'العشاء' : '--');

    // Refresh prayer times if date changes
    useEffect(() => {
        if (prayerTimes && location && location.coords) {
            const now = new Date();
            const pDate = prayerTimes.date;
            if (pDate.getDate() !== now.getDate() || pDate.getMonth() !== now.getMonth() || pDate.getFullYear() !== now.getFullYear()) {
                const times = getPrayerTimes({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                }, now);
                setPrayerTimes(times);
            }
        }
    }, [currentTime, location, prayerTimes]);

    // Calculate Progress
    let progress = 0;
    if (nextPrayerInfo && nextPrayerInfo.time) {
        let startTime: Date;

        if (currentPrayerKey === Prayer.Isha && nextPrayer === Prayer.Fajr) {
            // Special case: Isha -> Fajr (could be overnight)
            if (prayerTimes && location && location.coords) {
                // If current time is earlier than today's Fajr, we are in the "Early Morning"
                // So the cycle started at Yesterday's Isha
                if (currentTime < prayerTimes.fajr) {
                    const yesterday = new Date(currentTime);
                    yesterday.setDate(yesterday.getDate() - 1);
                    // We need yesterday's Isha time
                    const prevTimes = getPrayerTimes({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude
                    }, yesterday);
                    startTime = prevTimes.isha;
                } else {
                    // We are after today's Isha, waiting for tomorrow's Fajr
                    startTime = prayerTimes.isha;
                }
            } else {
                // Fallback
                startTime = prayerTimes ? prayerTimes.isha : new Date();
            }
        } else {
            const prevObj = prayers.find(p => p.key === currentPrayerKey);
            startTime = prevObj ? prevObj.rawTime : new Date();
        }

        const endTime = nextPrayerInfo.time;
        const totalDuration = endTime.getTime() - startTime.getTime();
        const elapsed = currentTime.getTime() - startTime.getTime();

        if (totalDuration > 0) {
            progress = Math.min(Math.max(elapsed / totalDuration, 0), 1);
        }
    }

    // Calculate countdown
    let countdownStr = '';
    let targetTime = nextPrayerInfo?.time;

    if (targetTime) {
        const diff = targetTime.getTime() - currentTime.getTime();
        if (diff > 0) {
            const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
            const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
            countdownStr = `${h}:${m}:${s}`;
        } else {
            countdownStr = '00:00:00';
        }
    }

    // Alarm preferences mapping
    const [alarms, setAlarms] = useState<{ [key: string]: 'active' | 'silent' | 'vibrate' }>({
        [Prayer.Fajr]: 'active',
        [Prayer.Sunrise]: 'silent',
        [Prayer.Dhuhr]: 'active',
        [Prayer.Asr]: 'active',
        [Prayer.Maghrib]: 'vibrate',
        [Prayer.Isha]: 'active',
    });

    useEffect(() => {
        (async () => {
            try {
                const storedAlarms = await AsyncStorage.getItem('prayerAlarms');
                if (storedAlarms) {
                    setAlarms(JSON.parse(storedAlarms));
                }
            } catch (e) {
                console.log('Error loading alarms:', e);
            }
        })();
    }, []);

    const toggleAlarm = async (prayerKey: string) => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {
            console.log('Error triggering haptics:', e);
        }

        const nextAlarmState: { [key: string]: 'active' | 'silent' | 'vibrate' } = {
            active: 'silent',
            silent: 'vibrate',
            vibrate: 'active',
        };
        
        const currentAlarm = alarms[prayerKey] || 'active';
        const nextAlarm = nextAlarmState[currentAlarm];
        const newAlarms = { ...alarms, [prayerKey]: nextAlarm };
        setAlarms(newAlarms);
        
        try {
            await AsyncStorage.setItem('prayerAlarms', JSON.stringify(newAlarms));
        } catch (e) {
            console.log('Error saving alarm:', e);
        }
    };

    const getAlarmIcon = (state: 'active' | 'silent' | 'vibrate') => {
        switch (state) {
            case 'active': return 'notifications-sharp';
            case 'vibrate': return 'volume-mute-sharp';
            case 'silent': return 'notifications-off-sharp';
            default: return 'notifications-sharp';
        }
    };

    const getPrayerIconName = (prayerKey: string): React.ComponentProps<typeof Ionicons>['name'] => {
        switch (prayerKey) {
            case Prayer.Fajr: return 'cloudy-night-outline';
            case Prayer.Sunrise: return 'sunny-outline';
            case Prayer.Dhuhr: return 'sunny';
            case Prayer.Asr: return 'partly-sunny-outline';
            case Prayer.Maghrib: return 'partly-sunny';
            case Prayer.Isha: return 'moon-outline';
            default: return 'time-outline';
        }
    };

    // Calculate solar progress (t)
    const getSolarProgress = () => {
        if (!prayerTimes) return 0.5;
        const now = currentTime.getTime();
        const sunrise = prayerTimes.sunrise.getTime();
        const maghrib = prayerTimes.maghrib.getTime();
        
        if (now < sunrise) return 0.05;
        if (now > maghrib) return 0.95;
        
        const elapsed = now - sunrise;
        const total = maghrib - sunrise;
        return 0.05 + (elapsed / total) * 0.9;
    };

    const solarProgress = getSolarProgress();
    const x0 = 10, y0 = 110;
    const x1 = 200, y1 = -20;
    const x2 = 390, y2 = 110;
    const t = solarProgress;
    const sunCx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * x1 + t * t * x2;
    const sunCy = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * y1 + t * t * y2;

    // Altitude-based brightness dynamics
    const altitude = 1 - Math.abs(t - 0.5) * 2; // 0 at horizon, 1 at peak
    const coreRadius = 10 + altitude * 5; // 10px to 15px
    const coronaRadius = 24 + altitude * 16; // 24px to 40px
    const coreOpacity = 0.75 + altitude * 0.25; // 0.75 to 1.0
    const coronaOpacity = 0.15 + altitude * 0.25; // 0.15 to 0.40

    const refreshLocation = async () => {
        setLocationName('جاري التحديث...');
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('الرجاء السماح بالوصول إلى الموقع');
                return;
            }
            
            const result = await fetchLocationAndAddress();
            setLocation(result.location);
            setLocationName(result.name);
            await AsyncStorage.setItem('location', JSON.stringify(result.location));
            await AsyncStorage.setItem('location_name', result.name);
            
            const times = getPrayerTimes({
                latitude: result.location.coords.latitude,
                longitude: result.location.coords.longitude
            });
            setPrayerTimes(times);
            await schedulePrayerNotifications(times);
        } catch (error: any) {
            console.log('Error refreshing location:', error);
            const msg = error?.message || 'فشل التحديث';
            setLocationName(msg.length < 35 ? msg : 'فشل التحديث');
        }
    };

    const searchCity = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setHasSearched(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&accept-language=ar`,
                { headers: { 'User-Agent': 'AthkarApp/1.0' } }
            );
            const data = await response.json();
            setSearchResults(data);
        } catch (e) {
            console.log('Error searching city:', e);
        } finally {
            setIsSearching(false);
        }
    };

    const selectCity = async (item: any) => {
        setIsModalVisible(false);
        setSearchQuery('');
        setSearchResults([]);
        setErrorMsg(null);
        setHasSearched(false);
        
        const nameParts = item.display_name.split(',');
        const name = (nameParts[0] + (nameParts[1] ? '، ' + nameParts[1] : '')).trim();
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        
        const manualLoc: any = {
            coords: {
                latitude: lat,
                longitude: lon,
                accuracy: 1,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null
            },
            timestamp: Date.now()
        };
        
        setLocation(manualLoc);
        setLocationName(name);
        setIsManualLocation(true);
        
        await AsyncStorage.setItem('location', JSON.stringify(manualLoc));
        await AsyncStorage.setItem('location_name', name);
        await AsyncStorage.setItem('isManualLocation', 'true');
        
        const times = getPrayerTimes({
            latitude: lat,
            longitude: lon
        });
        setPrayerTimes(times);
        await schedulePrayerNotifications(times);
    };

    const resetToGps = async () => {
        setIsModalVisible(false);
        setIsManualLocation(false);
        setErrorMsg(null);
        setHasSearched(false);
        await AsyncStorage.setItem('isManualLocation', 'false');
        refreshLocation();
    };

    const renderLocationModal = () => {
        return (
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Pressable onPress={() => { setIsModalVisible(false); setHasSearched(false); }} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </Pressable>
                            <Text style={styles.modalTitle}>تحديد الموقع</Text>
                        </View>

                        <View style={styles.searchSection}>
                            <Text style={styles.searchLabel}>ابحث عن مدينتك لتحديد مواقيت الصلاة بدقة:</Text>
                            <View style={styles.searchRow}>
                                <Pressable onPress={searchCity} style={styles.searchBtn}>
                                    {isSearching ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Ionicons name="search" size={20} color="#FFFFFF" />
                                    )}
                                </Pressable>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="مثال: غمراسن، تطاوين..."
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    onSubmitEditing={searchCity}
                                    textAlign="right"
                                />
                            </View>
                        </View>

                        {searchResults.length > 0 ? (
                            <FlatList
                                data={searchResults}
                                keyExtractor={(item) => item.place_id.toString()}
                                style={styles.resultsList}
                                renderItem={({ item }) => (
                                    <Pressable onPress={() => selectCity(item)} style={styles.resultItem}>
                                        <Ionicons name="map-outline" size={16} color="rgba(255,255,255,0.4)" />
                                        <Text style={styles.resultText} numberOfLines={1}>
                                            {item.display_name}
                                        </Text>
                                    </Pressable>
                                )}
                            />
                        ) : (
                            hasSearched && !isSearching && (
                                <View style={styles.noResultsContainer}>
                                    <Ionicons name="alert-circle-outline" size={24} color="rgba(255,255,255,0.3)" />
                                    <Text style={styles.noResultsText}>لم يتم العثور على نتائج للبحث عن &quot;{searchQuery}&quot;</Text>
                                </View>
                            )
                        )}

                        <View style={styles.modalFooter}>
                            <Pressable onPress={resetToGps} style={styles.gpsButton}>
                                <Ionicons name="locate-outline" size={18} color="#4DD0E1" />
                                <Text style={styles.gpsButtonText}>استخدام تحديد الموقع التلقائي (GPS)</Text>
                            </Pressable>
                            {isManualLocation && (
                                <Text style={styles.statusNotice}>أنت تستخدم حالياً موقعاً تم تحديده يدوياً.</Text>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    if (errorMsg) {
        return (
            <View style={[styles.container, { backgroundColor: '#18181B', justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                <LinearGradient
                    colors={['rgba(77, 208, 225, 0.08)', 'rgba(24, 24, 27, 1)']}
                    style={StyleSheet.absoluteFill}
                />
                
                <View style={{ alignItems: 'center', width: '100%', paddingHorizontal: 16 }}>
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 112, 67, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255, 112, 67, 0.15)' }}>
                        <Ionicons name="location-outline" size={38} color="#FF7043" />
                    </View>
                    
                    <Text style={styles.errorTitle}>خطأ في تحديد الموقع</Text>
                    <Text style={styles.errorSubtitle}>{errorMsg}</Text>
                </View>

                <View style={styles.errorActionCol}>
                    <Pressable 
                        onPress={() => {
                            setIsModalVisible(true);
                        }}
                        style={({ pressed }) => [
                            styles.errorBtn, 
                            styles.primaryBtn,
                            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }
                        ]}
                    >
                        <Ionicons name="search" size={18} color="#121214" style={{ marginLeft: 8 }} />
                        <Text style={styles.primaryBtnText}>تحديد مدينة يدوياً</Text>
                    </Pressable>
                    
                    <Pressable 
                        onPress={() => {
                            setErrorMsg(null);
                            refreshLocation();
                        }}
                        style={({ pressed }) => [
                            styles.errorBtn, 
                            styles.secondaryBtn,
                            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }
                        ]}
                    >
                        <Ionicons name="refresh" size={18} color="#4DD0E1" style={{ marginLeft: 8 }} />
                        <Text style={styles.secondaryBtnText}>إعادة محاولة الاتصال بالـ GPS</Text>
                    </Pressable>

                    <Pressable 
                        onPress={async () => {
                            setErrorMsg(null);
                            setLocation(defaultLocation);
                            setLocationName('غمراسن، تونس');
                            setIsManualLocation(true);
                            await AsyncStorage.setItem('location', JSON.stringify(defaultLocation));
                            await AsyncStorage.setItem('location_name', 'غمراسن، تونس');
                            await AsyncStorage.setItem('isManualLocation', 'true');
                            const defaultTimes = getPrayerTimes({
                                latitude: 32.987,
                                longitude: 10.339
                            });
                            setPrayerTimes(defaultTimes);
                        }}
                        style={({ pressed }) => [
                            styles.errorBtn, 
                            styles.tertiaryBtn,
                            pressed && { opacity: 0.7 }
                        ]}
                    >
                        <Ionicons name="home-outline" size={16} color="rgba(255,255,255,0.5)" style={{ marginLeft: 6 }} />
                        <Text style={styles.tertiaryBtnText}>استخدام موقع غمراسن (افتراضي)</Text>
                    </Pressable>
                </View>

                {renderLocationModal()}
            </View>
        );
    }

    if (!prayerTimes) {
        return (
            <View style={[styles.container, { backgroundColor: '#121214' }]}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.text }]}>جاري حساب أوقات الصلاة...</Text>
                </View>
            </View>
        );
    }

    const activeColor = PRAYER_COLORS[currentPrayerKey as keyof typeof PRAYER_COLORS] || '#FFC107';

    return (
        <View style={[styles.container, { backgroundColor: '#121214' }]}>
            {/* Top Glow Background */}
            <View style={[styles.topGlow, { backgroundColor: activeColor }]} />
            <LinearGradient
                colors={['rgba(18, 18, 20, 0)', 'rgba(18, 18, 20, 1)']}
                style={styles.glowGradient}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Senior Top Date Header */}
                <View style={styles.topDateHeader}>
                    <Text style={styles.gregorianDateText}>{gregorianDate}</Text>
                    <View style={styles.hijriBadgeRow}>
                        <Ionicons name="calendar-clear-outline" size={18} color="#4DD0E1" style={{ marginLeft: 6 }} />
                        <Text style={styles.hijriDateText}>{hijriDate}</Text>
                    </View>
                </View>

                {/* Solar Timeline curve Card (zoneTime) */}
                <View style={styles.solarCard}>
                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.solarInner}>
                        <Svg width={width - 40} height="120" viewBox="0 0 400 120" style={styles.solarSvg}>
                            <Defs>
                                <RadialGradient id="sunCore" cx="50%" cy="50%" rx="50%" ry="50%">
                                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={coreOpacity} />
                                    <Stop offset="35%" stopColor="#FFFFFF" stopOpacity={coreOpacity * 0.95} />
                                    <Stop offset="70%" stopColor={activeColor} stopOpacity={coreOpacity * 0.4} />
                                    <Stop offset="100%" stopColor={activeColor} stopOpacity="0" />
                                </RadialGradient>
                                <RadialGradient id="sunCorona" cx="50%" cy="50%" rx="50%" ry="50%">
                                    <Stop offset="0%" stopColor={activeColor} stopOpacity={coronaOpacity} />
                                    <Stop offset="65%" stopColor={activeColor} stopOpacity={coronaOpacity * 0.25} />
                                    <Stop offset="100%" stopColor={activeColor} stopOpacity="0" />
                                </RadialGradient>
                            </Defs>
                            <Path
                                d={`M ${x0} ${y0} Q ${x1} ${y1} ${x2} ${y2}`}
                                fill="none"
                                stroke="rgba(255,255,255,0.12)"
                                strokeWidth="2.5"
                                strokeDasharray="6,6"
                            />
                            {/* Corona Halo */}
                            <SvgCircle cx={sunCx} cy={sunCy} r={coronaRadius} fill="url(#sunCorona)" />
                            {/* Luminous Core */}
                            <SvgCircle cx={sunCx} cy={sunCy} r={coreRadius} fill="url(#sunCore)" />
                            {/* Animated Breathing Corona Flares */}
                            <AnimatedCircle cx={sunCx} cy={sunCy} fill={activeColor} animatedProps={animatedProps1} />
                            <AnimatedCircle cx={sunCx} cy={sunCy} fill={activeColor} animatedProps={animatedProps2} />
                        </Svg>
                        
                        <View style={styles.solarMeta}>
                            <View style={styles.solarLabelPill}>
                                <Text style={styles.solarLabel}>الصلاة الحالية</Text>
                            </View>
                            <Text style={[styles.solarPrayerName, { color: activeColor }]}>{currentPrayerName}</Text>
                            <View style={styles.countdownRow}>
                                <Ionicons name="time-outline" size={17} color="rgba(255,255,255,0.45)" style={{ marginLeft: 4 }} />
                                <Text style={styles.solarCountdown}>متبقي {countdownStr}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Prayers Timeline Checklist */}
                <Text style={styles.sectionTitle}>مواقيت اليوم</Text>
                <View style={styles.prayersList}>
                    {prayers.map((prayer, index) => {
                        const isActive = prayer.key === currentPrayerKey;
                        const isSunrise = prayer.key === Prayer.Sunrise;

                        if (isSunrise) {
                            return (
                                <Animated.View
                                    key={index}
                                    entering={FadeInDown.delay(100 + index * 50).springify()}
                                    style={styles.sunriseCard}
                                >
                                    <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
                                    <View style={styles.normalCardContent}>
                                        <View style={styles.cardInfoLeft}>
                                            <View style={styles.sunriseIconWrap}>
                                                <Ionicons name={getPrayerIconName(prayer.key) as any} size={20} color={prayer.color} />
                                            </View>
                                            <View>
                                                <Text style={styles.sunriseTitle}>{prayer.name}</Text>
                                                <Text style={styles.sunriseTime}>{prayer.time}</Text>
                                            </View>
                                        </View>
                                        <Pressable
                                            onPress={() => toggleAlarm(prayer.key)}
                                            style={styles.normalAlarmButton}
                                        >
                                            <Ionicons
                                                name={getAlarmIcon(alarms[prayer.key])}
                                                size={18}
                                                color={prayer.color}
                                            />
                                        </Pressable>
                                    </View>
                                </Animated.View>
                            );
                        }

                        if (isActive) {
                            const timeParts = prayer.time.split(' ');
                            let timeStr = timeParts[0];
                            let suffixStr = timeParts[1] || '';
                            if (!suffixStr) {
                                const match = prayer.time.match(/^([\d:]+)\s*([a-zA-Z\u0625-\u064a]+)?$/);
                                if (match) {
                                    timeStr = match[1];
                                    suffixStr = match[2] || '';
                                }
                            }

                            return (
                                <Animated.View
                                    key={index}
                                    entering={FadeInDown.delay(100 + index * 50).springify()}
                                    style={[
                                        styles.activeCardGlowWrapper,
                                        {
                                            shadowColor: prayer.color,
                                        }
                                    ]}
                                >
                                    <LinearGradient
                                        colors={[prayer.color + '88', 'rgba(255,255,255,0.02)', prayer.color + '15']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{ borderRadius: 24, padding: 1.5 }}
                                    >
                                        <View style={styles.activeCardInner}>
                                            <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
                                            <LinearGradient
                                                colors={[prayer.color + '15', 'transparent']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 0, y: 1 }}
                                                style={StyleSheet.absoluteFillObject}
                                            />
                                            <View style={[styles.activeAccentBar, { backgroundColor: prayer.color }]} />
                                            <View style={styles.activeCardContent}>
                                                <View style={styles.cardInfoLeft}>
                                                    <View style={[styles.activeIconWrap, { backgroundColor: prayer.color + '22', borderColor: prayer.color + '44' }]}>
                                                        <Ionicons name={getPrayerIconName(prayer.key) as any} size={24} color={prayer.color} />
                                                    </View>
                                                    <View>
                                                        <View style={styles.activeBadgeRow}>
                                                            <Text style={styles.activeTitle}>{prayer.name}</Text>
                                                            <View style={[styles.activeBadge, { backgroundColor: prayer.color + '25' }]}>
                                                                <Text style={[styles.activeBadgeText, { color: prayer.color }]}>الآن</Text>
                                                            </View>
                                                        </View>
                                                        <Text style={styles.activeTimeDisplay}>
                                                            {timeStr} <Text style={styles.activeTimeSuffix}>{suffixStr}</Text>
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={styles.activeActionCol}>
                                                    <Pressable
                                                        onPress={() => toggleAlarm(prayer.key)}
                                                        style={[styles.activeAlarmButton, { backgroundColor: prayer.color + '22' }]}
                                                    >
                                                        <Ionicons name={getAlarmIcon(alarms[prayer.key])} size={20} color={prayer.color} />
                                                    </Pressable>
                                                    <Text style={[styles.activeCountdown, { color: prayer.color }]}>
                                                        -{countdownStr}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </Animated.View>
                            );
                        }

                        // Normal Glass Card (Passed / Upcoming)
                        const isPassed = prayer.rawTime < currentTime;

                        return (
                            <Animated.View
                                key={index}
                                entering={FadeInDown.delay(100 + index * 50).springify()}
                                style={[styles.normalCard, isPassed && { opacity: 0.5 }]}
                            >
                                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                                <View style={styles.normalCardContent}>
                                    <View style={styles.cardInfoLeft}>
                                        <View style={[styles.normalIconWrap, { backgroundColor: prayer.color + '15' }]}>
                                            <Ionicons name={getPrayerIconName(prayer.key) as any} size={20} color={prayer.color} />
                                        </View>
                                        <View>
                                            <Text style={styles.normalTitle}>{prayer.name}</Text>
                                            <Text style={styles.normalSubtext}>
                                                {isPassed ? 'مضت' : 'قادمة'} • {prayer.time}
                                            </Text>
                                        </View>
                                    </View>
                                    <Pressable
                                        onPress={() => toggleAlarm(prayer.key)}
                                        style={styles.normalAlarmButton}
                                    >
                                        <Ionicons
                                            name={getAlarmIcon(alarms[prayer.key])}
                                            size={18}
                                            color={isPassed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.45)'}
                                        />
                                    </Pressable>
                                </View>
                            </Animated.View>
                        );
                    })}
                </View>

                {/* Sunnah Prayers Section */}
                <View style={styles.sunnahContainer}>
                    <Text style={styles.sectionTitle}>أوقات السنن</Text>
                    <View style={styles.sunnahGrid}>
                        <View style={styles.sunnahCard}>
                            <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
                            <Text style={styles.sunnahLabel}>منتصف الليل</Text>
                            <Text style={styles.sunnahTime}>
                                {prayerTimes?.middle ? formatTime(prayerTimes.middle) : '--:--'}
                            </Text>
                        </View>

                        <View style={styles.sunnahCard}>
                            <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
                            <Text style={styles.sunnahLabel}>قيام الليل</Text>
                            <Text style={styles.sunnahTime}>
                                {prayerTimes?.qiyam ? formatTime(prayerTimes.qiyam) : '--:--'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Bottom Padding for Scroll */}
                <View style={{ height: 160 }} />
            </ScrollView>

            {/* Contextual Bottom Location Banner */}
            <Pressable onPress={() => setIsModalVisible(true)} style={styles.locationBanner}>
                <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.locationBannerContent}>
                    <View style={styles.locationInfoLeft}>
                        <Ionicons name="location" size={16} color="#4DD0E1" />
                        <Text style={styles.locationBannerText} numberOfLines={1}>
                            {locationName} {location?.coords ? `(${location.coords.latitude.toFixed(3)}, ${location.coords.longitude.toFixed(3)})` : ''}
                        </Text>
                    </View>
                    <Pressable
                        onPress={refreshLocation}
                        style={({ pressed }) => [
                            styles.locationRefreshButton,
                            pressed && { opacity: 0.7 }
                        ]}
                    >
                        <Text style={styles.locationRefreshText}>تحديث</Text>
                        <Ionicons name="refresh" size={14} color="#4DD0E1" />
                    </Pressable>
                </View>
            </Pressable>

            {/* Location Selector Modal */}
            {renderLocationModal()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        fontFamily: 'Tajawal-Medium',
    },
    loadingText: {
        marginTop: 10,
        fontFamily: 'Tajawal-Medium',
    },
    topGlow: {
        position: 'absolute',
        top: -150,
        left: -50,
        right: -50,
        height: 400,
        borderRadius: 200,
        opacity: 0.12,
    },
    glowGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
    },
    topDateHeader: {
        alignItems: 'center',
        marginTop: Platform.OS === 'ios' ? 56 : 36,
        marginBottom: 20,
        width: '100%',
    },
    gregorianDateText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.45)',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        fontFamily: 'Tajawal-Medium',
        marginBottom: 6,
    },
    hijriBadgeRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: 'rgba(77, 208, 225, 0.08)',
        borderColor: 'rgba(77, 208, 225, 0.15)',
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 16,
    },
    hijriDateText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4DD0E1',
        fontFamily: 'Tajawal-Bold',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    solarCard: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        marginBottom: 16,
    },
    solarInner: {
        padding: 20,
        alignItems: 'center',
    },
    solarSvg: {
        marginBottom: 12,
        alignSelf: 'center',
    },
    solarMeta: {
        alignItems: 'center',
        marginTop: 6,
    },
    solarLabelPill: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 12,
        paddingVertical: 3,
        borderRadius: 12,
        marginBottom: 4,
    },
    solarLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        fontFamily: 'Tajawal-Medium',
    },
    solarPrayerName: {
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-Bold',
        marginBottom: 4,
    },
    countdownRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },
    solarCountdown: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.6)',
        fontFamily: 'Tajawal-Medium',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        fontFamily: 'Tajawal-Bold',
        textAlign: 'right',
        marginBottom: 14,
        marginTop: 10,
    },
    prayersList: {
        gap: 12,
    },
    sunriseCard: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        borderStyle: 'dashed',
        backgroundColor: 'rgba(255,255,255,0.01)',
        opacity: 0.55,
        minHeight: 72,
    },
    cardContent: {
        padding: 16,
    },
    sunriseIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sunriseTitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.75)',
        fontFamily: 'Tajawal-Medium',
        textAlign: 'right',
    },
    sunriseTime: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        fontFamily: 'Tajawal-Regular',
        textAlign: 'right',
    },
    activeCardGlowWrapper: {
        borderRadius: 24,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35, // Softer ambient glow
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 8,
    },
    activeCardInner: {
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.03)',
        minHeight: 100,
    },
    activeTimeSuffix: {
        fontSize: 16,
        opacity: 0.65,
        fontWeight: 'bold',
    },
    activeAccentBar: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 6,
    },
    activeCardContent: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
        paddingRight: 24,
    },
    activeIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeBadgeRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
    },
    activeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        fontFamily: 'Tajawal-Bold',
    },
    activeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    activeBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-Bold',
    },
    activeTimeDisplay: {
        fontSize: 34,
        fontWeight: '800',
        color: '#FFFFFF',
        fontFamily: 'Tajawal-Bold',
        marginTop: 2,
    },
    activeActionCol: {
        alignItems: 'flex-start',
        gap: 8,
    },
    activeAlarmButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    activeCountdown: {
        fontSize: 11,
        fontWeight: '600',
        fontFamily: 'Tajawal-Medium',
    },
    normalCard: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        minHeight: 76,
    },
    normalCardContent: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    cardInfoLeft: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 14,
    },
    normalIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    normalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        fontFamily: 'Tajawal-Medium',
        textAlign: 'right',
    },
    normalSubtext: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        fontFamily: 'Tajawal-Regular',
        textAlign: 'right',
        marginTop: 2,
    },
    normalAlarmButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    sunnahContainer: {
        marginTop: 24,
    },
    sunnahGrid: {
        flexDirection: 'row-reverse',
        gap: 12,
    },
    sunnahCard: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 90,
    },
    sunnahLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.45)',
        fontFamily: 'Tajawal-Regular',
        marginBottom: 6,
    },
    sunnahTime: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        fontFamily: 'Tajawal-Bold',
    },
    locationBanner: {
        position: 'absolute',
        bottom: 95,
        left: 20,
        right: 20,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(0,0,0,0.4)',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
    },
    locationBannerContent: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    locationInfoLeft: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    locationBannerText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        fontFamily: 'Tajawal-Medium',
        textAlign: 'right',
    },
    locationRefreshButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 14,
        backgroundColor: 'rgba(77,208,225,0.1)',
    },
    locationRefreshText: {
        fontSize: 11,
        color: '#4DD0E1',
        fontWeight: 'bold',
        fontFamily: 'Tajawal-Bold',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'rgba(20, 20, 24, 0.98)',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 24,
        maxHeight: '75%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    closeButton: {
        padding: 6,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        fontFamily: 'Tajawal-Bold',
    },
    searchSection: {
        marginBottom: 16,
    },
    searchLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        fontFamily: 'Tajawal-Medium',
        marginBottom: 10,
        textAlign: 'right',
    },
    searchRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderRadius: 16,
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontFamily: 'Tajawal-Medium',
        fontSize: 15,
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    searchBtn: {
        padding: 8,
        backgroundColor: 'rgba(77, 208, 225, 0.2)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultsList: {
        maxHeight: 200,
        marginBottom: 16,
    },
    resultItem: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.04)',
    },
    resultText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        fontFamily: 'Tajawal-Regular',
        flex: 1,
        textAlign: 'right',
    },
    modalFooter: {
        alignItems: 'center',
        marginTop: 10,
        gap: 10,
    },
    gpsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(77, 208, 225, 0.1)',
        borderColor: 'rgba(77, 208, 225, 0.2)',
        borderWidth: 1,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 20,
        width: '100%',
        justifyContent: 'center',
    },
    gpsButtonText: {
        color: '#4DD0E1',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-Bold',
    },
    statusNotice: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.45)',
        fontFamily: 'Tajawal-Regular',
        marginTop: 4,
    },
    errorTitle: {
        fontSize: 22,
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    errorSubtitle: {
        fontSize: 14,
        fontFamily: 'Tajawal-Regular',
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
    },
    errorActionCol: {
        width: '100%',
        maxWidth: 280,
        gap: 12,
        marginTop: 10,
    },
    errorBtn: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: '100%',
    },
    primaryBtn: {
        backgroundColor: '#4DD0E1',
    },
    primaryBtnText: {
        color: '#121214',
        fontSize: 15,
        fontFamily: 'Tajawal-Bold',
    },
    secondaryBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    secondaryBtnText: {
        color: '#4DD0E1',
        fontSize: 15,
        fontFamily: 'Tajawal-Bold',
    },
    tertiaryBtn: {
        backgroundColor: 'transparent',
    },
    tertiaryBtnText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
        fontFamily: 'Tajawal-Medium',
    },
    noResultsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        gap: 8,
    },
    noResultsText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.45)',
        fontFamily: 'Tajawal-Regular',
        textAlign: 'center',
    },
});
