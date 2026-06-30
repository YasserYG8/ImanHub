import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Dimensions, Image, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import categories from '../../assets/data/athkar_categories.json';
import { useTheme } from '@/hooks/useThemeColor';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAthkarProgress } from '@/hooks/useAthkarProgress';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

// --- Custom Svg Circular Progress Component ---
const SvgCircularProgress = ({ percentage }: { percentage: number }) => {
    const radius = 14;
    const strokeWidth = 2.5;
    const size = 34;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100 * circumference);

    return (
        <View style={styles.progressRingWrapper}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Background track */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {/* Foreground progress path */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="#10B981" // dawn-teal
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
            <View style={styles.progressRingTextContainer}>
                <Text style={styles.progressRingText}>{percentage}%</Text>
            </View>
        </View>
    );
};

export default function AthkarScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { getCategoryStats, getTotalStats, refresh, loading } = useAthkarProgress();
    const [searchQuery, setSearchQuery] = useState('');


    // Refresh stats when screen is focused
    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [])
    );

    // Get background image source for category cards
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

    // Filter categories dynamically
    const filteredCategories = categories.filter(cat =>
        cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.arabicTitle.includes(searchQuery)
    );

    // Check if this category matches the current time of day
    const isRightTimeForCategory = (id: string): boolean => {
        const hour = new Date().getHours();
        switch (id) {
            case 'morning':   return hour >= 4 && hour < 12;   // Fajr → Dhuhr
            case 'evening':   return hour >= 15 && hour < 21;  // Asr → Isha
            case 'sleep':     return hour >= 20 || hour < 4;   // Night
            case 'wake_up':   return hour >= 4 && hour < 10;   // Early morning
            case 'prayer':    return true;                     // Any time
            default:          return true;
        }
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        const stats = getCategoryStats(item.id);
        const isStarted = stats.percentage > 0;
        const isRightTime = isRightTimeForCategory(item.id);

        // Custom style mapping based on Stitch designs
        const getCategoryStyles = (id: string) => {
            switch (id) {
                case 'morning':
                    return {
                        icon: 'weather-sunny' as const,
                        iconColor: '#FFB300', // afternoon-bronze
                        iconBg: 'rgba(255, 179, 0, 0.1)',
                        iconBorder: 'rgba(255, 179, 0, 0.2)',
                    };
                case 'evening':
                    return {
                        icon: 'weather-night' as const,
                        iconColor: '#7C4DFF', // night-indigo
                        iconBg: 'rgba(124, 77, 255, 0.1)',
                        iconBorder: 'rgba(124, 77, 255, 0.2)',
                    };
                case 'prayer':
                    return {
                        icon: 'mosque' as const,
                        iconColor: '#4EDE93', // primary-fixed-dim
                        iconBg: 'rgba(78, 222, 163, 0.1)',
                        iconBorder: 'rgba(78, 222, 163, 0.2)',
                    };
                case 'sleep':
                    return {
                        icon: 'bed' as const,
                        iconColor: '#94A3B8', // slate-300
                        iconBg: 'rgba(148, 163, 184, 0.1)',
                        iconBorder: 'rgba(148, 163, 184, 0.2)',
                    };
                case 'wake_up':
                    return {
                        icon: 'alarm' as const,
                        iconColor: '#FF7043', // sunrise-coral
                        iconBg: 'rgba(255, 112, 67, 0.1)',
                        iconBorder: 'rgba(255, 112, 67, 0.2)',
                    };
                default:
                    return {
                        icon: 'book-open-variant' as const,
                        iconColor: '#10B981',
                        iconBg: 'rgba(16, 185, 129, 0.1)',
                        iconBorder: 'rgba(16, 185, 129, 0.2)',
                    };
            }
        };

        const catStyles = getCategoryStyles(item.id);

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 120).springify()}
                style={styles.cardWrapper}
            >
                <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.listCard}
                    onPress={() => router.push({
                        pathname: '/athkar/counter/[category]',
                        params: { category: item.id }
                    })}
                >
                    {/* Full Card Backdrop Image Overlay */}
                    <Image
                        source={getCardImageSource(item.id)}
                        style={styles.cardBackgroundImage}
                        resizeMode="cover"
                    />

                    {/* Dark Glassmorphic tint to blend overlay image */}
                    <View style={styles.cardGlassOverlay} />

                    {/* Right Side (Leading) - Category Icon + Info Stack */}
                    <View style={styles.cardLeading}>
                        <View style={[
                            styles.catIconContainer,
                            {
                                backgroundColor: catStyles.iconBg,
                                borderColor: catStyles.iconBorder,
                            }
                        ]}>
                            <MaterialCommunityIcons name={catStyles.icon} size={22} color={catStyles.iconColor} />
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardItemTitle}>{item.arabicTitle}</Text>
                            <Text style={styles.cardItemSubtitle}>
                                {isStarted ? `${stats.completedItems}/${stats.totalItems} تم` : `${stats.totalItems} ذكر`}
                            </Text>
                        </View>
                    </View>

                    {/* Left Side (Trailing) - Progress Ring + Action Buttons */}
                    <View style={styles.cardTrailing}>
                        {/* Circular Progress Ring — always visible */}
                        <SvgCircularProgress percentage={stats.percentage} />

                        {/* CTA Controls */}
                        {isStarted ? (
                            <View style={styles.actionBtnFollow}>
                                <Text style={styles.actionBtnFollowText}>متابعة</Text>
                            </View>
                        ) : isRightTime ? (
                            <View style={styles.actionBtnStartNow}>
                                <Text style={styles.actionBtnStartNowText}>ابدأ الآن</Text>
                            </View>
                        ) : (
                            <Ionicons name="chevron-back" size={20} color="rgba(255, 255, 255, 0.3)" />
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const totalStats = getTotalStats();
    const statsText = totalStats.percentage === 0 
        ? 'لم تبدأ بعد' 
        : totalStats.percentage === 100 
            ? 'اكتمل الورد اليومي' 
            : 'قيد التقدم';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Ambient Background Glows */}
            <LinearGradient
                colors={['rgba(16, 185, 129, 0.15)', 'transparent']}
                style={styles.glowEmerald}
            />
            <LinearGradient
                colors={['rgba(255, 179, 0, 0.08)', 'transparent']}
                style={styles.glowGold}
            />

            <View style={styles.scrollContent}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.pageTitle}>الأذكار</Text>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.4)" style={{ marginLeft: 8 }} />
                    <TextInput
                        placeholder="ابحث عن الأذكار..."
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        textAlign="right"
                    />
                </View>
                {/* Daily Progress Ward Card */}
                <View style={styles.statsCard}>
                    {/* Inner glowing element */}
                    <View style={styles.statsInnerGlow} />

                    <View style={styles.statsTopRow}>
                        <View style={styles.statsRightCol}>
                            <Text style={styles.statsLabel}>وردك اليومي</Text>
                            <View style={styles.statsTrendBadge}>
                                <Ionicons 
                                    name={totalStats.percentage === 100 ? "checkmark-circle" : "time-outline"} 
                                    size={14} 
                                    color="#10B981" 
                                />
                                <Text style={styles.statsTrendText}>{statsText}</Text>
                            </View>
                        </View>
                        <Text style={styles.statsPercentage}>{totalStats.percentage}%</Text>
                    </View>

                    <View style={styles.progressBarBg}>
                        <LinearGradient
                            colors={['#34D399', '#10B981']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressBarFill, { width: `${totalStats.percentage}%` }]}
                        />
                    </View>
                </View>

                {/* Section Header */}
                <View style={styles.sectionHeader}>
                    <TouchableOpacity>
                        <Text style={styles.viewAll}>عرض الكل</Text>
                    </TouchableOpacity>
                    <Text style={styles.sectionTitle}>الأقسام الرئيسية</Text>
                </View>

                {/* Main List */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#10B981" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredCategories}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121214',
        position: 'relative',
    },
    glowEmerald: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 320,
        height: 320,
        borderRadius: 160,
        zIndex: -1,
    },
    glowGold: {
        position: 'absolute',
        bottom: 100,
        left: -100,
        width: 280,
        height: 280,
        borderRadius: 140,
        zIndex: -1,
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(39, 39, 42, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: 'rgba(39, 39, 42, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 100,
        paddingHorizontal: 16,
        height: 48,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'Tajawal-Regular',
        color: '#FFFFFF',
        paddingHorizontal: 12,
    },
    statsCard: {
        backgroundColor: 'rgba(39, 39, 42, 0.4)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderRadius: 24,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 24,
    },
    statsInnerGlow: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    statsTopRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    statsRightCol: {
        alignItems: 'flex-end',
    },
    statsLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    statsTrendBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        gap: 4,
    },
    statsTrendText: {
        fontSize: 11,
        fontFamily: 'Tajawal-Medium',
        color: '#10B981',
    },
    statsPercentage: {
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: 'Noto Serif',
        color: '#10B981',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: 100,
        width: '100%',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 100,
    },
    sectionHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
    },
    viewAll: {
        fontSize: 14,
        fontFamily: 'Tajawal-Medium',
        color: '#10B981',
    },
    listContainer: {
        paddingBottom: 80,
    },
    cardWrapper: {
        marginBottom: 12,
    },
    listCard: {
        backgroundColor: 'rgba(39, 39, 42, 0.4)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        height: 80,
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    cardBackgroundImage: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.15,
        borderRadius: 16,
    },
    cardGlassOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(18, 18, 20, 0.4)',
    },
    cardLeading: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12,
        zIndex: 1,
    },
    catIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    cardTextContainer: {
        alignItems: 'flex-end',
    },
    cardItemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
    },
    cardItemSubtitle: {
        fontSize: 12,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 2,
    },
    cardTrailing: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12,
        zIndex: 1,
    },
    progressRingWrapper: {
        width: 34,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressRingTextContainer: {
        position: 'absolute',
    },
    progressRingText: {
        color: '#10B981',
        fontSize: 11,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-Bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    actionBtnFollow: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 16,
        paddingVertical: 5,
        borderRadius: 100,
    },
    actionBtnFollowText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-Bold',
    },
    actionBtnStartNow: {
        backgroundColor: '#10B981',
        paddingHorizontal: 16,
        paddingVertical: 5,
        borderRadius: 100,
    },
    actionBtnStartNowText: {
        color: '#121214',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-Bold',
    },
    chevronIcon: {
        marginLeft: 4,
    },
});
