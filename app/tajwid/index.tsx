import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Modal, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useThemeColor';
import { useThemeContext } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import surahsData from '../../assets/data/surahs.json';

interface PracticeHistoryItem {
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    score: number;
    timestamp: number;
}

export default function TajwidDashboardScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { isDark } = useThemeContext();

    const [selectedSurah, setSelectedSurah] = useState(surahsData[0]);
    const [selectedAyah, setSelectedAyah] = useState(1);
    
    const [surahModalVisible, setSurahModalVisible] = useState(false);
    const [ayahModalVisible, setAyahModalVisible] = useState(false);

    const [lastPractice, setLastPractice] = useState<PracticeHistoryItem | null>(null);
    const [recentHistory, setRecentHistory] = useState<PracticeHistoryItem[]>([]);
    const [stats, setStats] = useState({
        totalPractices: 0,
        averageScore: 0,
        streak: 0
    });

    // Load history and stats on focus
    const loadPracticeData = useCallback(async () => {
        try {
            const [historyRaw, lastRaw] = await Promise.all([
                AsyncStorage.getItem('tajwid_history'),
                AsyncStorage.getItem('tajwid_last_practice')
            ]);

            let parsedHistory: PracticeHistoryItem[] = [];
            if (historyRaw) {
                parsedHistory = JSON.parse(historyRaw);
                setRecentHistory(parsedHistory.slice(0, 5)); // Keep last 5 for dashboard
            }

            if (lastRaw) {
                setLastPractice(JSON.parse(lastRaw));
            }

            // Calculate stats
            if (parsedHistory.length > 0) {
                const total = parsedHistory.length;
                const sum = parsedHistory.reduce((acc, curr) => acc + curr.score, 0);
                const average = Math.round(sum / total);

                // Simple streak calculator based on calendar dates
                let streak = 0;
                let today = new Date();
                today.setHours(0,0,0,0);
                let checkDate = new Date(today);

                const practiceDates = new Set(parsedHistory.map(item => {
                    const d = new Date(item.timestamp);
                    d.setHours(0,0,0,0);
                    return d.getTime();
                }));

                while (true) {
                    if (practiceDates.has(checkDate.getTime())) {
                        streak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else {
                        // Check if streak was yesterday but today isn't done yet
                        if (streak === 0) {
                            const yesterday = new Date(today);
                            yesterday.setDate(yesterday.getDate() - 1);
                            if (practiceDates.has(yesterday.getTime())) {
                                checkDate = yesterday;
                                continue;
                            }
                        }
                        break;
                    }
                }

                setStats({
                    totalPractices: total,
                    averageScore: average,
                    streak: streak
                });
            } else {
                setStats({ totalPractices: 0, averageScore: 0, streak: 0 });
            }
        } catch (e) {
            console.error('Failed to load Tajwid practice data:', e);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadPracticeData();
        }, [loadPracticeData])
    );

    // List of Ayah numbers for current Surah
    const ayahsList = Array.from({ length: selectedSurah.numberOfAyahs }, (_, i) => i + 1);

    const handleStartPractice = () => {
        router.push(`/tajwid/practice/${selectedSurah.number}_${selectedAyah}` as any);
    };

    const handleResumeLast = () => {
        if (lastPractice) {
            router.push(`/tajwid/practice/${lastPractice.surahNumber}_${lastPractice.ayahNumber}` as any);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: '#18181B' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Ambient Gold Mesh Glows */}
            <LinearGradient
                colors={['rgba(234, 179, 8, 0.15)', 'transparent']}
                style={styles.glowTopLeft}
            />
            <LinearGradient
                colors={['rgba(202, 138, 4, 0.08)', 'transparent']}
                style={styles.glowCenterRight}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>مصحح التجويد</Text>
                <TouchableOpacity style={styles.statsButton} onPress={() => router.push('/tajwid/progress')} activeOpacity={0.8}>
                    <Ionicons name="analytics-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Streak and Summary Stats */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statsContainer}>
                    <View style={styles.statsGrid}>
                        <View style={styles.statsCard}>
                            <Ionicons name="flame" size={28} color="#EAB308" />
                            <Text style={styles.statsNumber}>{stats.streak}</Text>
                            <Text style={styles.statsLabel}>أيام متتالية</Text>
                        </View>
                        <View style={styles.statsCard}>
                            <Ionicons name="ribbon" size={28} color="#FF7043" />
                            <Text style={styles.statsNumber}>{stats.averageScore}%</Text>
                            <Text style={styles.statsLabel}>معدل التقييم</Text>
                        </View>
                        <View style={styles.statsCard}>
                            <Ionicons name="mic-circle" size={28} color="#4DD0E1" />
                            <Text style={styles.statsNumber}>{stats.totalPractices}</Text>
                            <Text style={styles.statsLabel}>تلاوة مسجلة</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Selection Panel */}
                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.card}>
                    <Text style={styles.cardHeader}>اختر السورة والآية للتدريب</Text>

                    <View style={styles.pickerRow}>
                        {/* Surah Picker */}
                        <TouchableOpacity 
                            style={styles.pickerButton} 
                            onPress={() => setSurahModalVisible(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="chevron-down" size={16} color="rgba(255, 255, 255, 0.4)" />
                            <Text style={styles.pickerButtonText}>
                                {selectedSurah.name} ({selectedSurah.englishName})
                            </Text>
                            <Text style={styles.pickerLabel}>السورة</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.pickerRow}>
                        {/* Ayah Picker */}
                        <TouchableOpacity 
                            style={styles.pickerButton} 
                            onPress={() => setAyahModalVisible(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="chevron-down" size={16} color="rgba(255, 255, 255, 0.4)" />
                            <Text style={styles.pickerButtonText}>الآية {selectedAyah}</Text>
                            <Text style={styles.pickerLabel}>الآية</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                        style={styles.startButton} 
                        onPress={handleStartPractice}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#EAB308', '#CA8A04']}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        />
                        <Ionicons name="mic" size={18} color="#121214" style={{ marginRight: 8 }} />
                        <Text style={styles.startButtonText}>ابدأ التدريب والتصحيح</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Quick Resume Card */}
                {lastPractice && (
                    <Animated.View entering={FadeInDown.delay(300).springify()}>
                        <TouchableOpacity style={styles.resumeCard} onPress={handleResumeLast} activeOpacity={0.95}>
                            <View style={styles.resumeIconBox}>
                                <Ionicons name="play" size={24} color="#EAB308" />
                            </View>
                            <View style={styles.resumeDetails}>
                                <Text style={styles.resumeTitle}>متابعة آخر تدريب</Text>
                                <Text style={styles.resumeSubtitle}>
                                    سورة {lastPractice.surahName} • الآية {lastPractice.ayahNumber} (آخر تقييم {lastPractice.score}%)
                                </Text>
                            </View>
                            <Ionicons name="chevron-back" size={20} color="rgba(255, 255, 255, 0.3)" />
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Recent History List */}
                <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.historySection}>
                    <View style={styles.historyHeader}>
                        <TouchableOpacity onPress={() => router.push('/tajwid/progress')} activeOpacity={0.8}>
                            <Text style={styles.historyLink}>سجل الأنشطة كاملاً</Text>
                        </TouchableOpacity>
                        <Text style={styles.historyTitle}>التدريبات الأخيرة</Text>
                    </View>

                    {recentHistory.length === 0 ? (
                        <View style={styles.emptyHistoryCard}>
                            <Ionicons name="mic-outline" size={32} color="rgba(255, 255, 255, 0.2)" />
                            <Text style={styles.emptyHistoryText}>لم تقم بأي تدريب تجويد بعد. اختر آية وابدأ الآن!</Text>
                        </View>
                    ) : (
                        recentHistory.map((item, idx) => (
                            <View key={idx} style={styles.historyItemCard}>
                                <View style={[styles.scoreBadge, { backgroundColor: item.score >= 85 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)' }]}>
                                    <Text style={[styles.scoreBadgeText, { color: item.score >= 85 ? '#10B981' : '#EAB308' }]}>
                                        {item.score}%
                                    </Text>
                                </View>
                                <View style={styles.historyItemInfo}>
                                    <Text style={styles.historyItemName}>سورة {item.surahName}</Text>
                                    <Text style={styles.historyItemSubtitle}>
                                        الآية {item.ayahNumber} • {new Date(item.timestamp).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </Animated.View>

                {/* Bottom padding to layout above navigation */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Surah Selector Modal */}
            <Modal visible={surahModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: '#1E1E22', borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>اختر السورة</Text>
                            <TouchableOpacity onPress={() => setSurahModalVisible(false)} activeOpacity={0.8}>
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={surahsData}
                            keyExtractor={item => item.number.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={[styles.modalItem, selectedSurah.number === item.number && styles.modalItemSelected]}
                                    onPress={() => {
                                        setSelectedSurah(item);
                                        setSelectedAyah(1); // Reset Ayah index
                                        setSurahModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.modalItemArabic}>{item.name}</Text>
                                    <Text style={styles.modalItemLabel}>{item.number}. {item.englishName}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Ayah Selector Modal */}
            <Modal visible={ayahModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: '#1E1E22', borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>اختر الآية</Text>
                            <TouchableOpacity onPress={() => setAyahModalVisible(false)} activeOpacity={0.8}>
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={ayahsList}
                            keyExtractor={item => item.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={[styles.modalItem, selectedAyah === item && styles.modalItemSelected]}
                                    onPress={() => {
                                        setSelectedAyah(item);
                                        setAyahModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.modalItemLabel}>الآية {item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
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
    glowCenterRight: {
        position: 'absolute',
        top: '30%',
        right: -80,
        width: 250,
        height: 250,
        borderRadius: 125,
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
    statsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(39, 39, 42, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 20,
    },
    statsContainer: {
        width: '100%',
    },
    statsGrid: {
        flexDirection: 'row-reverse',
        gap: 12,
    },
    statsCard: {
        flex: 1,
        backgroundColor: 'rgba(39, 39, 42, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    statsNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-ExtraBold',
        color: '#FFFFFF',
    },
    statsLabel: {
        fontSize: 10,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.4)',
    },
    card: {
        backgroundColor: 'rgba(39, 39, 42, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 24,
        padding: 20,
        gap: 16,
    },
    cardHeader: {
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
        textAlign: 'right',
    },
    pickerRow: {
        width: '100%',
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    pickerButtonText: {
        fontSize: 14,
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
    },
    pickerLabel: {
        fontSize: 11,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.4)',
    },
    startButton: {
        width: '100%',
        height: 50,
        borderRadius: 16,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    startButtonText: {
        color: '#121214',
        fontSize: 15,
        fontFamily: 'Tajawal-Bold',
    },
    resumeCard: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: 'rgba(234, 179, 8, 0.06)',
        borderWidth: 1,
        borderColor: 'rgba(234, 179, 8, 0.15)',
        borderRadius: 20,
        padding: 16,
        gap: 12,
    },
    resumeIconBox: {
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resumeDetails: {
        flex: 1,
        alignItems: 'flex-end',
    },
    resumeTitle: {
        fontSize: 14,
        fontFamily: 'Tajawal-Bold',
        color: '#EAB308',
    },
    resumeSubtitle: {
        fontSize: 11,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: 4,
    },
    historySection: {
        gap: 12,
    },
    historyHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historyTitle: {
        fontSize: 16,
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
    },
    historyLink: {
        fontSize: 12,
        fontFamily: 'Tajawal-Medium',
        color: '#EAB308',
    },
    emptyHistoryCard: {
        backgroundColor: 'rgba(39, 39, 42, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    emptyHistoryText: {
        fontSize: 12,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.3)',
        textAlign: 'center',
        lineHeight: 18,
    },
    historyItemCard: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: 'rgba(39, 39, 42, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 16,
        gap: 16,
    },
    scoreBadge: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreBadgeText: {
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-Bold',
    },
    historyItemInfo: {
        flex: 1,
        alignItems: 'flex-end',
    },
    historyItemName: {
        fontSize: 14,
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
    },
    historyItemSubtitle: {
        fontSize: 11,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderTopWidth: 1,
        maxHeight: '70%',
        paddingBottom: 30,
    },
    modalHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
    },
    modalItem: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.02)',
    },
    modalItemSelected: {
        backgroundColor: 'rgba(234, 179, 8, 0.08)',
    },
    modalItemArabic: {
        fontSize: 18,
        fontFamily: 'Amiri-Bold',
        color: '#EAB308',
    },
    modalItemLabel: {
        fontSize: 14,
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
    }
});
