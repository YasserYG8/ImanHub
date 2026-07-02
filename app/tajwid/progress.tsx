import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useThemeColor';
import { useThemeContext } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PracticeHistoryItem {
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    score: number;
    timestamp: number;
}

export default function TajwidProgressScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { isDark } = useThemeContext();

    const [history, setHistory] = useState<PracticeHistoryItem[]>([]);
    const [stats, setStats] = useState({
        totalPractices: 0,
        averageScore: 0,
        bestScore: 0
    });

    const loadFullHistory = useCallback(async () => {
        try {
            const raw = await AsyncStorage.getItem('tajwid_history');
            if (raw) {
                const parsed: PracticeHistoryItem[] = JSON.parse(raw);
                setHistory(parsed);

                if (parsed.length > 0) {
                    const total = parsed.length;
                    const sum = parsed.reduce((acc, curr) => acc + curr.score, 0);
                    const average = Math.round(sum / total);
                    const best = Math.max(...parsed.map(item => item.score));

                    setStats({
                        totalPractices: total,
                        averageScore: average,
                        bestScore: best
                    });
                }
            }
        } catch (e) {
            console.error('Failed to load Tajwid full history:', e);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadFullHistory();
        }, [loadFullHistory])
    );

    const handleClearHistory = async () => {
        if (confirm('هل أنت متأكد من رغبتك في حذف سجل التدريبات بالكامل؟')) {
            try {
                await Promise.all([
                    AsyncStorage.removeItem('tajwid_history'),
                    AsyncStorage.removeItem('tajwid_last_practice')
                ]);
                setHistory([]);
                setStats({ totalPractices: 0, averageScore: 0, bestScore: 0 });
            } catch (e) {
                console.error('Failed to clear Tajwid history:', e);
            }
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: '#18181B' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Ambient Gold Mesh Glow */}
            <LinearGradient
                colors={['rgba(234, 179, 8, 0.12)', 'transparent']}
                style={styles.glowTopLeft}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>سجل التدريبات</Text>
                {history.length > 0 ? (
                    <TouchableOpacity style={styles.clearButton} onPress={handleClearHistory} activeOpacity={0.8}>
                        <Ionicons name="trash-outline" size={20} color="#FF7043" />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            {/* Main Content */}
            {history.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="mic-circle-outline" size={80} color="rgba(255, 255, 255, 0.15)" />
                    <Text style={styles.emptyTitle}>لا يوجد سجل تلاوات</Text>
                    <Text style={styles.emptyDesc}>ابدأ التدريب على الآيات الكريمة لتظهر نتائجك وتقييماتك هنا.</Text>
                    
                    <TouchableOpacity 
                        style={styles.backToDashboardButton} 
                        onPress={() => router.push('/tajwid' as any)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.backToDashboardText}>اختر آية وابدأ الآن</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item, index) => `${item.timestamp}_${index}`}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={() => (
                        <Animated.View entering={FadeInDown.springify()} style={styles.statsPanel}>
                            <View style={styles.statsRow}>
                                <View style={styles.statsCard}>
                                    <Text style={styles.statsNumber}>{stats.totalPractices}</Text>
                                    <Text style={styles.statsLabel}>إجمالي التلاوات</Text>
                                </View>
                                <View style={[styles.statsCard, { borderColor: 'rgba(234, 179, 8, 0.25)' }]}>
                                    <Text style={[styles.statsNumber, { color: '#EAB308' }]}>{stats.averageScore}%</Text>
                                    <Text style={styles.statsLabel}>معدل الحفظ</Text>
                                </View>
                                <View style={styles.statsCard}>
                                    <Text style={styles.statsNumber}>{stats.bestScore}%</Text>
                                    <Text style={styles.statsLabel}>أعلى تقييم</Text>
                                </View>
                            </View>
                        </Animated.View>
                    )}
                    renderItem={({ item, index }) => {
                        const dateStr = new Date(item.timestamp).toLocaleDateString('ar-EG', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        });

                        return (
                            <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
                                <TouchableOpacity 
                                    style={styles.historyCard}
                                    onPress={() => router.push(`/tajwid/practice/${item.surahNumber}_${item.ayahNumber}` as any)}
                                    activeOpacity={0.9}
                                >
                                    <View style={[
                                        styles.scoreIndicatorCircle, 
                                        { borderColor: item.score >= 85 ? '#10B981' : '#EAB308', backgroundColor: item.score >= 85 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(234, 179, 8, 0.05)' }
                                    ]}>
                                        <Text style={[styles.scoreIndicatorText, { color: item.score >= 85 ? '#10B981' : '#EAB308' }]}>
                                            {item.score}%
                                        </Text>
                                    </View>

                                    <View style={styles.historyDetails}>
                                        <Text style={styles.surahNameText}>سورة {item.surahName}</Text>
                                        <Text style={styles.ayahDetailsText}>الآية رقم {item.ayahNumber} • {dateStr}</Text>
                                    </View>

                                    <Ionicons name="chevron-back" size={18} color="rgba(255, 255, 255, 0.3)" />
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
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
    header: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(39, 39, 42, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 112, 67, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 112, 67, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
    },
    statsPanel: {
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row-reverse',
        gap: 12,
    },
    statsCard: {
        flex: 1,
        backgroundColor: 'rgba(39, 39, 42, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    statsNumber: {
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-ExtraBold',
        color: '#FFFFFF',
    },
    statsLabel: {
        fontSize: 10,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.4)',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 60,
    },
    historyCard: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: 'rgba(39, 39, 42, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 16,
        gap: 16,
        marginBottom: 12,
    },
    scoreIndicatorCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreIndicatorText: {
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-Bold',
    },
    historyDetails: {
        flex: 1,
        alignItems: 'flex-end',
    },
    surahNameText: {
        fontSize: 15,
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
    },
    ayahDetailsText: {
        fontSize: 11,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        gap: 12,
        paddingBottom: 80,
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
        marginTop: 8,
    },
    emptyDesc: {
        fontSize: 12,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.4)',
        textAlign: 'center',
        lineHeight: 18,
    },
    backToDashboardButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#EAB308',
        borderRadius: 14,
    },
    backToDashboardText: {
        fontSize: 14,
        fontFamily: 'Tajawal-Bold',
        color: '#121214',
    }
});
