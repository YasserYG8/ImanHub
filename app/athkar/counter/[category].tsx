import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Modal, ScrollView, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useThemeColor';
import Svg, { Circle } from 'react-native-svg';
import athkarData from '../../../assets/data/athkar_data.json';

const { width, height } = Dimensions.get('window');

type AthkarItem = {
    id: string;
    arabic: string;
    translation: string;
    transliteration: string;
    count: number;
    reference: string;
    summary?: string;
};



export default function AthkarCounterScreen() {
    const { category } = useLocalSearchParams<{ category: string }>();
    const theme = useTheme();
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);

    // Get athkar for this category
    const athkarList: AthkarItem[] = (athkarData as any)[category] || [];

    // Track current index and counts
    const [currentIndex, setCurrentIndex] = useState(0);
    const [counts, setCounts] = useState<{ [key: string]: number }>(
        athkarList.reduce((acc, item) => ({ ...acc, [item.id]: 0 }), {})
    );
    const [showList, setShowList] = useState(false);

    const currentAthkar = athkarList[currentIndex];
    const currentCount = counts[currentAthkar?.id] || 0;
    const targetCount = currentAthkar?.count || 1;
    const progress = currentCount / targetCount;

    // Calculate total clicks across all athkar
    const totalClicks = Object.values(counts).reduce((sum, count) => sum + count, 0);

    const completedCount = Object.keys(counts).filter(id => {
        const item = athkarList.find(a => a.id === id);
        return item && counts[id] >= item.count;
    }).length;

    // Handle tap to increment
    const handleTap = () => {
        if (!currentAthkar) return;

        const newCount = currentCount + 1;
        setCounts(prev => ({ ...prev, [currentAthkar.id]: newCount }));

        // Auto-advance if completed
        if (newCount >= targetCount && currentIndex < athkarList.length - 1) {
            setTimeout(() => {
                setCurrentIndex(currentIndex + 1);
                flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
            }, 500);
        }
    };

    // Handle manual swipe
    const handleScroll = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / width);
        if (index !== currentIndex && index >= 0 && index < athkarList.length) {
            setCurrentIndex(index);
        }
    };

    // Circular progress component
    const CircularProgress = ({ progress, current, target }: { progress: number; current: number; target: number }) => {
        const radius = 60;
        const strokeWidth = 8;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (progress * circumference);

        return (
            <View style={styles.progressContainer}>
                <Svg width="140" height="140" viewBox="0 0 140 140">
                    <Circle
                        cx="70"
                        cy="70"
                        r={radius}
                        stroke={theme.border}
                        strokeOpacity={0.2}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    <Circle
                        cx="70"
                        cy="70"
                        r={radius}
                        stroke={theme.primary}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        rotation={-90}
                        originX="70"
                        originY="70"
                    />
                </Svg>
                <View style={styles.progressText}>
                    <Text style={[styles.progressCount, { color: theme.text }]}>{current}</Text>
                    <Text style={[styles.progressSeparator, { color: theme.textSecondary }]}>/</Text>
                    <Text style={[styles.progressTarget, { color: theme.textSecondary }]}>{target}</Text>
                </View>
            </View>
        );
    };

    // Render athkar card
    const renderAthkar = ({ item, index }: { item: AthkarItem; index: number }) => {
        const itemCount = counts[item.id] || 0;
        const isCompleted = itemCount >= item.count;

        return (
            <TouchableOpacity
                style={[styles.card, { width }]}
                onPress={() => {
                    if (index === currentIndex && !isCompleted) {
                        handleTap();
                    }
                }}
                activeOpacity={isCompleted ? 1 : 0.95}
                disabled={index !== currentIndex}
            >
                <ScrollView
                    contentContainerStyle={styles.cardContent}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                >
                    {/* Progress Circle */}
                    <CircularProgress
                        progress={itemCount / item.count}
                        current={itemCount}
                        target={item.count}
                    />

                    {/* Arabic Text */}
                    <Text style={[styles.arabicText, { color: theme.text }]}>
                        {item.arabic}
                    </Text>

                    {/* Transliteration Removed */}

                    {/* Translation Removed */}

                    {/* Reference */}
                    <Text style={[styles.reference, { color: theme.primary }]}>
                        {item.reference}
                    </Text>
                </ScrollView>
            </TouchableOpacity>
        );
    };

    if (!currentAthkar) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <Text style={[styles.errorText, { color: theme.text }]}>
                    لم يتم العثور على أذكار
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.background }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-forward" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        {category === 'morning' ? 'أذكار الصباح' :
                            category === 'evening' ? 'أذكار المساء' :
                                category === 'prayer' ? 'أذكار بعد الصلاة' :
                                    category === 'sleep' ? 'أذكار النوم' : 'أذكار'}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                        {completedCount} / {athkarList.length}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => setShowList(true)} style={styles.listButton}>
                    <Ionicons name="list" size={24} color={theme.text} />
                </TouchableOpacity>
            </View>

            {/* Swipeable Athkar */}
            <FlatList
                ref={flatListRef}
                data={athkarList}
                renderItem={renderAthkar}
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

            {/* Total Clicks Display */}
            <View
                style={[styles.countDisplay, {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border
                }]}
            >
                <Text style={[styles.countDisplayText, { color: theme.text }]}>
                    {completedCount} / {athkarList.length}
                </Text>
                <Text style={[styles.countDisplayLabel, { color: theme.textSecondary }]}>
                    الأذكار المكتملة
                </Text>
            </View>

            {/* Swipe Hint */}
            <View style={styles.swipeHint}>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                <Text style={[styles.swipeHintText, { color: theme.textSecondary }]}>
                    اسحب للانتقال
                </Text>
                <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
            </View>

            {/* List Modal */}
            <Modal
                visible={showList}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowList(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                قائمة الأذكار
                            </Text>
                            <TouchableOpacity onPress={() => setShowList(false)}>
                                <Ionicons name="close" size={28} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
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
                        </ScrollView>
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
        paddingTop: 50,
        paddingBottom: 16,
    },
    backButton: {
        padding: 8,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 2,
    },
    listButton: {
        padding: 8,
    },
    card: {
        height: height - 250,
    },
    cardContent: {
        padding: 20,
        alignItems: 'center',
    },
    progressContainer: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    progressText: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    progressCount: {
        fontSize: 36,
        fontWeight: '800',
    },
    progressSeparator: {
        fontSize: 24,
        fontWeight: '600',
        marginHorizontal: 4,
    },
    progressTarget: {
        fontSize: 24,
        fontWeight: '600',
    },
    arabicText: {
        fontSize: 24,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 42,
        marginBottom: 20,
    },
    transliteration: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    translation: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 16,
    },
    reference: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    countDisplay: {
        marginHorizontal: 20,
        marginBottom: 8,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 2,
    },
    countDisplayText: {
        fontSize: 32,
        fontWeight: '800',
    },
    countDisplayLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
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
    },
    errorText: {
        fontSize: 18,
        textAlign: 'center',
        marginTop: 100,
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
    },
    listItemRight: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
    },
    listItemCount: {
        fontSize: 14,
        fontWeight: '700',
    },
});
