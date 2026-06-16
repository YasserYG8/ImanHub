import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import categories from '../../assets/data/athkar_categories.json';
import { useTheme } from '@/hooks/useThemeColor';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAthkarProgress } from '@/hooks/useAthkarProgress';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment-hijri';
import 'moment/locale/ar';

// Configure moment
moment.locale('ar');

const { width } = Dimensions.get('window');

export default function AthkarScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { getCategoryStats, getTotalStats, refresh } = useAthkarProgress();

    // Dynamic Hijri Date
    const mNow = moment();
    const hDay = mNow.format('iD');
    const hMonthIndex = parseInt(mNow.format('iM')) - 1;
    const hYear = mNow.format('iYYYY');
    const hijriMonths = [
        'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر',
        'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
        'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];
    const hijriMonthName = hijriMonths[hMonthIndex] || mNow.format('iMMMM');
    const HIJRI_DATE = `${hDay} ${hijriMonthName} ${hYear}`;

    // Refresh stats when screen is focused
    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [])
    );

    // Helper to get remote image URL from Stitch assets or local fallback
    const getCardImageSource = (id: string) => {
        switch (id) {
            case 'morning':
                return require('../../assets/images/athkar_sabah.png');
            case 'evening':
                return require('../../assets/images/athkar_masa.jpg');
            case 'prayer':
                return require('../../assets/images/athkar_salat.png');
            case 'sleep':
                return require('../../assets/images/athkar_sleeping.png');
            case 'wake_up':
                return require('../../assets/images/athkar_waking_up.png');
            default:
                return require('../../assets/images/islam_light.png');
        }
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        const stats = getCategoryStats(item.id);
        const isStarted = stats.percentage > 0;

        // Button styling based on start state (Stitch style: Blue for active/morning, Grey for not started)
        const buttonBg = isStarted ? '#0EA5E9' : 'rgba(255,255,255,0.1)'; // Sky blue or glassy grey
        const buttonText = isStarted ? '#fff' : theme.textSecondary;

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 150).springify()}
                style={styles.cardWrapper}
            >
                <TouchableOpacity
                    activeOpacity={0.9}
                    style={[styles.listCard, { backgroundColor: theme.cardBackground }]}
                    onPress={() => router.push({
                        pathname: '/athkar/counter/[category]',
                        params: { category: item.id }
                    })}
                >
                    {/* Right Side Visual: Image Only (No Gradient Overlay) */}
                    <View style={styles.cardImageContainer}>
                        <Image
                            source={getCardImageSource(item.id)}
                            style={styles.cardImage}
                            fadeDuration={0} // Force instant render
                        />

                        {/* Circular Progress Overlay (Centered on Image) */}
                        {isStarted && (
                            <View style={styles.progressCircleContainer}>
                                {/* Simple ring overlay */}
                                <View style={[styles.progressRing, {
                                    borderColor: 'rgba(255,255,255,0.3)',
                                    borderTopColor: '#0EA5E9', // Bright blue progress
                                    transform: [{ rotate: '-45deg' }],
                                }]} />
                                <View style={styles.progressTextContainer}>
                                    <Text style={styles.progressText}>{stats.percentage}%</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Left Side Content (Arabic RTL: visually Right) */}
                    <View style={styles.cardContent}>
                        {/* Category Label */}
                        <View style={styles.categoryLabelRow}>
                            <Text style={[styles.categoryLabel, { color: theme.textSecondary }]}>
                                {item.id === 'morning' ? 'الصباح' :
                                    item.id === 'evening' ? 'المساء' :
                                        item.id === 'prayer' ? 'بعد الصلاة' :
                                            item.id === 'sleep' ? 'النوم' :
                                                item.id === 'wake_up' ? 'الاستيقاظ' : 'عام'}
                            </Text>
                            <MaterialCommunityIcons
                                name={item.id === 'morning' ? 'weather-sunset' :
                                    item.id === 'evening' ? 'weather-night' :
                                        item.id === 'wake_up' ? 'alarm' :
                                            'arrow-left'}
                                size={14}
                                color={theme.textSecondary}
                            />
                        </View>

                        <Text style={[styles.cardTitle, { color: theme.text }]}>
                            {item.arabicTitle}
                        </Text>

                        <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                            {item.title} • {isStarted ? `${stats.completedItems}/${stats.totalItems} تم` : `${stats.totalItems} ذكر`}
                        </Text>

                        {/* Action Button */}
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                { backgroundColor: buttonBg }
                            ]}
                            onPress={() => router.push({
                                pathname: '/athkar/counter/[category]',
                                params: { category: item.id }
                            })}
                        >
                            <Text style={[
                                styles.actionButtonText,
                                { color: isStarted ? '#fff' : '#fff' }
                            ]}>
                                {isStarted ? 'متابعة' : 'ابدأ الآن'}
                            </Text>
                            {!isStarted && <MaterialCommunityIcons name="play" size={14} color="#fff" style={{ marginLeft: 6 }} />}
                        </TouchableOpacity>
                    </View>

                </TouchableOpacity>
            </Animated.View>
        );
    };

    const totalStats = getTotalStats(); // Calculate global stats

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.scrollContent}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.headerTextContainer}>
                        <Text style={[styles.greeting, { color: theme.text }]}>السلام عليكم</Text>
                        <Text style={[styles.date, { color: theme.textSecondary }]}>{HIJRI_DATE}</Text>
                    </View>
                    <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.cardBackground }]}>
                        <Ionicons name="notifications-outline" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground }]}>
                    <Ionicons name="search" size={20} color={theme.textSecondary} style={{ marginLeft: 8 }} />
                    <TextInput
                        placeholder="ابحث عن الأذكار..."
                        placeholderTextColor={theme.textSecondary}
                        style={[styles.searchInput, { color: theme.text }]}
                        textAlign="right"
                    />
                </View>

                {/* Daily Stats Card */}
                <LinearGradient
                    colors={[theme.cardBackground, theme.cardBackground]}
                    style={[styles.statsCard, { borderColor: theme.border, borderWidth: 1 }]}
                >
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text style={[styles.statsLabel, { color: theme.textSecondary }]}>وردك اليومي</Text>
                        <View style={styles.statsRow}>
                            <Text style={[styles.statsTrend, { color: theme.primary }]}>+12% عن أمس</Text>
                            <Text style={[styles.statsPercentage, { color: theme.text }]}>{totalStats.percentage}%</Text>
                        </View>
                        {/* Progress Bar */}
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { backgroundColor: theme.primary, width: `${totalStats.percentage}%` }]} />
                        </View>
                    </View>
                    <View style={{ marginLeft: 16 }}>
                        <Ionicons name="stats-chart" size={48} color={theme.primary} style={{ opacity: 0.2 }} />
                    </View>
                </LinearGradient>

                {/* List Section Header */}
                <View style={styles.sectionHeader}>
                    <TouchableOpacity>
                        <Text style={[styles.viewAll, { color: theme.primary }]}>عرض الكل</Text>
                    </TouchableOpacity>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>الأقسام الرئيسية</Text>
                </View>

                {/* Main List */}
                <FlatList
                    data={categories}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={true}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: 20
    },
    header: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTextContainer: {
        alignItems: 'flex-end',
    },
    greeting: {
        fontSize: 26,
        fontWeight: 'bold', // System bold
        textAlign: 'right'
    },
    date: {
        fontSize: 15,
        fontWeight: '500', // Normal weight
        opacity: 0.8,
        textAlign: 'right',
        marginTop: 2
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 52,
        marginBottom: 24,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingHorizontal: 12,
        fontWeight: '500',
        textAlign: 'right'
    },
    statsCard: {
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    statsLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'right',
        opacity: 0.9
    },
    statsRow: {
        flexDirection: 'row-reverse',
        alignItems: 'baseline',
        gap: 12,
        marginBottom: 16,
    },
    statsPercentage: {
        fontSize: 42,
        fontWeight: '800',
        lineHeight: 48,
    },
    statsTrend: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    progressBarBg: {
        height: 10,
        backgroundColor: 'rgba(150,150,150,0.15)',
        borderRadius: 5,
        width: '100%',
        maxWidth: 220,
        direction: 'rtl',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    sectionHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'right'
    },
    viewAll: {
        fontSize: 15,
        fontWeight: '600',
    },
    listContainer: {
        paddingBottom: 100,
    },
    cardWrapper: {
        marginBottom: 16,
    },
    listCard: {
        borderRadius: 24,
        padding: 12,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 16,
        height: 140, // Fixed height for consistency
    },
    cardImageContainer: {
        width: 100,
        height: 110, // Slightly smaller than card height
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'transparent', // Remove black bg
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        transform: [{ scale: 1.25 }], // Increased zoom to 1.25 per request
    },
    progressCircleContainer: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)', // Slight dim over image for text readability
    },
    progressRing: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 4,
        position: 'absolute'
    },
    progressTextContainer: {
        // backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2
    },
    progressText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold'
    },
    cardContent: {
        flex: 1,
        height: '100%',
        paddingVertical: 4,
        justifyContent: 'space-between',
        alignItems: 'flex-end', // Align all content to right
    },
    categoryLabelRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
    },
    categoryLabel: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'right',
        marginTop: 4,
        marginBottom: 2
    },
    cardSubtitle: {
        fontSize: 13,
        fontWeight: '500',
        fontFamily: 'System', // Fallback to system font
        opacity: 0.6, // Increased opacity for readability
        textAlign: 'right',
        marginBottom: 8
    },
    actionButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 18, // Pill shape
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%', // Full width of content area or constrained
        maxWidth: 160,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
});
