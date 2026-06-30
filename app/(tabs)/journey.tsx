import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useThemeColor';
import { useThemeContext } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getItem, KEYS } from '@/utils/storage';
import quranData from '@/assets/data/quran/quran.json';
import { useAthkarProgress } from '@/hooks/useAthkarProgress';

const { width } = Dimensions.get('window');

// --- Custom Svg Circular Progress Ring ---
const CircularProgress = ({ percentage, color }: { percentage: number; color: string }) => {
    const radius = 32;
    const strokeWidth = 6;
    const size = 80;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100 * circumference);

    return (
        <View style={styles.progressRingContainer}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Background track */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {/* Progress arc */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation={-90}
                    originX={center}
                    originY={center}
                />
            </Svg>
            <View style={styles.progressTextContainer}>
                <Text style={styles.progressPercentText}>{percentage}%</Text>
            </View>
        </View>
    );
};

const JUZ_ARABIC_NAMES = [
    'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر',
    'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر', 'السادس عشر', 'السابع عشر', 'الثامن عشر', 'التاسع عشر', 'العشرون',
    'الحادي والعشرون', 'الثاني والعشرون', 'الثالث والعشرون', 'الرابع والعشرون', 'الخامس والعشرون', 'السادس والعشرون', 'السابع والعشرون', 'الثامن والعشرون', 'التاسع والعشرون', 'الثلاثون'
];

