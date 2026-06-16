import { View, Text, StyleSheet, ActivityIndicator, ScrollView, ImageBackground, Dimensions, Platform, Image } from 'react-native';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { getPrayerTimes, getNextPrayer } from '../../utils/prayerTimes';
import { Prayer } from 'adhan';
import { schedulePrayerNotifications } from '../../utils/notifications';
import { useTheme } from '@/hooks/useThemeColor';
import { useThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment-hijri';
import 'moment/locale/ar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure moment
moment.locale('ar');
moment.updateLocale('ar', {
    postformat: (str: string) => str,
});

const { width } = Dimensions.get('window');

// Defined colors for prayers based on reference image
const PRAYER_COLORS = {
    [Prayer.Fajr]: '#3B82F6',     // Blue
    [Prayer.Sunrise]: '#F97316',  // Orange
    [Prayer.Dhuhr]: '#EAB308',    // Yellowish
    [Prayer.Asr]: '#F59E0B',      // Gold/Orange
    [Prayer.Maghrib]: '#8B5CF6',  // Purple
    [Prayer.Isha]: '#4F46E5',     // Indigo
    [Prayer.None]: '#10B981'      // Default Green
};

export default function PrayerTimesScreen() {
    const theme = useTheme();
    const { isDark } = useThemeContext();
    const router = useRouter();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [locationName, setLocationName] = useState<string>('جاري تحديد الموقع...');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [prayerTimes, setPrayerTimes] = useState<any>(null);

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

    useEffect(() => {
        (async () => {
            // 1. Try to load from cache immediately
            try {
                const cachedLocationStr = await AsyncStorage.getItem('cachedLocation');
                const cachedLocationName = await AsyncStorage.getItem('cachedLocationName');

                if (cachedLocationStr) {
                    const cachedLocation = JSON.parse(cachedLocationStr);
                    setLocation(cachedLocation);

                    if (cachedLocationName) {
                        setLocationName(cachedLocationName);
                    }

                    // Calculate times for TODAY based on cached location
                    // This allows offline usage even if the day has changed
                    const times = getPrayerTimes({
                        latitude: cachedLocation.coords.latitude,
                        longitude: cachedLocation.coords.longitude
                    });
                    setPrayerTimes(times);
                }
            } catch (e) {
                console.log('Error loading cached location:', e);
            }

            // 2. Request permissions and fetch fresh location
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('الرجاء السماح بالوصول إلى الموقع');
                setLocationName('الموقع غير متاح');
                return;
            }

            try {
                let location = await Location.getCurrentPositionAsync({});
                setLocation(location);
                // Save to cache for offline use
                await AsyncStorage.setItem('cachedLocation', JSON.stringify(location));

                // Reverse Geocoding with Arabic Preference (OSM Nominatim)
                try {
                    // 1. Try OSM Nominatim API for forced Arabic
                    // Using fetch is safe as it's a standard web API available in React Native
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.coords.latitude}&lon=${location.coords.longitude}&accept-language=ar`,
                        {
                            headers: {
                                'User-Agent': 'AthkarApp/1.0'
                            }
                        }
                    );

                    const data = await response.json();

                    if (data && data.address) {
                        const addr = data.address;
                        // Prioritize: City -> Town -> Village -> County -> State
                        const city = addr.city || addr.town || addr.village || addr.county || addr.state;
                        const country = addr.country;

                        const parts = [];
                        if (city) parts.push(city);
                        if (country) parts.push(country);

                        const name = parts.join('، ') || 'الموقع الحالي';
                        setLocationName(name);
                        // Save location name to cache
                        await AsyncStorage.setItem('cachedLocationName', name);
                    } else {
                        throw new Error('No address from OSM');
                    }

                } catch (osmError) {
                    // 2. Fallback to Native Geocoder if OSM fails
                    console.log('OSM Geocode failed, falling back to native:', osmError);
                    try {
                        const address = await Location.reverseGeocodeAsync({
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude
                        });

                        if (address && address.length > 0) {
                            const place = address[0];

                            // Try to translate country to Arabic via Intl
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

                            const name = parts.join('، ') || 'الموقع الحالي';
                            setLocationName(name);
                            // Save location name to cache
                            await AsyncStorage.setItem('cachedLocationName', name);
                        } else {
                            setLocationName('الموقع الحالي');
                        }
                    } catch (nativeError) {
                        console.log(nativeError);
                        setLocationName('الموقع الحالي');
                    }
                }

                const times = getPrayerTimes({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                });
                setPrayerTimes(times);

                // Schedule prayer notifications
                await schedulePrayerNotifications(times);

            } catch (locationError) {
                console.log('Error getting fresh location:', locationError);
                // If we failed to get fresh location but have cached data, we are fine.
                // If no cached data, maybe set error message?
                // For now, we just rely on cached data if available.
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

    // Helper to determine background image
    const getBackgroundImage = () => {
        switch (nextPrayer) {
            case Prayer.Sunrise: return require('../../assets/images/salat_fajer_time.png');
            case Prayer.Dhuhr: return require('../../assets/images/salat_dhoher_time.png');
            case Prayer.Asr: return require('../../assets/images/salat_dhoher_time.png');
            case Prayer.Maghrib: return require('../../assets/images/salat_aser_time.png');
            case Prayer.Isha: return require('../../assets/images/salat_meghreb_time.png');
            case Prayer.Fajr: return require('../../assets/images/salat_icha_time.png');
            default: return isDark ? require('../../assets/images/islam.jpg') : require('../../assets/images/islam_light.png');
        }
    };

    if (errorMsg) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.center}>
                    <Text style={[styles.errorText, { color: theme.text }]}>{errorMsg}</Text>
                </View>
            </View>
        );
    }

    if (!prayerTimes) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.text }]}>جاري حساب أوقات الصلاة...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ImageBackground
                source={getBackgroundImage()}
                style={styles.heroBg}
                resizeMode="cover"
            >
                {/* Dark Overlay for readability */}
                <LinearGradient
                    colors={isDark
                        ? ['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.85)', theme.background]
                        : ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)', theme.background]}
                    style={StyleSheet.absoluteFill}
                    locations={[0, 0.5, 1]}
                />

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header: Date & Location */}
                    <View style={styles.headerContainer}>
                        <View style={styles.locationRow}>
                            <Ionicons name="location-sharp" size={20} color={theme.primary} />
                            <Text style={[styles.locationText, { color: '#FFF' }]}>{locationName}</Text>
                        </View>
                        <Text style={[styles.dateText, { color: '#FFF' }]}>{gregorianDate}</Text>
                        <Text style={[styles.hijriText, { color: 'rgba(255,255,255,0.8)' }]}>{hijriDate}</Text>
                    </View>

                    {/* HERO CARD: Countdown & Progress */}
                    {/* Increased size and padding */}
                    <View style={[styles.heroCard, { borderColor: theme.primary }]}>
                        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />

                        <View style={styles.heroInner}>
                            {/* Top Badge */}
                            <View style={[styles.nextBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                                <Ionicons name="time-outline" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                                <Text style={[styles.nextBadgeText, { color: theme.primary }]}>الصلاة القادمة</Text>
                            </View>

                            {/* Countdown - Much Bigger */}
                            <Text style={[styles.countdownText, { color: '#FFF' }]}>{countdownStr}</Text>

                            {/* Until Label */}
                            <Text style={[styles.untilText, { color: 'rgba(255,255,255,0.7)' }]}>
                                متبقي على <Text style={{ color: '#FFF', fontWeight: '800' }}>{nextPrayerInfo?.name}</Text>
                            </Text>

                            {/* Progress Bar */}
                            <View style={styles.progressContainer}>
                                <View style={[styles.progressBarBg, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                                    <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: theme.primary }]} />
                                </View>
                            </View>

                            {/* Footer: Current & Upcoming - Increased Text Size */}
                            <View style={styles.heroFooter}>
                                <View style={styles.footerItem}>
                                    <Text style={styles.footerLabel}>الحالية</Text>
                                    <Text style={[styles.footerValue, { color: '#FFF' }]}>{currentPrayerName}</Text>
                                </View>
                                <View style={[styles.footerItem, { alignItems: 'flex-start' }]}>
                                    <Text style={styles.footerLabel}>القادمة</Text>
                                    <Text style={[styles.footerValue, { color: theme.primary }]}>
                                        {nextPrayerInfo?.name} {nextPrayerInfo?.time ? formatTime(nextPrayerInfo.time) : ''}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* TITLE: Today's Schedule */}
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>مواقيت اليوم</Text>

                    {/* LIST: Daily Prayers - Increased Sizes */}
                    <View style={styles.prayersList}>
                        {prayers.map((prayer, index) => {
                            const isNext = nextPrayer === prayer.key;
                            return (
                                <Animated.View
                                    key={index}
                                    entering={FadeInDown.delay(300 + (index * 50)).springify()}
                                    style={[
                                        styles.prayerRow,
                                        {
                                            backgroundColor: isNext ? 'rgba(16, 185, 129, 0.15)' : theme.cardBackground,
                                            borderColor: isNext ? theme.primary : 'transparent',
                                            borderWidth: isNext ? 1.5 : 0
                                        }
                                    ]}
                                >
                                    {/* Left: Icon & Name */}
                                    <View style={styles.prayerInfoLeft}>
                                        {/* Colored Dot/Circle for Icon */}
                                        <View style={[
                                            styles.iconCircle,
                                            {
                                                backgroundColor: (prayer.key === Prayer.Fajr || prayer.key === Prayer.Sunrise || prayer.key === Prayer.Dhuhr || prayer.key === Prayer.Asr || prayer.key === Prayer.Maghrib || prayer.key === Prayer.Isha)
                                                    ? 'transparent'
                                                    : (isNext ? theme.primary : 'rgba(255,255,255,0.05)'),
                                                borderColor: (prayer.key === Prayer.Fajr || prayer.key === Prayer.Sunrise || prayer.key === Prayer.Dhuhr || prayer.key === Prayer.Asr || prayer.key === Prayer.Maghrib || prayer.key === Prayer.Isha) ? theme.primary : 'transparent',
                                                borderWidth: (prayer.key === Prayer.Fajr || prayer.key === Prayer.Sunrise || prayer.key === Prayer.Dhuhr || prayer.key === Prayer.Asr || prayer.key === Prayer.Maghrib || prayer.key === Prayer.Isha) ? 2 : 0
                                            }
                                        ]}>
                                            {/* We use a separate background layer for the specific color if not active, or just always use the specific color */}
                                            {/* Design decision: Allow specific colors always, but active state gets global highight */}
                                            {/* Re-reading user request: "colors of emoji of each salat like in the image" - so the circle should represent the prayer color always. */}
                                            {(prayer.key !== Prayer.Fajr && prayer.key !== Prayer.Sunrise && prayer.key !== Prayer.Dhuhr && prayer.key !== Prayer.Asr && prayer.key !== Prayer.Maghrib && prayer.key !== Prayer.Isha) && (
                                                <View style={[styles.iconCircleBg, { backgroundColor: prayer.color, opacity: 0.2 }]} />
                                            )}

                                            {prayer.key === Prayer.Fajr ? (
                                                <Image
                                                    source={require('../../assets/images/fajer_image.jpg')}
                                                    style={{ width: '100%', height: '100%', borderRadius: 24, transform: [{ scale: 1.1 }] }}
                                                    resizeMode="cover"
                                                />
                                            ) : prayer.key === Prayer.Sunrise ? (
                                                <Image
                                                    source={require('../../assets/images/chorouk_image.jpg')}
                                                    style={{ width: '100%', height: '100%', borderRadius: 24, transform: [{ scale: 1.1 }] }}
                                                    resizeMode="cover"
                                                />
                                            ) : prayer.key === Prayer.Dhuhr ? (
                                                <Image
                                                    source={require('../../assets/images/dhoher_image.jpg')}
                                                    style={{ width: '100%', height: '100%', borderRadius: 24, transform: [{ scale: 1.1 }] }}
                                                    resizeMode="cover"
                                                />
                                            ) : prayer.key === Prayer.Asr ? (
                                                <Image
                                                    source={require('../../assets/images/aser_image.png')}
                                                    style={{ width: '100%', height: '100%', borderRadius: 24, transform: [{ scale: 1.1 }] }}
                                                    resizeMode="cover"
                                                />
                                            ) : prayer.key === Prayer.Maghrib ? (
                                                <Image
                                                    source={require('../../assets/images/maghreb_image.jpg')}
                                                    style={{ width: '100%', height: '100%', borderRadius: 24, transform: [{ scale: 1.1 }] }}
                                                    resizeMode="cover"
                                                />
                                            ) : prayer.key === Prayer.Isha ? (
                                                <Image
                                                    source={require('../../assets/images/isha_image.jpg')}
                                                    style={{ width: '100%', height: '100%', borderRadius: 24, transform: [{ scale: 1.1 }] }}
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <Ionicons
                                                    name={
                                                        prayer.key === Prayer.Sunrise ? 'sunny' :
                                                            prayer.key === Prayer.Dhuhr ? 'sunny' :
                                                                prayer.key === Prayer.Asr ? 'cloud' :
                                                                    prayer.key === Prayer.Maghrib ? 'moon' : 'moon'
                                                    }
                                                    size={22}
                                                    color={prayer.color} // Icon itself matches the color theme
                                                />
                                            )}
                                        </View>

                                        <Text style={[styles.prayerRowName, { color: isNext ? theme.text : theme.textSecondary }]}>
                                            {prayer.name}
                                        </Text>
                                    </View>

                                    {/* Time */}
                                    <Text style={[styles.prayerRowTime, { color: isNext ? theme.text : theme.text }]}>
                                        {prayer.time}
                                    </Text>
                                </Animated.View>
                            );
                        })}
                    </View>

                    {/* Sunnah Prayers Section */}
                    <View style={styles.sunnahContainer}>
                        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 15 }]}>أوقات السنن</Text>
                        <View style={styles.sunnahGrid}>
                            <View style={[styles.sunnahCard, { backgroundColor: theme.cardBackground }]}>
                                <Text style={[styles.sunnahLabel, { color: theme.textSecondary }]}>منتصف الليل</Text>
                                <Text style={[styles.sunnahTime, { color: theme.text }]}>
                                    {prayerTimes?.middle ? formatTime(prayerTimes.middle) : '--:--'}
                                </Text>
                            </View>

                            <View style={[styles.sunnahCard, { backgroundColor: theme.cardBackground }]}>
                                <Text style={[styles.sunnahLabel, { color: theme.textSecondary }]}>قيام الليل</Text>
                                <Text style={[styles.sunnahTime, { color: theme.text }]}>
                                    {prayerTimes?.qiyam ? formatTime(prayerTimes.qiyam) : '--:--'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Spacing for Tabs */}
                    <View style={{ height: 120 }} />
                </ScrollView>
            </ImageBackground>
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
    },
    loadingText: {
        marginTop: 10,
    },
    heroBg: {
        flex: 1,
        width: '100%',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: Platform.OS === 'ios' ? 70 : 50, // Increased top padding
        paddingHorizontal: 24, // Increased horizontal padding
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    locationRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    locationText: {
        fontSize: 18, // Bigger
        fontWeight: '700',
    },
    dateText: {
        fontSize: 24, // Bigger
        fontWeight: '700',
        marginBottom: 4,
    },
    hijriText: {
        fontSize: 16, // Bigger
        fontWeight: '500',
    },
    heroCard: {
        width: '100%',
        borderRadius: 30, // More rounded
        overflow: 'hidden',
        borderWidth: 2, // Thicker border
        marginBottom: 36, // More spacing
        minHeight: 260, // Taller card
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    heroInner: {
        padding: 28, // More padding
        alignItems: 'center',
        width: '100%',
    },
    nextBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 24,
        marginBottom: 20,
    },
    nextBadgeText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
        paddingHorizontal: 4,
    },
    countdownText: {
        fontSize: 56, // MUCH Bigger
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
        marginBottom: 6,
        letterSpacing: 2,
    },
    untilText: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 30,
    },
    progressContainer: {
        width: '100%',
        marginBottom: 30, // More spacing
    },
    progressBarBg: {
        width: '100%',
        height: 8, // Thicker bar
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    heroFooter: {
        flexDirection: 'row-reverse',
        width: '100%',
        justifyContent: 'space-between',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    footerItem: {
        alignItems: 'flex-end',
    },
    footerLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13, // Bigger
        marginBottom: 6,
        fontWeight: '500',
    },
    footerValue: {
        fontSize: 16, // Bigger
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
        opacity: 0.8,
        textAlign: 'right',
        width: '100%',
        letterSpacing: 0.5,
        paddingHorizontal: 4,
    },
    prayersList: {
        width: '100%',
        gap: 14, // More gap
    },
    prayerRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20, // Bigger hit area
        borderRadius: 24, // Match Card radius style
        minHeight: 80, // Ensure substantial height
    },
    prayerInfoLeft: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 16,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    iconCircleBg: {
        ...StyleSheet.absoluteFillObject,
    },
    prayerRowName: {
        fontSize: 18, // Bigger
        fontWeight: '600',
    },
    prayerRowTime: {
        fontSize: 18, // Bigger
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    sunnahContainer: {
        marginTop: 36,
        width: '100%',
    },
    sunnahGrid: {
        flexDirection: 'row-reverse',
        gap: 14,
    },
    sunnahCard: {
        flex: 1,
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 110,
    },
    sunnahLabel: {
        fontSize: 14,
        marginBottom: 8,
        opacity: 0.8,
    },
    sunnahTime: {
        fontSize: 22,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
});
