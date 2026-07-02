import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Platform, StatusBar, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS } from '@/utils/storage';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useThemeColor';
import { useThemeContext } from '@/context/ThemeContext';
import Svg, { Circle } from 'react-native-svg';
import athkarData from '../../../assets/data/athkar_data.json';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CATEGORY_COLORS: Record<string, string> = {
    morning: '#FFC107',  // Gold
    evening: '#7C4DFF',  // Indigo
    sleep: '#AB47BC',    // Purple/Plum
    wake_up: '#FF7043',  // Coral
    prayer: '#10B981',   // Emerald
};

type AthkarItem = {
    id: string;
    arabic: string;
    translation: string;
    transliteration: string;
    count: number;
    reference: string;
    summary?: string;
};

// --- Child Components ---

const CircularProgress = ({
    current,
    target,
    theme,
    color
}: {
    current: number;
    target: number;
    theme: any;
    color: string;
}) => {
    const radius = 50;
    const strokeWidth = 4;
    const size = 120;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = useSharedValue(0);

    // Keep Progress Animation
    useEffect(() => {
        progress.value = withTiming(current / target, { duration: 500 });
    }, [current, target, progress]);

    const animatedProps = useAnimatedProps(() => {
        const strokeDashoffset = circumference - (progress.value * circumference);
        return {
            strokeDashoffset: strokeDashoffset,
        };
    });

    return (
        <View style={styles.progressContainer}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Background Track */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={theme.border}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />

                {/* Progress Arc */}
                <AnimatedCircle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    animatedProps={animatedProps}
                    strokeLinecap="round"
                    rotation={-90}
                    originX={center}
                    originY={center}
                />
            </Svg>

            {/* Center Counter */}
            <View style={styles.progressTextContainer}>
                <Text style={[styles.progressMainNumber, { color: theme.text }]}>
                    {current}
                </Text>
                <Text style={[styles.progressLimit, { color: theme.textSecondary }]}>/{target}</Text>
            </View>
        </View>
    );
};

const AthkarCard = ({
    item,
    count,
    isActive,
    onIncrement,
    theme,
    width,
    categoryColor,
}: {
    item: AthkarItem;
    count: number;
    isActive: boolean;
    onIncrement: () => void;
    theme: any;
    width: number;
    categoryColor: string;
}) => {
    const isCompleted = count >= item.count;

    const handlePress = () => {
        if (!isActive || isCompleted) return;

        // Removed Pulse Animation

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onIncrement();
    };

    return (
        <View style={{ width, alignItems: 'center', justifyContent: 'center' }}>
            <TouchableOpacity
                style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}
                onPress={handlePress}
                activeOpacity={0.8}
                disabled={!isActive}
            >
                {/* Removed Animated.View wrapper (No entry/scale animation) */}
                {/* Fixed Layout Container */}
                <View style={styles.cardWrapper}>
                    {/* Top Filler - Push Text to visual center-top */}
                    <View style={styles.topSection} />

                    {/* Text Area - Fixed Height Region */}
                    <View style={styles.textRegion}>
                        <Animated.ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.textContent}
                        >
                            <Text style={[styles.arabicText, { color: theme.text }]}>
                                {item.arabic}
                            </Text>

                            {item.summary && (
                                <Text style={[styles.summaryText, { color: categoryColor }]}>{item.summary}</Text>
                            )}

                            <Text style={[styles.referenceText, { color: theme.textSecondary }]}>
                                {item.reference}
                            </Text>
                        </Animated.ScrollView>
                    </View>

                    {/* Progress Indicator */}
                    <View style={styles.counterWrapper}>
                        <CircularProgress
                            current={count}
                            target={item.count}
                            theme={theme}
                            color={categoryColor}
                        />
                    </View>


                </View>
            </TouchableOpacity>
        </View>
    );
};

// --- Main Screen ---

