import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useThemeColor';
import { ScalePressable } from '@/components/ui/ScalePressable';
import { useQuran } from '@/hooks/useQuran';

interface ContinueReadingProps {
    lastRead: {
        surahId: number;
        page: number;
    } | null;
}

export function ContinueReading({ lastRead }: ContinueReadingProps) {
    const theme = useTheme();
    const router = useRouter();
    const { getSurah } = useQuran();

    const surah = lastRead ? getSurah(lastRead.surahId) : null;

    if (!lastRead || !surah) {
        // Show promo card to start reading
        return (
            <Animated.View
                entering={FadeInDown.delay(400).springify()}
                style={styles.container}
            >
                <ScalePressable
                    onPress={() => router.push('/(tabs)/quran')}
                    style={styles.promoCard}
                >
                    <LinearGradient
                        colors={[theme.primary, '#059669']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                    <View style={styles.promoContent}>
                        <View>
                            <Text style={styles.promoTitle}>ابدأ ختمة جديدة</Text>
                            <Text style={styles.promoSubtitle}>اقرأ القرآن الكريم كاملاً</Text>
                        </View>
                        <Ionicons name="book" size={40} color="#FFF" style={{ opacity: 0.9 }} />
                    </View>
                </ScalePressable>
            </Animated.View>
        );
    }

    return (
        <Animated.View
            entering={FadeInDown.delay(400).springify()}
            style={styles.container}
        >
            <View style={styles.header}>
                <Ionicons name="book-outline" size={18} color={theme.primary} />
                <Text style={[styles.title, { color: theme.text }]}>تابع القراءة</Text>
            </View>

            <ScalePressable
                onPress={() => {
                    router.push({
                        pathname: '/quran/[id]',
                        params: { id: lastRead.surahId, page: lastRead.page }
                    });
                }}
                style={[styles.continueCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
            >
                <View style={[styles.surahIcon, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.surahNumber, { color: theme.primary }]}>{surah.id}</Text>
                </View>
                <View style={styles.textContent}>
                    <Text style={[styles.surahName, { color: theme.text }]}>{surah.name}</Text>
                    <Text style={[styles.pageNumber, { color: theme.textSecondary }]}>
                        صفحة {lastRead.page}
                    </Text>
                </View>
                <View style={styles.playButton}>
                    <Ionicons name="play-circle" size={36} color={theme.primary} />
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
    continueCard: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    surahIcon: {
        width: 50,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 16,
    },
    surahNumber: {
        fontSize: 18,
        fontFamily: 'Tajawal-Bold',
    },
    textContent: {
        flex: 1,
        alignItems: 'flex-end',
    },
    surahName: {
        fontSize: 18,
        fontFamily: 'Tajawal-Bold',
        marginBottom: 4,
    },
    pageNumber: {
        fontSize: 14,
        fontFamily: 'Tajawal-Regular',
    },
    playButton: {
        marginRight: 8,
    },
    promoCard: {
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden',
        height: 120,
        justifyContent: 'center',
    },
    promoContent: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    promoTitle: {
        color: '#FFF',
        fontSize: 20,
        fontFamily: 'Tajawal-Bold',
        marginBottom: 4,
        textAlign: 'right',
    },
    promoSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontFamily: 'Tajawal-Medium',
        textAlign: 'right',
    },
});
