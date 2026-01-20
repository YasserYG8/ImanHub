
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
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

// Configure moment
moment.locale('ar');
moment.updateLocale('ar', {
    postformat: (str: string) => str,
});

const { width } = Dimensions.get('window');

export default function PrayerTimesScreen() {
    const theme = useTheme();
    const { isDark } = useThemeContext();
    const router = useRouter();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
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
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('الرجاء السماح بالوصول إلى الموقع');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);

            const times = getPrayerTimes({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
            setPrayerTimes(times);

            // Schedule prayer notifications
            await schedulePrayerNotifications(times);
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
        { name: 'الفجر', key: Prayer.Fajr, time: formatTime(prayerTimes.fajr), rawTime: prayerTimes.fajr },
        { name: 'الشروق', key: Prayer.Sunrise, time: formatTime(prayerTimes.sunrise), rawTime: prayerTimes.sunrise },
        { name: 'الظهر', key: Prayer.Dhuhr, time: formatTime(prayerTimes.dhuhr), rawTime: prayerTimes.dhuhr },
        { name: 'العصر', key: Prayer.Asr, time: formatTime(prayerTimes.asr), rawTime: prayerTimes.asr },
        { name: 'المغرب', key: Prayer.Maghrib, time: formatTime(prayerTimes.maghrib), rawTime: prayerTimes.maghrib },
        { name: 'العشاء', key: Prayer.Isha, time: formatTime(prayerTimes.isha), rawTime: prayerTimes.isha },
    ] : [];

    // Add extra prayers if needed (Middle/Qiyam) logic kept simple for now or added as extra info

    // Calculate countdown
    let countdownStr = '';
    let targetTime = nextPrayerInfo?.time;

    // Check if after Isha for special handling (optional, kept basic here to match existing logic flow)

    if (targetTime) {
        const diff = targetTime.getTime() - currentTime.getTime();
        if (diff > 0) {
            const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
            const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
            countdownStr = `${h}:${m}:${s}`;
        } else {
            countdownStr = 'الآن';
        }
    }

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


    // Helper to determine background image
    const getBackgroundImage = () => {
        // Logic: Check NEXT prayer to determine CURRENT interval.
        // nextPrayer is the UPCOMING prayer. 
        // So if nextPrayer is Fajr, we are in Isha time.
        // If nextPrayer is Sunrise, we are in Fajr time.

        switch (nextPrayer) {
            case Prayer.Sunrise:
                // currently Fajr - displaying Fajr image
                return require('../../assets/images/salat_fajer_time.png');

            case Prayer.Dhuhr:
                // Currently Sunrise (Shurooq) - User didn't provide specific image.
                // Using Dhuhr image as it reflects daytime/noon.
                return require('../../assets/images/salat_dhoher_time.png');

            case Prayer.Asr:
                // Currently Dhuhr - displaying Dhuhr image
                return require('../../assets/images/salat_dhoher_time.png');

            case Prayer.Maghrib:
                // Currently Asr - displaying Asr image
                return require('../../assets/images/salat_aser_time.png');

            case Prayer.Isha:
                // Currently Maghrib - displaying Maghrib image
                return require('../../assets/images/salat_meghreb_time.png');

            case Prayer.Fajr:
                // Currently Isha - displaying Isha image
                return require('../../assets/images/salat_icha_time.png');

            default:
                // Fallback / None
                return isDark ? require('../../assets/images/islam.jpg') : require('../../assets/images/islam_light.png');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* HERO SECTION WITH COUNTDOWN */}
            <View style={styles.heroContainer}>
                <ImageBackground
                    source={getBackgroundImage()}
                    style={styles.heroBg}
                    resizeMode="cover"
                >
                    <LinearGradient
                        colors={isDark ? ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)'] : ['rgba(5, 150, 105, 0.4)', 'rgba(16, 185, 129, 0.2)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <LinearGradient
                        colors={['transparent', isDark ? theme.background : 'rgba(0,0,0,0.5)']}
                        style={StyleSheet.absoluteFill}
                        locations={[0.5, 1]}
                    />
                    {/* Pattern Overlay */}
                    <View style={styles.patternOverlay}>
                        <Ionicons name="apps" size={width} color="rgba(255,255,255,0.05)" style={{ opacity: 0.5 }} />
                    </View>
                </ImageBackground>

                <ScrollView
                    style={styles.heroContent}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Row */}
                    <View style={styles.headerRow}>
                        {/* Back button removed for Tabs */}
                        {/* <Text style={[styles.headerTitle, { color: isDark ? theme.text : '#FFF' }]}>مواقيت الصلاة</Text> */}
                        {/* <View style={{ width: 40 }} /> */}
                    </View>

                    {/* Date Info - Moved to top */}
                    <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.dateContainer}>
                        <Text style={[styles.hijriDateText, { color: isDark ? theme.primary : '#FFF' }]}>{hijriDate}</Text>
                        <View style={[styles.dateSeparator, { backgroundColor: isDark ? theme.border : 'rgba(255,255,255,0.4)' }]} />
                        <Text style={[styles.gregorianDateText, { color: isDark ? theme.textSecondary : 'rgba(255,255,255,0.85)' }]}>{gregorianDate}</Text>
                    </Animated.View>

                    {/* Compact Countdown */}
                    <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.countdownContainer}>
                        <BlurView intensity={isDark ? 20 : 20} tint={isDark ? 'dark' : 'light'} style={[styles.countdownCompact, { borderColor: isDark ? theme.border : 'rgba(255,255,255,0.2)' }]}>
                            <View style={styles.countdownRow}>
                                <View style={styles.countdownInfo}>
                                    <Text style={[styles.nextPrayerLabel, { color: isDark ? theme.textSecondary : 'rgba(255,255,255,0.9)' }]}>
                                        {nextPrayerInfo?.name || 'الصلاة القادمة'}
                                    </Text>
                                    <Text style={[styles.nextPrayerTime, { color: isDark ? theme.text : 'rgba(255,255,255,0.9)' }]}>
                                        {nextPrayerInfo?.time ? formatTime(nextPrayerInfo.time) : '--:--'}
                                    </Text>
                                </View>
                                <Text style={[styles.countdownTimer, { color: isDark ? theme.text : '#FFF' }]}>{countdownStr}</Text>
                            </View>
                        </BlurView>
                    </Animated.View>

                    {/* Prayer Times Grid */}
                    <View style={styles.prayerGrid}>
                        {prayers.map((prayer, index) => {
                            const isNext = nextPrayer === prayer.key;
                            const isPassed = prayer.rawTime < currentTime && !isNext;

                            return (
                                <Animated.View
                                    key={index}
                                    entering={FadeInDown.delay(400 + (index * 60)).springify()}
                                    style={styles.prayerGridItem}
                                >
                                    <LinearGradient
                                        // Dark Mode: Use specific dark color (Zn-800)
                                        // Light Mode: Use white/transparency
                                        colors={
                                            isNext
                                                ? (isDark ? [theme.primary, '#059669'] : ['#10B981', '#059669'])
                                                : isDark
                                                    ? [theme.cardBackground, theme.cardBackground]
                                                    : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.95)']
                                        }
                                        style={[
                                            styles.prayerCard,
                                            {
                                                borderColor: isNext ? 'transparent' : theme.border,
                                                borderWidth: isDark && !isNext ? 1 : 0,
                                                opacity: isPassed ? 0.7 : 1,
                                            }
                                        ]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <View style={[
                                            styles.iconBox,
                                            { backgroundColor: isNext ? 'rgba(255,255,255,0.2)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(16, 185, 129, 0.1)' }
                                        ]}>
                                            <Ionicons
                                                name={
                                                    prayer.key === Prayer.Fajr ? 'partly-sunny-outline' :
                                                        prayer.key === Prayer.Sunrise ? 'sunny-outline' :
                                                            prayer.key === Prayer.Dhuhr ? 'sunny' :
                                                                prayer.key === Prayer.Asr ? 'cloud-outline' :
                                                                    prayer.key === Prayer.Maghrib ? 'moon-outline' : 'moon'
                                                }
                                                size={22}
                                                color={isNext ? '#FFF' : isDark ? theme.text : theme.primary}
                                            />
                                        </View>

                                        <Text style={[
                                            styles.prayerNameText,
                                            { color: isNext ? '#FFF' : theme.text }
                                        ]}>
                                            {prayer.name}
                                        </Text>

                                        <Text style={[
                                            styles.prayerTimeText,
                                            { color: isNext ? '#FFF' : theme.text }
                                        ]}>
                                            {prayer.time}
                                        </Text>

                                        {/* Badge removed to keep consistent size with other cards */}
                                    </LinearGradient>
                                </Animated.View>
                            );
                        })}
                    </View>


                    {/* Sunnah Prayers Section - NO LOGO, BOLD TEXT */}
                    <View style={styles.sunnahContainer}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>أوقات السنن</Text>
                        <View style={styles.sunnahGrid}>
                            <View style={[styles.sunnahCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                                <View>
                                    <Text style={[styles.sunnahLabel, { color: theme.textSecondary }]}>منتصف الليل</Text>
                                    <Text style={[styles.sunnahTime, { color: theme.text }]}>
                                        {prayerTimes?.middle ? formatTime(prayerTimes.middle) : '--:--'}
                                    </Text>
                                </View>
                            </View>

                            <View style={[styles.sunnahCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                                <View>
                                    <Text style={[styles.sunnahLabel, { color: theme.textSecondary }]}>قيام الليل</Text>
                                    <Text style={[styles.sunnahTime, { color: theme.text }]}>
                                        {prayerTimes?.qiyam ? formatTime(prayerTimes.qiyam) : '--:--'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Footer Note */}
                    <View style={styles.footerNote}>
                        <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
                        <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                            يتم حساب الأوقات بناءً على موقعك الحالي
                        </Text>
                    </View>
                </ScrollView>
            </View>
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
    heroContainer: {
        flex: 1,
        width: '100%',
        overflow: 'hidden',
    },
    heroBg: {
        flex: 1,
        justifyContent: 'center',
    },
    patternOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroContent: {
        ...StyleSheet.absoluteFillObject,
    },
    scrollContent: {
        paddingTop: 40,
        paddingHorizontal: 20,
        paddingBottom: 100, // Extra padding for tab bar
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row-reverse',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    countdownContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        width: '100%',
    },
    countdownCompact: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        width: '90%',
    },
    countdownRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    countdownInfo: {
        alignItems: 'flex-end',
        gap: 2,
    },
    nextPrayerLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    countdownTimer: {
        fontSize: 28,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
    },
    nextPrayerTime: {
        fontSize: 13,
        fontWeight: '600',
    },
    dateContainer: {
        marginTop: 12,
        alignItems: 'center',
        width: '100%',
    },
    dateSeparator: {
        width: 40,
        height: 1,
        marginVertical: 4,
    },
    hijriDateText: {
        fontSize: 24,           // Increased from 15
        fontWeight: '700',
        textAlign: 'center',
    },
    gregorianDateText: {
        fontSize: 16,           // Increased from 12
        fontWeight: '600',
        textAlign: 'center',
        opacity: 0.9,
    },
    prayerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'space-between',
        marginTop: 16,
        paddingHorizontal: 20,
    },
    prayerGridItem: {
        width: '48%',
        borderRadius: 18,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
        backgroundColor: 'transparent',
    },
    prayerCard: {
        padding: 14,
        borderRadius: 18,
        alignItems: 'center',
        gap: 8,
        minHeight: 115,
        justifyContent: 'center',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    prayerNameText: {
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'center',
    },
    prayerTimeText: {
        fontSize: 17,
        fontWeight: '800',
        textAlign: 'center',
    },
    nextBadge: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginTop: 2,
    },
    nextBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    footerNote: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: 16,
        opacity: 0.8,
        paddingHorizontal: 20,
    },
    footerText: {
        fontSize: 11,
    },
    sunnahContainer: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'right',
    },
    sunnahGrid: {
        flexDirection: 'row-reverse',
        gap: 10,                    // Match prayerGrid gap
        justifyContent: 'space-between', // Match prayerGrid spacing
    },
    sunnahCard: {
        width: '48%',               // Match prayerGridItem width
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        minHeight: 100,
    },
    sunnahIconBox: {
        display: 'none',
    },
    sunnahLabel: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',        // Center text
        marginBottom: 8,
        opacity: 0.8,
    },
    sunnahTime: {
        fontSize: 22,               // Much bigger time
        fontWeight: '800',
        textAlign: 'center',        // Center text
        fontVariant: ['tabular-nums'],
    },
});
