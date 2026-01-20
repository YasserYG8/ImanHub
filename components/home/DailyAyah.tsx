import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown,
    FadeIn,
    FadeOut,
    Layout
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useThemeColor';
import { ScalePressable } from '@/components/ui/ScalePressable';

interface DailyAyahProps {
    delay?: number;
}

// Featured verses for daily rotation - meaningful inspirational ayahs
const FEATURED_VERSES = [
    { surah: 94, ayah: 5, text: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', surahName: 'الشرح', page: 596 },
    { surah: 2, ayah: 286, text: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا', surahName: 'البقرة', page: 49 },
    { surah: 3, ayah: 139, text: 'وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ', surahName: 'آل عمران', page: 67 },
    { surah: 65, ayah: 3, text: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ', surahName: 'الطلاق', page: 558 },
    { surah: 39, ayah: 53, text: 'لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ', surahName: 'الزمر', page: 464 },
    { surah: 13, ayah: 28, text: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', surahName: 'الرعد', page: 252 },
    { surah: 2, ayah: 152, text: 'فَاذْكُرُونِي أَذْكُرْكُمْ', surahName: 'البقرة', page: 23 },
    { surah: 29, ayah: 69, text: 'وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا', surahName: 'العنكبوت', page: 404 },
    { surah: 8, ayah: 46, text: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', surahName: 'الأنفال', page: 183 },
    { surah: 94, ayah: 6, text: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', surahName: 'الشرح', page: 596 },
    { surah: 2, ayah: 45, text: 'وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ', surahName: 'البقرة', page: 7 },
    { surah: 9, ayah: 51, text: 'قُل لَّن يُصِيبَنَا إِلَّا مَا كَتَبَ اللَّهُ لَنَا', surahName: 'التوبة', page: 195 },
    { surah: 3, ayah: 173, text: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', surahName: 'آل عمران', page: 72 },
    { surah: 12, ayah: 87, text: 'إِنَّهُ لَا يَيْأَسُ مِن رَّوْحِ اللَّهِ إِلَّا الْقَوْمُ الْكَافِرُونَ', surahName: 'يوسف', page: 246 },
    { surah: 21, ayah: 87, text: 'لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ', surahName: 'الأنبياء', page: 329 },
    { surah: 40, ayah: 60, text: 'ادْعُونِي أَسْتَجِبْ لَكُمْ', surahName: 'غافر', page: 474 },
    { surah: 2, ayah: 186, text: 'إِنِّي قَرِيبٌ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ', surahName: 'البقرة', page: 28 },
    { surah: 50, ayah: 16, text: 'وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ', surahName: 'ق', page: 519 },
];

export function DailyAyah({ delay = 300 }: DailyAyahProps) {
    const theme = useTheme();
    const router = useRouter();
    const [verse, setVerse] = useState(FEATURED_VERSES[0]);
    const [verseKey, setVerseKey] = useState(0); // For animation trigger

    useEffect(() => {
        // Select verse based on day of year
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const index = dayOfYear % FEATURED_VERSES.length;
        setVerse(FEATURED_VERSES[index]);
    }, []);

    const handleRefresh = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Get random verse different from current
        const currentIndex = FEATURED_VERSES.findIndex(v => v.surah === verse.surah && v.ayah === verse.ayah);
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * FEATURED_VERSES.length);
        } while (newIndex === currentIndex && FEATURED_VERSES.length > 1);

        setVerseKey(prev => prev + 1); // Trigger animation
        setVerse(FEATURED_VERSES[newIndex]);
    }, [verse]);

    const handleNavigate = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Navigate to Quran in text mode with specific ayah
        router.push({
            pathname: '/quran/[id]',
            params: {
                id: verse.surah,
                ayah: verse.ayah,
                page: verse.page, // Pass the page number
                textMode: 'true' // Force text mode to show the specific ayah
            }
        });
    }, [verse, router]);

    return (
        <Animated.View
            entering={FadeInDown.delay(delay).springify()}
            style={styles.container}
        >
            <View style={styles.header}>
                <Ionicons name="book" size={18} color={theme.primary} />
                <Text style={[styles.title, { color: theme.text }]}>آية اليوم</Text>
            </View>

            <ScalePressable onPress={handleNavigate}>
                <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <LinearGradient
                        colors={[theme.primary + '15', 'transparent']}
                        style={styles.cardGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />

                    {/* Refresh Button */}
                    <TouchableOpacity
                        style={[styles.refreshButton, { backgroundColor: theme.primary + '20' }]}
                        onPress={handleRefresh}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="refresh" size={18} color={theme.primary} />
                    </TouchableOpacity>

                    {/* Animated Verse Content */}
                    <Animated.View
                        key={verseKey}
                        entering={FadeIn.duration(400)}
                        exiting={FadeOut.duration(200)}
                        layout={Layout.springify()}
                        style={styles.quoteContainer}
                    >
                        <Text style={styles.quoteIcon}>"</Text>
                        <Text style={[styles.ayahText, { color: theme.text }]}>
                            {verse.text}
                        </Text>
                        <Text style={[styles.quoteIcon, styles.quoteEnd]}>"</Text>
                    </Animated.View>

                    <View style={styles.footer}>
                        <Animated.View
                            key={`ref-${verseKey}`}
                            entering={FadeIn.delay(200).duration(300)}
                            style={styles.reference}
                        >
                            <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                            <Text style={[styles.referenceText, { color: theme.textSecondary }]}>
                                سورة {verse.surahName} - آية {verse.ayah}
                            </Text>
                        </Animated.View>

                        <View style={styles.tapHint}>
                            <Ionicons name="chevron-back" size={14} color={theme.primary} />
                            <Text style={[styles.tapHintText, { color: theme.primary }]}>اقرأ</Text>
                        </View>
                    </View>
                </View>
            </ScalePressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontFamily: 'Tajawal-Bold',
    },
    card: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    refreshButton: {
        position: 'absolute',
        top: 12,
        left: 12,
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    quoteContainer: {
        alignItems: 'center',
        marginBottom: 16,
        paddingTop: 8,
    },
    quoteIcon: {
        fontSize: 32,
        color: '#10B981',
        fontFamily: 'serif',
        opacity: 0.5,
    },
    quoteEnd: {
        alignSelf: 'flex-start',
    },
    ayahText: {
        fontSize: 24,
        fontFamily: 'Tajawal-Bold',
        textAlign: 'center',
        lineHeight: 40,
        marginVertical: 8,
    },
    footer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    reference: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
    },
    referenceText: {
        fontSize: 14,
        fontFamily: 'Tajawal-Regular',
    },
    tapHint: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 2,
    },
    tapHintText: {
        fontSize: 13,
        fontFamily: 'Tajawal-Medium',
    },
});
