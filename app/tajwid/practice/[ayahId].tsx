import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Platform, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useThemeColor';
import { useThemeContext } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuran } from '@/hooks/useQuran';
import surahsData from '../../../assets/data/surahs.json';

const { width } = Dimensions.get('window');

interface MistakeItem {
    word: string;
    wordIndex: number;
    rule: string;
    ruleArabic: string;
    message: string;
    tip: string;
}

interface PracticeHistoryItem {
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    score: number;
    timestamp: number;
}

export default function TajwidPracticeScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { isDark } = useThemeContext();
    const { ayahId } = useLocalSearchParams<{ ayahId: string }>();
    const { getSurah } = useQuran();

    // Parse Surah and Ayah numbers
    const [surahNum, ayahNum] = (ayahId || '1_1').split('_').map(Number);
    const surahData = surahsData.find(s => s.number === surahNum);
    const surah = getSurah(surahNum);
    const verseText = surah?.verses.find(v => v.id === ayahNum)?.text || '';

    // Audio & Recording states
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlayingReference, setIsPlayingReference] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [recordDuration, setRecordDuration] = useState(0);
    const [recordingUri, setRecordingUri] = useState<string | null>(null);

    // Flow states
    const [status, setStatus] = useState<'idle' | 'recording' | 'analyzing' | 'completed'>('idle');
    const [score, setScore] = useState(0);
    const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
    const [selectedMistake, setSelectedMistake] = useState<MistakeItem | null>(null);

    const recordingTimer = useRef<any>(null);
    const recordPulse = useSharedValue(1);

    // Load reference audio URL
    const getReferenceAudioUrl = () => {
        const sStr = String(surahNum).padStart(3, '0');
        const aStr = String(ayahNum).padStart(3, '0');
        return `https://everyayah.com/data/Husary_Muallim_128kbps/${sStr}${aStr}.mp3`;
    };

    // Clean up sounds on unmount
    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
            if (recordingTimer.current) {
                clearInterval(recordingTimer.current);
            }
        };
    }, [sound]);

    // Handle reference audio playback
    const playReferenceRecitation = async () => {
        try {
            if (isPlayingReference) {
                if (sound) {
                    await sound.pauseAsync();
                    setIsPlayingReference(false);
                }
                return;
            }

            // If already loaded
            if (sound) {
                await sound.replayAsync();
                setIsPlayingReference(true);
                return;
            }

            const url = getReferenceAudioUrl();
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: url },
                { shouldPlay: true }
            );

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlayingReference(false);
                }
            });

            setSound(newSound);
            setIsPlayingReference(true);
        } catch (error) {
            console.error('Failed to play reference recitation:', error);
        }
    };

    // Start user recording
    const startRecording = async () => {
        try {
            if (Platform.OS === 'web') {
                // Mock web recording
                setIsRecording(true);
                setRecordDuration(0);
                setStatus('recording');
                recordPulse.value = withRepeat(
                    withSequence(withTiming(1.2, { duration: 500 }), withTiming(1, { duration: 500 })),
                    -1,
                    true
                );
                recordingTimer.current = setInterval(() => {
                    setRecordDuration(prev => prev + 1);
                }, 1000);
                return;
            }

            const permission = await Audio.requestPermissionsAsync();
            if (permission.status !== 'granted') {
                alert('نحتاج صلاحية الميكروفون لتسجيل تلاوتك');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(newRecording);
            setIsRecording(true);
            setRecordDuration(0);
            setStatus('recording');

            recordPulse.value = withRepeat(
                withSequence(withTiming(1.2, { duration: 500 }), withTiming(1, { duration: 500 })),
                -1,
                true
            );

            recordingTimer.current = setInterval(() => {
                setRecordDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Failed to start recording:', err);
        }
    };

    // Stop recording and start simulated analysis
    const stopRecording = async () => {
        if (recordingTimer.current) {
            clearInterval(recordingTimer.current);
        }
        recordPulse.value = 1;

        if (Platform.OS === 'web') {
            setIsRecording(false);
            if (recordDuration < 2) {
                alert('التسجيل قصير جداً، يرجى التلاوة بشكل كامل.');
                setStatus('idle');
                return;
            }
            runAnalysis();
            return;
        }

        if (!recording) return;

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecordingUri(uri);
            setIsRecording(false);
            setRecording(null);

            if (recordDuration < 2) {
                alert('التسجيل قصير جداً، يرجى التلاوة بشكل كامل.');
                setStatus('idle');
                return;
            }

            runAnalysis();
        } catch (err) {
            console.error('Failed to stop recording:', err);
            setStatus('idle');
        }
    };

    // Simulated Tajwid rules scoring based on the Arabic verse words
    const runAnalysis = () => {
        setStatus('analyzing');

        // Simulate network/grading delay
        setTimeout(async () => {
            const words = verseText.split(/\s+/);
            const calculatedMistakes: MistakeItem[] = [];

            // Simple parser rules based on text:
            words.forEach((word, index) => {
                // Rule 1: Madd (superscript Alif, Alif, Waw, Ya elongations)
                if (word.includes('ٰ') || word.includes('آ') || (word.includes('ا') && index % 3 === 0)) {
                    // Let's create a simulated recommendation for Madd
                    if (Math.random() > 0.6) { // 40% chance of a tip
                        calculatedMistakes.push({
                            word,
                            wordIndex: index,
                            rule: 'madd',
                            ruleArabic: 'المد',
                            message: 'تقصير زمن المد الطبيعي',
                            tip: 'تأكد من إشباع مد حرف الألف بمقدار حركتين بوضوح.'
                        });
                    }
                }
                // Rule 2: Ghunnah (Noon/Meem Mushaddadah)
                else if (word.includes('نّ') || word.includes('مّ')) {
                    if (Math.random() > 0.5) {
                        calculatedMistakes.push({
                            word,
                            wordIndex: index,
                            rule: 'ghunnah',
                            ruleArabic: 'الغنة',
                            message: 'عدم تمكين الغنة في الحرف المشدد',
                            tip: 'اضغط على الحرف المشدد لإخراج غنة واضحة من الخيشوم بمقدار حركتين.'
                        });
                    }
                }
                // Rule 3: Qalqalah (Letters of Qutb Jad)
                else if ((word.includes('ق') || word.includes('ط') || word.includes('ب') || word.includes('ج') || word.includes('د')) && index % 4 === 1) {
                    if (Math.random() > 0.7) {
                        calculatedMistakes.push({
                            word,
                            wordIndex: index,
                            rule: 'qalqalah',
                            ruleArabic: 'القلقلة',
                            message: 'عدم قلقلة الحرف عند السكون',
                            tip: 'انطق الحرف الساكن بنبرة قوية ونبرة ارتدادية لتثبيت صفة القلقلة.'
                        });
                    }
                }
            });

            // Calculate score
            const mistakePenalty = calculatedMistakes.length * 8;
            const finalScore = Math.max(78, 100 - mistakePenalty - Math.floor(Math.random() * 5));

            setScore(finalScore);
            setMistakes(calculatedMistakes);
            setStatus('completed');

            // Save results to storage
            try {
                const historyRaw = await AsyncStorage.getItem('tajwid_history');
                const history: PracticeHistoryItem[] = historyRaw ? JSON.parse(historyRaw) : [];
                
                const newPractice: PracticeHistoryItem = {
                    surahNumber: surahNum,
                    surahName: surahData?.name || 'غير معروف',
                    ayahNumber: ayahNum,
                    score: finalScore,
                    timestamp: Date.now()
                };

                // Add to history
                history.unshift(newPractice);
                await Promise.all([
                    AsyncStorage.setItem('tajwid_history', JSON.stringify(history)),
                    AsyncStorage.setItem('tajwid_last_practice', JSON.stringify(newPractice))
                ]);
            } catch (e) {
                console.error('Failed to save practice results:', e);
            }

        }, 3000);
    };

    const pulseStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: recordPulse.value }],
        };
    });

    const isWordMistake = (wordIdx: number) => {
        return mistakes.some(m => m.wordIndex === wordIdx);
    };

    const getWordMistakeData = (wordIdx: number) => {
        return mistakes.find(m => m.wordIndex === wordIdx) || null;
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={[styles.container, { backgroundColor: '#18181B' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Ambient Gold Mesh Glows */}
            <LinearGradient
                colors={['rgba(234, 179, 8, 0.12)', 'transparent']}
                style={styles.glowTopLeft}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerTitleBox}>
                    <Text style={styles.headerTitle}>سورة {surahData?.name}</Text>
                    <Text style={styles.headerSubtitle}>الآية {ayahNum} من {surahData?.numberOfAyahs}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Quran Text Card */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.card}>
                    <View style={styles.arabicTextWrapper}>
                        {verseText.split(/\s+/).map((word, idx) => {
                            const mistake = getWordMistakeData(idx);
                            const hasMistake = !!mistake;
                            const isSelected = selectedMistake?.wordIndex === idx;

                            return (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => {
                                        if (hasMistake) {
                                            setSelectedMistake(isSelected ? null : mistake);
                                        }
                                    }}
                                    activeOpacity={hasMistake ? 0.7 : 1}
                                    style={[
                                        styles.wordTouch,
                                        hasMistake && styles.wordHighlightContainer,
                                        isSelected && styles.wordHighlightSelected
                                    ]}
                                >
                                    <Text style={[
                                        styles.quranText,
                                        hasMistake ? styles.wordHighlightText : { color: '#E4E4E7' },
                                        isSelected && { color: '#FFFFFF' }
                                    ]}>
                                        {word}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>

                {/* Selected Mistake Detail Pop-Up Box */}
                {selectedMistake && (
                    <Animated.View entering={FadeInUp.springify()} style={styles.mistakePopupCard}>
                        <View style={styles.mistakeHeader}>
                            <View style={styles.mistakeBadge}>
                                <Text style={styles.mistakeBadgeText}>{selectedMistake.ruleArabic}</Text>
                            </View>
                            <Text style={styles.mistakeTitle}>ملاحظة تجويدية: &quot;{selectedMistake.word}&quot;</Text>
                        </View>
                        <Text style={styles.mistakeMessage}>{selectedMistake.message}</Text>
                        <View style={styles.mistakeTipRow}>
                            <Ionicons name="bulb-outline" size={16} color="#EAB308" />
                            <Text style={styles.mistakeTipText}>{selectedMistake.tip}</Text>
                        </View>
                    </Animated.View>
                )}

                {/* Flow Control Panels */}
                {status === 'idle' && (
                    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.controlCard}>
                        <Text style={styles.controlHeader}>الخطوة الأولى: الاستماع للشيخ الحصري</Text>
                        <Text style={styles.controlDesc}>استمع إلى اللفظ والتجويد الصحيح للآية الكريمة قبل البدء في تسجيل صوتك.</Text>
                        
                        <TouchableOpacity style={styles.referencePlayButton} onPress={playReferenceRecitation} activeOpacity={0.85}>
                            <Ionicons name={isPlayingReference ? "pause" : "play"} size={20} color="#121214" />
                            <Text style={styles.referencePlayButtonText}>
                                {isPlayingReference ? "إيقاف الاستماع" : "استمع للآية الكريمة"}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <Text style={styles.controlHeader}>الخطوة الثانية: سجّل تلاوتك</Text>
                        <TouchableOpacity style={styles.recordTriggerButton} onPress={startRecording} activeOpacity={0.9}>
                            <Ionicons name="mic" size={24} color="#EAB308" />
                            <Text style={styles.recordTriggerText}>اضغط للبدء في التسجيل</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {status === 'recording' && (
                    <Animated.View entering={FadeInDown.springify()} style={styles.controlCardCentered}>
                        <Text style={styles.recordingTimer}>{formatTime(recordDuration)}</Text>
                        <Text style={styles.recordingHint}>أنت الآن تسجل... اقرأ الآية بصوت واضح</Text>

                        <Animated.View style={[styles.pulseRing, pulseStyle]}>
                            <TouchableOpacity style={styles.stopRecordingButton} onPress={stopRecording} activeOpacity={0.9}>
                                <Ionicons name="square" size={28} color="#FFFFFF" />
                            </TouchableOpacity>
                        </Animated.View>

                        <Text style={styles.recordingStopHint}>اضغط على الزر عند الانتهاء</Text>
                    </Animated.View>
                )}

                {status === 'analyzing' && (
                    <Animated.View entering={FadeInDown.springify()} style={styles.controlCardCentered}>
                        <ActivityIndicator size="large" color="#EAB308" style={{ marginBottom: 16 }} />
                        <Text style={styles.analyzingHeader}>جاري تحليل تلاوتك...</Text>
                        <Text style={styles.analyzingDesc}>نعمل على فحص دقة النطق ومطابقة قواعد المد والغنة للآية.</Text>
                    </Animated.View>
                )}

                {status === 'completed' && (
                    <Animated.View entering={FadeInDown.springify()} style={styles.resultsCard}>
                        {/* Score Circular Arc */}
                        <View style={styles.resultsHeader}>
                            <View style={styles.scoreGauge}>
                                <Text style={styles.resultsScore}>{score}%</Text>
                                <Text style={styles.resultsScoreLabel}>التقييم</Text>
                            </View>
                            <View style={styles.resultsSum}>
                                <Text style={styles.resultsVerdict}>
                                    {score >= 90 ? 'تلاوة ممتازة ومتقنة!' : score >= 80 ? 'تلاوة جيدة، انتبه للملاحظات.' : 'حاول مرة أخرى لتحسين التجويد.'}
                                </Text>
                                <Text style={styles.resultsSubVerdict}>
                                    {mistakes.length === 0 ? 'رائع! لم يتم رصد أي أخطاء تجويدية.' : `تم رصد ${mistakes.length} ملاحظات تجويدية في الآية.`}
                                </Text>
                            </View>
                        </View>

                        {/* Interactive tips reminder */}
                        {mistakes.length > 0 && (
                            <View style={styles.interactiveAlert}>
                                <Ionicons name="information-circle-outline" size={16} color="#EAB308" />
                                <Text style={styles.interactiveAlertText}>انقر على الكلمات المظللة باللون الذهبي في الأعلى للاطلاع على تفاصيل كل ملاحظة.</Text>
                            </View>
                        )}

                        <View style={styles.resultsActions}>
                            <TouchableOpacity 
                                style={styles.retryButton} 
                                onPress={() => {
                                    setStatus('idle');
                                    setSelectedMistake(null);
                                }}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                                <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.finishButton} 
                                onPress={() => router.push('/tajwid' as any)}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#EAB308', '#CA8A04']}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                />
                                <Text style={styles.finishButtonText}>العودة للرئيسية</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}

                <View style={{ height: 60 }} />
            </ScrollView>
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
    headerTitleBox: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 11,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 2,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 16,
    },
    card: {
        backgroundColor: 'rgba(39, 39, 42, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    arabicTextWrapper: {
        flexDirection: 'row-reverse',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    wordTouch: {
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderRadius: 8,
    },
    wordHighlightContainer: {
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(234, 179, 8, 0.25)',
    },
    wordHighlightSelected: {
        backgroundColor: '#EAB308',
    },
    wordHighlightText: {
        color: '#EAB308',
        fontWeight: 'bold',
    },
    quranText: {
        fontSize: 26,
        fontFamily: 'Amiri-Regular',
        textAlign: 'center',
        lineHeight: 46,
    },
    mistakePopupCard: {
        backgroundColor: 'rgba(39, 39, 42, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 20,
        padding: 16,
        gap: 10,
    },
    mistakeHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    mistakeBadge: {
        backgroundColor: 'rgba(234, 179, 8, 0.15)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    mistakeBadgeText: {
        fontSize: 10,
        fontFamily: 'Tajawal-Bold',
        color: '#EAB308',
    },
    mistakeTitle: {
        fontSize: 13,
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
    },
    mistakeMessage: {
        fontSize: 13,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'right',
        lineHeight: 18,
    },
    mistakeTipRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 10,
        padding: 10,
    },
    mistakeTipText: {
        fontSize: 11,
        fontFamily: 'Tajawal-Medium',
        color: '#EAB308',
        flex: 1,
        textAlign: 'right',
    },
    controlCard: {
        backgroundColor: 'rgba(39, 39, 42, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 24,
        padding: 20,
    },
    controlHeader: {
        fontSize: 14,
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
        textAlign: 'right',
        marginBottom: 6,
    },
    controlDesc: {
        fontSize: 11,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.4)',
        textAlign: 'right',
        lineHeight: 16,
        marginBottom: 16,
    },
    referencePlayButton: {
        flexDirection: 'row-reverse',
        height: 48,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    referencePlayButtonText: {
        fontSize: 14,
        fontFamily: 'Tajawal-Bold',
        color: '#121214',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginVertical: 16,
    },
    recordTriggerButton: {
        flexDirection: 'row-reverse',
        height: 48,
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(234, 179, 8, 0.25)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    recordTriggerText: {
        fontSize: 14,
        fontFamily: 'Tajawal-Bold',
        color: '#EAB308',
    },
    controlCardCentered: {
        backgroundColor: 'rgba(39, 39, 42, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recordingTimer: {
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-ExtraBold',
        color: '#FF7043',
        marginBottom: 8,
    },
    recordingHint: {
        fontSize: 12,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.4)',
        marginBottom: 24,
    },
    pulseRing: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 112, 67, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    stopRecordingButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FF7043',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingStopHint: {
        fontSize: 11,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.3)',
    },
    analyzingHeader: {
        fontSize: 15,
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    analyzingDesc: {
        fontSize: 11,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.4)',
        textAlign: 'center',
        lineHeight: 16,
    },
    resultsCard: {
        backgroundColor: 'rgba(39, 39, 42, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 24,
        padding: 20,
        gap: 16,
    },
    resultsHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 16,
    },
    scoreGauge: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 4,
        borderColor: '#EAB308',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(234, 179, 8, 0.05)',
    },
    resultsScore: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Tajawal-ExtraBold',
        color: '#EAB308',
    },
    resultsScoreLabel: {
        fontSize: 8,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 2,
    },
    resultsSum: {
        flex: 1,
        alignItems: 'flex-end',
        gap: 4,
    },
    resultsVerdict: {
        fontSize: 15,
        fontFamily: 'Tajawal-Bold',
        color: '#FFFFFF',
    },
    resultsSubVerdict: {
        fontSize: 11,
        fontFamily: 'Tajawal-Medium',
        color: 'rgba(255, 255, 255, 0.4)',
        textAlign: 'right',
    },
    interactiveAlert: {
        flexDirection: 'row-reverse',
        gap: 8,
        backgroundColor: 'rgba(234, 179, 8, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(234, 179, 8, 0.1)',
        borderRadius: 14,
        padding: 12,
        alignItems: 'center',
    },
    interactiveAlertText: {
        fontSize: 10,
        fontFamily: 'Tajawal-Medium',
        color: '#EAB308',
        flex: 1,
        textAlign: 'right',
        lineHeight: 14,
    },
    resultsActions: {
        flexDirection: 'row-reverse',
        gap: 12,
        marginTop: 8,
    },
    retryButton: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Tajawal-Bold',
    },
    finishButton: {
        flex: 1.5,
        height: 48,
        borderRadius: 14,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    finishButtonText: {
        color: '#121214',
        fontSize: 14,
        fontFamily: 'Tajawal-Bold',
    }
});