export default function AthkarCounterScreen() {
    const { category } = useLocalSearchParams<{ category: string }>();
    const theme = useTheme();
    const { isDark } = useThemeContext();
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);

    // Get Data
    const athkarList: AthkarItem[] = useMemo(() => (athkarData as any)[category] || [], [category]);

    // State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [counts, setCounts] = useState<{ [key: string]: number }>(
        athkarList.reduce((acc, item) => ({ ...acc, [item.id]: 0 }), {})
    );
    const [showList, setShowList] = useState(false);
    const [isRestored, setIsRestored] = useState(false);

    // --- Persistence: Load saved counts + last index on mount ---
    useEffect(() => {
        const loadSavedProgress = async () => {
            try {
                const [savedCountsRaw, savedIndexRaw] = await Promise.all([
                    AsyncStorage.getItem(KEYS.ATHKAR_COUNTS),
                    AsyncStorage.getItem(KEYS.ATHKAR_LAST_INDEX),
                ]);

                if (savedCountsRaw) {
                    const allCounts = JSON.parse(savedCountsRaw);
                    if (allCounts[category]) {
                        setCounts(prev => ({ ...prev, ...allCounts[category] }));
                    }
                }

                if (savedIndexRaw) {
                    const allIndexes = JSON.parse(savedIndexRaw);
                    const savedIdx = allIndexes[category];
                    if (typeof savedIdx === 'number' && savedIdx >= 0 && savedIdx < athkarList.length) {
                        setCurrentIndex(savedIdx);
                        // Scroll to saved position after a short delay to let FlatList mount
                        setTimeout(() => {
                            flatListRef.current?.scrollToIndex({ index: savedIdx, animated: false });
                        }, 100);
                    }
                }
            } catch (e) {
                console.error('Failed to restore athkar progress:', e);
            } finally {
                setIsRestored(true);
            }
        };
        loadSavedProgress();
    }, [category, athkarList.length]);

    // --- Persistence: Save counts whenever they change ---
    useEffect(() => {
        if (!isRestored) return; // Don't save during initial load
        const saveCounts = async () => {
            try {
                // 1. Save to permanent resume key
                const raw = await AsyncStorage.getItem(KEYS.ATHKAR_COUNTS);
                const allCounts = raw ? JSON.parse(raw) : {};
                allCounts[category] = counts;
                await AsyncStorage.setItem(KEYS.ATHKAR_COUNTS, JSON.stringify(allCounts));

                // 2. Also sync to the daily progress key (used by dashboard stats)
                const dailyKey = `athkar_progress_${new Date().toISOString().split('T')[0]}`;
                const dailyRaw = await AsyncStorage.getItem(dailyKey);
                const dailyProgress = dailyRaw ? JSON.parse(dailyRaw) : {};
                dailyProgress[category] = counts;
                await AsyncStorage.setItem(dailyKey, JSON.stringify(dailyProgress));
            } catch (e) {
                console.error('Failed to save athkar counts:', e);
            }
        };
        saveCounts();
    }, [counts, isRestored, category]);

    // --- Persistence: Save last index whenever it changes ---
    useEffect(() => {
        if (!isRestored) return;
        const saveIndex = async () => {
            try {
                const raw = await AsyncStorage.getItem(KEYS.ATHKAR_LAST_INDEX);
                const allIndexes = raw ? JSON.parse(raw) : {};
                allIndexes[category] = currentIndex;
                await AsyncStorage.setItem(KEYS.ATHKAR_LAST_INDEX, JSON.stringify(allIndexes));
            } catch (e) {
                console.error('Failed to save athkar last index:', e);
            }
        };
        saveIndex();
    }, [currentIndex, isRestored, category]);

    // Actions
    const handleIncrement = useCallback(() => {
        const currentItem = athkarList[currentIndex];
        if (!currentItem) return;

        setCounts(prev => {
            const currentCount = prev[currentItem.id] || 0;
            const newCount = currentCount + 1;

            if (newCount === currentItem.count) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Auto-advance
                if (currentIndex < athkarList.length - 1) {
                    setTimeout(() => {
                        const nextIndex = currentIndex + 1;
                        setCurrentIndex(nextIndex);
                        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
                    }, 500);
                }
            }
            return { ...prev, [currentItem.id]: newCount };
        });
    }, [currentIndex, athkarList]);

    const handleScroll = useCallback((event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / width);
        if (index !== currentIndex && index >= 0 && index < athkarList.length) {
            setCurrentIndex(index);
        }
    }, [currentIndex, athkarList.length]);

    const categoryColor = CATEGORY_COLORS[category] || theme.primary;
    const isCategoryCompleted = athkarList.length > 0 && athkarList.every(item => (counts[item.id] || 0) >= item.count);

    const renderItem = useCallback(({ item, index }: { item: AthkarItem; index: number }) => (
        <AthkarCard
            item={item}
            count={counts[item.id] || 0}
            isActive={index === currentIndex}
            onIncrement={handleIncrement}
            theme={theme}
            width={width}
            categoryColor={categoryColor}
        />
    ), [counts, currentIndex, handleIncrement, theme, categoryColor]);

    if (athkarList.length === 0) return null;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: theme.cardBackground }]}>
                    <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitleText, { color: theme.text }]}>
                        {category === 'morning' ? 'أذكار الصباح' :
                            category === 'evening' ? 'أذكار المساء' :
                                category === 'prayer' ? 'أذكار الصلاة' :
                                    category === 'sleep' ? 'أذكار النوم' : 'الأذكار'}
                    </Text>
                    <Text style={[styles.headerSubtitleText, { color: theme.textSecondary }]}>{currentIndex + 1} / {athkarList.length}</Text>
                </View>

                <TouchableOpacity onPress={() => setShowList(true)} style={[styles.iconButton, { backgroundColor: theme.cardBackground }]}>
                    <Ionicons name="list" size={24} color={theme.text} />
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <FlatList
                ref={flatListRef}
                data={athkarList}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                getItemLayout={(data, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                })}
            />

            {/* Swipe Hint */}
            <View style={styles.swipeHint}>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                <Text style={[styles.swipeHintText, { color: theme.textSecondary }]}>
                    اسحب للانتقال
                </Text>
                <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
            </View>

            {isCategoryCompleted && (
                <Animated.View 
                    entering={FadeInUp.springify()} 
                    style={[styles.completedBadge, { backgroundColor: categoryColor }]}
                >
                    <Ionicons name="checkmark-done-circle" size={20} color="#121214" />
                    <Text style={[styles.completedText, { color: '#121214' }]}>تم إكمال جميع الأذكار</Text>
                </Animated.View>
            )}

            {/* Bottom Safe Area Spacer */}
            <View style={{ height: 20 }} />

            {/* List Modal */}
            <Modal
                visible={showList}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowList(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                قائمة الأذكار
                            </Text>
                            <TouchableOpacity onPress={() => setShowList(false)}>
                                <Ionicons name="close" size={28} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                        <Animated.ScrollView>
                            {athkarList.map((item, index) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.listItem, {
                                        backgroundColor: index === currentIndex ? theme.primary + '20' : 'transparent',
                                        borderBottomColor: theme.border
                                    }]}
                                    onPress={() => {
                                        setCurrentIndex(index);
                                        flatListRef.current?.scrollToIndex({ index, animated: true });
                                        setShowList(false);
                                    }}
                                >
                                    <View style={styles.listItemContent}>
                                        <Text style={[styles.listItemNumber, { color: theme.textSecondary }]}>
                                            {index + 1}
                                        </Text>
                                        <Text style={[styles.listItemText, { color: theme.text }]} numberOfLines={2}>
                                            {item.summary || item.arabic}
                                        </Text>
                                    </View>
                                    <View style={styles.listItemRight}>
                                        <Text style={[styles.listItemCount, {
                                            color: counts[item.id] >= item.count ? theme.primary : theme.textSecondary
                                        }]}>
                                            {counts[item.id] || 0}/{item.count}
                                        </Text>
                                        {counts[item.id] >= item.count && (
                                            <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </Animated.ScrollView>
                    </View>
                </View>
            </Modal>
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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        zIndex: 10,
    },
    iconButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitleText: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
        fontFamily: 'Tajawal-Bold',
    },
    headerSubtitleText: {
        fontSize: 14,
    },
    cardWrapper: {
        flex: 1,
        width: width,
        alignItems: 'center',
        justifyContent: 'space-between', // Distribute vertically
    },
    topSection: {
        height: height * 0.1, // Fixed top spacing (10%)
    },
    textRegion: {
        height: height * 0.55, // Fixed text area height (55%)
        width: width - 40,
        alignItems: 'center',
        // content is centered inside scrollview via styles.textContent
    },
    textContent: {
        alignItems: 'center',
        paddingVertical: 10,
        minHeight: '100%',
        justifyContent: 'center', // Center text vertically if short
    },
    arabicText: {
        fontSize: 28,
        textAlign: 'center',
        fontFamily: 'Amiri-Regular',
        lineHeight: 50,
        marginBottom: 16,
    },
    summaryText: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '600',
        fontFamily: 'Amiri-Bold',
    },
    referenceText: {
        fontSize: 13,
        marginBottom: 8,
        fontFamily: 'Tajawal-Regular',
        lineHeight: 18,
    },
    counterWrapper: {
        height: height * 0.25, // Fixed bottom area (25%) for counter
        alignItems: 'center',
        justifyContent: 'flex-start', // Top align inside this bottom region
        paddingTop: 20,
    },
    progressContainer: {
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressTextContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressMainNumber: {
        fontSize: 32,
        fontWeight: '800',
        fontFamily: 'Tajawal-Bold',
        includeFontPadding: false,
    },
    progressLimit: {
        fontSize: 16,
        marginTop: -2,
        fontFamily: 'Tajawal-Medium',
    },
    completedBadge: {
        position: 'absolute',
        bottom: 110,
        alignSelf: 'center',
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 30,
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    completedText: {
        fontWeight: 'bold',
        fontSize: 16,
        fontFamily: 'Tajawal-Bold',
    },
    swipeHint: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 20,
        gap: 8,
    },
    swipeHintText: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Tajawal-Medium',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: height * 0.7,
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Tajawal-Bold',
    },
    listItem: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    listItemContent: {
        flex: 1,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12,
    },
    listItemNumber: {
        fontSize: 14,
        fontWeight: '700',
        width: 24,
        textAlign: 'center',
    },
    listItemText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'right',
        fontFamily: 'Tajawal-Medium',
    },
    listItemRight: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
    },
    listItemCount: {
        fontSize: 14,
        fontWeight: '700',
        fontFamily: 'Tajawal-Bold',
    },
});