export default function JourneyScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { isDark } = useThemeContext();
    const { getCategoryStats, getTotalStats, refresh } = useAthkarProgress();
    const [selectedTab, setSelectedTab] = useState<'today' | 'week' | 'month' | 'year'>('today');
    const [lastRead, setLastRead] = useState<any | null>(null);
    const [streakDays, setStreakDays] = useState(7);

    // Load dynamic cached values on screen focus
    const loadSavedData = useCallback(async () => {
        try {
            // Load Last Read Quran details
            const cachedLastRead = await getItem<any>(KEYS.LAST_READ);
            if (cachedLastRead) {
                setLastRead(cachedLastRead);
            }

            // Calculate consecutive Athkar daily reading streak
            const keys = await AsyncStorage.getAllKeys();
            const progressKeys = keys.filter(k => k.startsWith('athkar_progress_')).sort().reverse();
            
            let streak = 0;
            let checkDate = new Date();
            const allStorage = await AsyncStorage.multiGet(progressKeys);
            const storageMap = new Map(allStorage);
            
            while (true) {
                const dateStr = checkDate.toISOString().split('T')[0];
                const key = `athkar_progress_${dateStr}`;
                const val = storageMap.get(key);
                
                if (val) {
                    const parsed = JSON.parse(val);
                    let totalReads = 0;
                    Object.values(parsed).forEach((cat: any) => {
                        if (cat) {
                            Object.values(cat).forEach((cnt: any) => {
                                totalReads += (cnt || 0);
                            });
                        }
                    });
                    
                    if (totalReads > 0) {
                        streak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                        continue;
                    }
                }
                
                // Allow a one-day grace if today hasn't started yet but yesterday was completed
                if (streak === 0) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = yesterday.toISOString().split('T')[0];
                    const yesterdayKey = `athkar_progress_${yesterdayStr}`;
                    if (storageMap.has(yesterdayKey)) {
                        checkDate = yesterday;
                        continue;
                    }
                }
                break;
            }
            
            if (streak > 0) {
                setStreakDays(streak);
            }
        } catch (e) {
            console.log('Error loading saved data in journey:', e);
        }
    }, []);

    // Refresh stats when screen is focused
    useFocusEffect(
        useCallback(() => {
            refresh();
            loadSavedData();
        }, [refresh, loadSavedData])
    );

    // Dynamic Quran progress calculations
    let currentJuz = 10;
    let quranProgressPercent = 85;
    let juzLabel = 'أنت على وشك ختم الجزء العاشر';
    let mostReadSurah = 'سورة الكهف';
    
    if (lastRead) {
        currentJuz = Math.min(30, Math.floor((lastRead.page - 1) / 20) + 1);
        const pageOffset = (lastRead.page - 1) % 20;
        quranProgressPercent = Math.round((pageOffset / 20) * 100);
        juzLabel = `أنت تقرأ حالياً في الجزء ${JUZ_ARABIC_NAMES[currentJuz - 1]}`;
        
        const matchedSurah = (quranData as any[]).find((s: any) => s.id === lastRead.surahId);
        if (matchedSurah) {
            mostReadSurah = `سورة ${matchedSurah.name}`;
        }
    }

    const handleContinueReading = () => {
        const surahId = lastRead ? lastRead.surahId : 18; // Default to Al-Kahf
        router.push(`/quran/${surahId}`);
    };

    // Dynamic Athkar progress calculations
    const totalStats = getTotalStats();
    const morningStats = getCategoryStats('morning');
    const eveningStats = getCategoryStats('evening');

    const morningPercent = morningStats.totalItems > 0 
        ? Math.round((morningStats.completedItems / morningStats.totalItems) * 100) 
        : 0;

    const eveningPercent = eveningStats.totalItems > 0 
        ? Math.round((eveningStats.completedItems / eveningStats.totalItems) * 100) 
        : 0;

    // Filter tabs options
    const filters = [
        { id: 'today', label: 'اليوم' },
        { id: 'week', label: 'هذا الأسبوع' },
        { id: 'month', label: 'هذا الشهر' },
        { id: 'year', label: 'السنة' },
    ];

    // Weekly activity bar chart mock data
    const weeklyData = [
        { label: 'ح', value: 35 },
        { label: 'ن', value: 75, glow: true },
        { label: 'ث', value: 50 },
        { label: 'ر', value: 90, glow: true, active: true },
        { label: 'خ', value: 45 },
        { label: 'ج', value: 30 },
        { label: 'س', value: 20 },
    ];

    // Contribution map blocks mock data
    const contributionBlocks = Array.from({ length: 14 }).map((_, i) => {
        if (i === 0 || i === 6 || i === 12) return 1.0;
        if (i === 1 || i === 3 || i === 7 || i === 10) return 0.6;
        if (i === 2 || i === 5 || i === 11) return 0.2;
        if (i === 8) return 0.0;
        return 0.4;
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Ambient Background Glows */}
            <LinearGradient
                colors={['rgba(0, 108, 73, 0.15)', 'transparent']}
                style={styles.glowTopLeft}
            />
            <LinearGradient
                colors={['rgba(124, 77, 255, 0.08)', 'transparent']}
                style={styles.glowCenterRight}
            />
            <LinearGradient
                colors={['rgba(0, 108, 73, 0.10)', 'transparent']}
                style={styles.glowBottomLeft}
            />

            {/* Sticky Header */}
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <View style={styles.headerTitleCol}>
                        <Text style={styles.headerTitle}>رحلتك الروحية</Text>
                        <Text style={styles.headerSubtitle}>زادك اليومي ونور قلبك</Text>
                    </View>
                    <TouchableOpacity style={styles.shareButton} activeOpacity={0.8}>
                        <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Filter Tab Row */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.filterTabsContainer}
                >
                    {filters.map((tab) => {
                        const isActive = selectedTab === tab.id;
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                style={[
                                    styles.filterTabButton,
                                    isActive ? { backgroundColor: theme.primary } : styles.filterTabInactive
                                ]}
                                onPress={() => setSelectedTab(tab.id as any)}
                                activeOpacity={0.8}
                            >
                                <Text style={[
                                    styles.filterTabText,
                                    isActive ? styles.filterTextActive : styles.filterTextInactive
                                ]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Section A: Quran Reading Progress */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="book" size={20} color="#4DD0E1" />
                            <Text style={[styles.sectionTitle, { color: '#4DD0E1' }]}>نور القرآن</Text>
                        </View>
                        <View style={styles.sectionBadgeCyan}>
                            <Text style={styles.sectionBadgeTextCyan}>١٥ صفحة اليوم</Text>
                        </View>
                    </View>

                    <View style={[styles.glassCard, styles.borderRightCyan]}>
                        <View style={styles.quranRow}>
                            <View style={styles.quranIconBox}>
                                <Ionicons name="flame" size={24} color="#4DD0E1" />
                            </View>
                            <View style={styles.quranProgressDetails}>
                                <Text style={styles.progressSubLabel}>التقدم في الجزء</Text>
                                <Text style={styles.progressMainLabel}>{juzLabel}</Text>
                                <View style={styles.progressBarTrack}>
                                    <View style={[styles.progressBarFillCyan, { width: `${quranProgressPercent}%` }]} />
                                </View>
                            </View>
                        </View>

                        <View style={styles.quranDivider} />

                        <View style={styles.quranBottomRow}>
                            <View style={styles.surahInfoCol}>
                                <Text style={styles.surahHeaderLabel}>السورة الأكثر قراءة</Text>
                                <View style={styles.surahNameRow}>
                                    <Text style={styles.surahName}>{mostReadSurah}</Text>
                                    <View style={styles.pulsingDot} />
                                </View>
                            </View>
                            <TouchableOpacity 
                                style={styles.continueButton} 
                                activeOpacity={0.8}
                                onPress={handleContinueReading}
                            >
                                <Ionicons name="book-open-outline" size={14} color="#121214" />
                                <Text style={styles.continueButtonText}>واصل القراءة</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statsGridCard}>
                            <Text style={styles.statsNumberCyan}>١٥</Text>
                            <Text style={styles.statsLabelCyan}>صفحة</Text>
                        </View>
                        <View style={styles.statsGridCard}>
                            <Text style={styles.statsNumberCyan}>٤٥</Text>
                            <Text style={styles.statsLabelCyan}>دقيقة</Text>
                        </View>
                        <View style={styles.statsGridCard}>
                            <Text style={styles.statsNumberCyan}>٢</Text>
                            <Text style={styles.statsLabelCyan}>سور</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Section B: Athkar & Tasbeeh Counters */}
                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="shield-checkmark" size={20} color="#FF7043" />
                            <Text style={[styles.sectionTitle, { color: '#FF7043' }]}>الأذكار والورد</Text>
                        </View>
                        <View style={styles.sectionBadgeCoral}>
                            <Ionicons name="star" size={12} color="#FF7043" style={{ marginLeft: 4 }} />
                            <Text style={styles.sectionBadgeTextCoral}>{streakDays} أيام متتالية</Text>
                        </View>
                    </View>

                    <View style={styles.glassCard}>
                        <View style={styles.athkarMainRow}>
                            {/* Circular progress display */}
                            <CircularProgress percentage={totalStats.percentage} color="#FF7043" />

                            <View style={styles.athkarProgressCol}>
                                <View style={styles.athkarTitleHeader}>
                                    <Text style={styles.athkarCardTitle}>حافظ على وردك</Text>
                                    <Text style={styles.athkarCardStatusText}>اقتربت من الهدف</Text>
                                </View>

                                {/* Morning Progress Bar */}
                                <View style={styles.subProgressRow}>
                                    <View style={styles.subProgressLabelRow}>
                                        <Text style={styles.subProgressName}>أذكار الصباح</Text>
                                        <Text style={styles.subProgressValueCoral}>
                                            {morningPercent === 100 ? 'تم بنجاح' : `${morningPercent}%`}
                                        </Text>
                                    </View>
                                    <View style={styles.subProgressBarTrack}>
                                        <View style={[styles.subProgressBarFillCoral, { width: `${morningPercent}%` }]} />
                                    </View>
                                </View>

                                {/* Evening Progress Bar */}
                                <View style={styles.subProgressRow}>
                                    <View style={styles.subProgressLabelRow}>
                                        <Text style={styles.subProgressName}>أذكار المساء</Text>
                                        <Text style={styles.subProgressValue}>{eveningPercent}%</Text>
                                    </View>
                                    <View style={styles.subProgressBarTrack}>
                                        <View style={[
                                            styles.subProgressBarFillCoral, 
                                            { width: `${eveningPercent}%`, opacity: eveningPercent === 100 ? 1 : 0.4 }
                                        ]} />
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.athkarDivider} />

                        <View style={styles.quoteContainer}>
                            <Ionicons name="ribbon-outline" size={14} color="#FF7043" />
                            <Text style={styles.quoteText}>"ألا بذكر الله تطمئن القلوب"</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Section C: Activity Bar Chart */}
                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.sectionContainer}>
                    <View style={styles.sectionTitleRow}>
                        <Ionicons name="stats-chart" size={20} color="#7C4DFF" />
                        <Text style={[styles.sectionTitle, { color: '#7C4DFF' }]}>نور أيامك بالذكر</Text>
                    </View>

                    <View style={styles.glassCard}>
                        {/* Weekly vertical bar chart */}
                        <View style={styles.chartContainer}>
                            {weeklyData.map((day, i) => {
                                const isGlow = day.glow;
                                const isActive = day.active;
                                return (
                                    <View key={i} style={styles.chartCol}>
                                        <View style={styles.chartBarTrack}>
                                            <LinearGradient
                                                colors={isActive ? ['#7C4DFF', '#B388FF'] : ['rgba(124, 77, 255, 0.2)', 'rgba(124, 77, 255, 0.4)']}
                                                style={[
                                                    styles.chartBarFill, 
                                                    { height: `${day.value}%` },
                                                    isGlow && styles.activeBarShadow
                                                ]}
                                            />
                                        </View>
                                        <Text style={[styles.chartDayLabel, isActive && styles.activeDayLabelText]}>
                                            {day.label}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>

                        <View style={styles.chartDivider} />

                        {/* Weekly summaries & grid */}
                        <View style={styles.chartBottomRow}>
                            <View style={styles.chartSummaryHeader}>
                                <Text style={styles.chartSummaryTitle}>الالتزام الأسبوعي</Text>
                                <Text style={styles.chartSummaryStatus}>نشاط ممتاز</Text>
                            </View>

                            {/* GitHub contributions-like map blocks */}
                            <View style={styles.contributionsGrid}>
                                {contributionBlocks.map((opacity, idx) => (
                                    <View 
                                        key={idx} 
                                        style={[
                                            styles.contributionBlock, 
                                            { backgroundColor: `rgba(124, 77, 255, ${opacity})` },
                                            opacity === 1.0 && styles.activeBlockShadow
                                        ]} 
                                    />
                                ))}
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Section D: Badges & Achievements */}
                <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="ribbon" size={20} color="#FFC107" />
                            <Text style={[styles.sectionTitle, { color: '#FFC107' }]}>أوسمة روحية</Text>
                        </View>
                        <TouchableOpacity activeOpacity={0.8}>
                            <Text style={styles.viewAllBadgesLink}>عرض الكل</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.badgesRow}>
                        {/* Gold Badge */}
                        <View style={styles.badgeCol}>
                            <View style={[styles.badgeCircle, styles.borderAmber]}>
                                <Ionicons name="star" size={28} color="#FFC107" />
                            </View>
                            <Text style={styles.badgeLabel}>ختمة{"\n"}رمضان</Text>
                        </View>

                        {/* Purple/Plum Badge */}
                        <View style={styles.badgeCol}>
                            <View style={[styles.badgeCircle, styles.borderPlum]}>
                                <Ionicons name="heart" size={28} color="#AB47BC" />
                            </View>
                            <Text style={styles.badgeLabel}>صدقة{"\n"}جارية</Text>
                        </View>

                        {/* Green Badge */}
                        <View style={styles.badgeCol}>
                            <View style={[styles.badgeCircle, styles.borderEmerald]}>
                                <Ionicons name="checkmark-circle" size={28} color="#006c49" />
                            </View>
                            <Text style={styles.badgeLabel}>مثابر{"\n"}الفجر</Text>
                        </View>

                        {/* Locked Badge */}
                        <View style={[styles.badgeCol, { opacity: 0.3 }]}>
                            <View style={[styles.badgeCircle, styles.borderLocked]}>
                                <Ionicons name="lock-closed" size={28} color="rgba(255, 255, 255, 0.4)" />
                            </View>
                            <Text style={styles.badgeLabel}>٤٠ يوم{"\n"}صلاة</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Extra spacer at bottom to layout above bottom tab bar */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#18181B',
        position: 'relative',
    },
    glowTopLeft: {
        position: 'absolute',
        top: -100,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        zIndex: -1,
    },
    glowCenterRight: {
        position: 'absolute',
        top: '40%',
        right: -80,
        width: 250,
        height: 250,
        borderRadius: 125,
        zIndex: -1,
    },
    glowBottomLeft: {
        position: 'absolute',
        bottom: -50,
        left: -80,
        width: 250,
        height: 250,
        borderRadius: 125,
        zIndex: -1,
    },
    header: {
        backgroundColor: 'rgba(39, 39, 42, 0.4)',
        borderBottomWidth: 0,
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerTopRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitleCol: {
        alignItems: 'flex-end',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Noto Serif Arabic',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 11,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: 2,
    },
    shareButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(39, 39, 42, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterTabsContainer: {
        flexDirection: 'row-reverse',
        gap: 8,
    },
    filterTabButton: {
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterTabInactive: {
        backgroundColor: 'rgba(39, 39, 42, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    filterTabText: {
        fontSize: 14,
        fontFamily: 'Tajawal-Medium',
    },
    filterTextActive: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    filterTextInactive: {
        color: 'rgba(255, 255, 255, 0.6)',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 24,
        gap: 24,
    },
    sectionContainer: {
        gap: 12,
    },
    sectionHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitleRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-Bold',
    },
    sectionBadgeCyan: {
        backgroundColor: 'rgba(77, 208, 225, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
    },
    sectionBadgeTextCyan: {
        fontSize: 10,
        fontFamily: 'Tajawal-Bold',
        color: 'rgba(77, 208, 225, 0.8)',
    },
    sectionBadgeCoral: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 112, 67, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
    },
    sectionBadgeTextCoral: {
        fontSize: 10,
        fontFamily: 'Tajawal-Bold',
        color: '#FF7043',
    },
    glassCard: {
        backgroundColor: 'rgba(39, 39, 42, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 24,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
    },
    borderRightCyan: {
        borderRightWidth: 4,
        borderRightColor: '#4DD0E1',
    },
    quranRow: {
        flexDirection: 'row-reverse',
        alignItems: 'flex-start',
        gap: 16,
    },
    quranIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(77, 208, 225, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quranProgressDetails: {
        flex: 1,
        alignItems: 'flex-end',
    },
    progressSubLabel: {
        fontSize: 12,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 4,
    },
    progressMainLabel: {
        fontSize: 14,
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
        marginBottom: 10,
        textAlign: 'right',
    },
    progressBarTrack: {
        height: 8,
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 100,
        overflow: 'hidden',
    },
    progressBarFillCyan: {
        height: '100%',
        backgroundColor: '#4DD0E1',
        borderRadius: 100,
        shadowColor: '#4DD0E1',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    quranDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginVertical: 16,
    },
    quranBottomRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    surahInfoCol: {
        alignItems: 'flex-end',
    },
    surahHeaderLabel: {
        fontSize: 10,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.4)',
        marginBottom: 4,
    },
    surahNameRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
    },
    surahName: {
        fontSize: 14,
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
    },
    pulsingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4DD0E1',
    },
    continueButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: '#4DD0E1',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#4DD0E1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    continueButtonText: {
        color: '#121214',
        fontSize: 11,
        fontFamily: 'Tajawal-Bold',
    },
    statsGrid: {
        flexDirection: 'row-reverse',
        gap: 12,
    },
    statsGridCard: {
        flex: 1,
        backgroundColor: 'rgba(39, 39, 42, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsNumberCyan: {
        fontSize: 20,
        fontFamily: 'Tajawal-ExtraBold',
        color: '#4DD0E1',
    },
    statsLabelCyan: {
        fontSize: 10,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 2,
    },
    progressRingContainer: {
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressTextContainer: {
        position: 'absolute',
    },
    progressPercentText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-Bold',
    },
    athkarMainRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 20,
    },
    athkarProgressCol: {
        flex: 1,
        gap: 12,
    },
    athkarTitleHeader: {
        alignItems: 'flex-end',
        marginBottom: 4,
    },
    athkarCardTitle: {
        fontSize: 14,
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
    },
    athkarCardStatusText: {
        fontSize: 10,
        fontFamily: 'Tajawal-Medium',
        color: '#FF7043',
        marginTop: 2,
    },
    subProgressRow: {
        gap: 4,
    },
    subProgressLabelRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subProgressName: {
        fontSize: 10,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.6)',
    },
    subProgressValue: {
        fontSize: 10,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.6)',
    },
    subProgressValueCoral: {
        fontSize: 10,
        fontFamily: 'Tajawal-Bold',
        color: '#FF7043',
    },
    subProgressBarTrack: {
        height: 6,
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 100,
        overflow: 'hidden',
    },
    subProgressBarFillCoral: {
        height: '100%',
        backgroundColor: '#FF7043',
        borderRadius: 100,
    },
    athkarDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginVertical: 14,
    },
    quoteContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    quoteText: {
        fontSize: 11,
        fontStyle: 'italic',
        fontFamily: 'Noto Serif Arabic',
        color: 'rgba(255, 255, 255, 0.7)',
    },
    chartContainer: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 110,
        paddingHorizontal: 8,
    },
    chartCol: {
        alignItems: 'center',
        gap: 8,
        height: '100%',
        justifyContent: 'flex-end',
    },
    chartBarTrack: {
        height: 80,
        width: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 100,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    chartBarFill: {
        width: '100%',
        borderRadius: 100,
    },
    activeBarShadow: {
        shadowColor: '#7C4DFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    chartDayLabel: {
        fontSize: 10,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.4)',
    },
    activeDayLabelText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    chartDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginVertical: 16,
    },
    chartBottomRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chartSummaryHeader: {
        alignItems: 'flex-end',
    },
    chartSummaryTitle: {
        fontSize: 12,
        fontFamily: 'Tajawal-Bold',
        color: 'rgba(255, 255, 255, 0.6)',
    },
    chartSummaryStatus: {
        fontSize: 10,
        fontFamily: 'Tajawal-Bold',
        color: '#7C4DFF',
        marginTop: 2,
    },
    contributionsGrid: {
        flexDirection: 'row-reverse',
        flexWrap: 'wrap',
        width: 70,
        gap: 4,
    },
    contributionBlock: {
        width: 12,
        height: 12,
        borderRadius: 2,
    },
    activeBlockShadow: {
        shadowColor: '#7C4DFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
    },
    viewAllBadgesLink: {
        fontSize: 11,
        fontFamily: 'Tajawal-Medium',
        color: '#FFC107',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 193, 7, 0.2)',
    },
    badgesRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
    },
    badgeCol: {
        alignItems: 'center',
        gap: 8,
    },
    badgeCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(39, 39, 42, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    borderAmber: {
        borderColor: 'rgba(255, 193, 7, 0.2)',
    },
    borderPlum: {
        borderColor: 'rgba(171, 71, 188, 0.2)',
    },
    borderEmerald: {
        borderColor: 'rgba(0, 108, 73, 0.2)',
    },
    borderLocked: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    badgeLabel: {
        fontSize: 9,
        fontFamily: 'Tajawal-Medium',
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 12,
    },
});
