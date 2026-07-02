import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useThemeColor';
import { useThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import Animated, {
    FadeInDown,
    FadeInUp,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    interpolate,
    Extrapolation,
    withTiming,
    withSpring,
    runOnJS
} from 'react-native-reanimated';
import { EVENT_DETAILS } from '@/utils/islamicEventsDetails';
import Toast, { ToastRef } from '@/components/Toast';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = Platform.OS === 'ios' ? 120 : 100;

export default function EventDetailsScreen() {
    const { id } = useLocalSearchParams();
    const theme = useTheme();
    const router = useRouter();
    const { isDark } = useThemeContext();
    const scrollY = useSharedValue(0);

    const event = EVENT_DETAILS[id as string];

    // Toast ref
    const toastRef = React.useRef<ToastRef>(null);

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
        toastRef.current?.show('تم النسخ بنجاح', 'success');
    };

    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    const headerOpacity = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [0, 100],
            [0, 1],
            Extrapolation.CLAMP
        );
        return { opacity };
    });

    // Premium color palette
    const colors = {
        primary: isDark ? '#10B981' : '#059669',
        primaryLight: isDark ? '#065F46' : '#D1FAE5',
        gold: '#F59E0B',
        goldLight: 'rgba(245, 158, 11, 0.15)',
        cardBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.95)',
        cardBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        text: isDark ? '#FFFFFF' : '#1F2937',
        textSecondary: isDark ? 'rgba(255, 255, 255, 0.7)' : '#6B7280',
        accent: isDark ? '#34D399' : '#10B981',
    };

    if (!event) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="alert-circle-outline" size={64} color={theme.textSecondary} />
                <Text style={{ color: theme.text, fontSize: 20, fontFamily: 'Tajawal-Bold', marginTop: 16 }}>المناسبة غير موجودة</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: theme.primary, borderRadius: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Tajawal-Bold' }}>العودة للرئيسية</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Beautiful Gradient Background */}
            <LinearGradient
                colors={isDark ? ['#0D1117', '#161B22', '#1C2128'] : ['#ECFDF5', '#D1FAE5', '#A7F3D0']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Decorative Circles */}
            <View style={[styles.decorCircle, { top: -100, right: -100, backgroundColor: colors.primary, opacity: isDark ? 0.15 : 0.1 }]} />
            <View style={[styles.decorCircle, { bottom: 200, left: -150, backgroundColor: colors.gold, opacity: isDark ? 0.1 : 0.08 }]} />

            {/* Fixed Header */}
            <Animated.View style={[styles.fixedHeader, headerOpacity]}>
                <LinearGradient
                    colors={isDark ? ['rgba(13, 17, 23, 0.95)', 'rgba(22, 27, 34, 0.95)'] : ['#059669', '#10B981']}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>

            {/* Navigation Bar */}
            <View style={styles.navbar}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-forward" size={24} color={isDark ? '#FFF' : colors.text} />
                </TouchableOpacity>

                <Animated.Text
                    style={[styles.navTitle, headerOpacity, { color: '#FFF' }]}
                    numberOfLines={1}
                >
                    {event.title}
                </Animated.Text>

                <View style={{ width: 44 }} />
            </View>

            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Title Section */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroSection}>
                    <View style={styles.eventBadge}>
                        <Ionicons name="star" size={14} color={colors.gold} />
                        <Text style={styles.badgeText}>مناسبة إسلامية</Text>
                    </View>
                    <Text style={[styles.heroTitle, { color: colors.text }]}>{event.title}</Text>
                    <View style={styles.heroDecor}>
                        <View style={[styles.decorLine, { backgroundColor: colors.primary }]} />
                        <Ionicons name="sparkles" size={20} color={colors.gold} />
                        <View style={[styles.decorLine, { backgroundColor: colors.primary }]} />
                    </View>
                </Animated.View>

                {/* Description Card */}
                <Animated.View
                    entering={FadeInUp.delay(200).springify()}
                    style={[styles.premiumCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                >
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>نبذة عن المناسبة</Text>
                        <View style={[styles.iconBadge, { backgroundColor: colors.primaryLight }]}>
                            <Ionicons name="information-circle" size={22} color={colors.primary} />
                        </View>
                    </View>
                    <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                        {event.description}
                    </Text>
                </Animated.View>

                {/* Virtues Section */}
                {event.virtues && event.virtues.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRow}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>الفضائل والأجر</Text>
                            <View style={[styles.sectionIcon, { backgroundColor: colors.goldLight }]}>
                                <Ionicons name="gift" size={18} color={colors.gold} />
                            </View>
                        </View>

                        {event.virtues.map((virtue, index) => (
                            <Animated.View
                                key={index}
                                entering={FadeInUp.delay(300 + (index * 80)).springify()}
                                style={[styles.virtueCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                            >
                                <View style={[styles.virtueNumber, { backgroundColor: colors.goldLight }]}>
                                    <Text style={[styles.virtueNumberText, { color: colors.gold }]}>{index + 1}</Text>
                                </View>
                                <Text style={[styles.virtueText, { color: colors.text }]}>{virtue}</Text>
                            </Animated.View>
                        ))}
                    </View>
                )}

                {/* Hadith Section - Redesigned */}
                {event.hadiths && event.hadiths.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRow}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>من مشكاة النبوة</Text>
                            <View style={[styles.sectionIcon, { backgroundColor: colors.primaryLight }]}>
                                <Ionicons name="book" size={18} color={colors.primary} />
                            </View>
                        </View>

                        {event.hadiths.map((hadith, index) => (
                            <Animated.View
                                key={index}
                                entering={FadeInUp.delay(400 + (index * 100)).springify()}
                                style={[styles.hadithCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                            >
                                {/* Decorative Quote Mark */}
                                <View style={styles.quoteMarkContainer}>
                                    <Text style={[styles.quoteMark, { color: colors.primary }]}>&quot;</Text>
                                </View>

                                {/* Hadith Text - Centered */}
                                <Text style={[styles.hadithText, { color: colors.text }]}>
                                    {hadith.text}
                                </Text>

                                {/* Elegant Divider */}
                                <View style={styles.hadithDivider}>
                                    <View style={[styles.dividerLine, { backgroundColor: colors.cardBorder }]} />
                                    <View style={[styles.dividerDot, { backgroundColor: colors.primary }]} />
                                    <View style={[styles.dividerLine, { backgroundColor: colors.cardBorder }]} />
                                </View>

                                {/* Source */}
                                <Text style={[styles.hadithSource, { color: colors.textSecondary }]}>
                                    {hadith.source}
                                </Text>

                                {/* Copy Button */}
                                <TouchableOpacity
                                    style={[styles.copyButton, { backgroundColor: colors.primaryLight }]}
                                    onPress={() => copyToClipboard(`${hadith.text}\n\n${hadith.source}`)}
                                >
                                    <Ionicons name="copy-outline" size={18} color={colors.primary} />
                                    <Text style={[styles.copyButtonText, { color: colors.primary }]}>نسخ الحديث</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </View>
                )}

                {/* Practices Section */}
                {event.practices && event.practices.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRow}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>الأعمال المستحبة</Text>
                            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                                <Ionicons name="checkmark-done" size={18} color={colors.accent} />
                            </View>
                        </View>

                        <Animated.View
                            entering={FadeInUp.delay(500).springify()}
                            style={[styles.practicesCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                        >
                            {event.practices.map((practice, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.practiceItem,
                                        index !== event.practices!.length - 1 && { borderBottomColor: colors.cardBorder, borderBottomWidth: 1 }
                                    ]}
                                >
                                    <View style={[styles.practiceCheckbox, { borderColor: colors.accent, backgroundColor: colors.primaryLight }]}>
                                        <Ionicons name="checkmark" size={14} color={colors.accent} />
                                    </View>
                                    <Text style={[styles.practiceText, { color: colors.text }]}>{practice}</Text>
                                </View>
                            ))}
                        </Animated.View>
                    </View>
                )}

                {/* Bottom Spacing */}
                <View style={{ height: 80 }} />
            </Animated.ScrollView>

            <Toast ref={toastRef} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    decorCircle: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
    },
    fixedHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: HEADER_HEIGHT,
        zIndex: 99,
    },
    navbar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navTitle: {
        fontSize: 18,
        fontFamily: 'Tajawal-Bold',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 12,
    },
    scrollContent: {
        paddingTop: HEADER_HEIGHT + 20,
        paddingHorizontal: 20,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 32,
        paddingTop: 20,
    },
    eventBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        marginBottom: 16,
    },
    badgeText: {
        color: '#F59E0B',
        fontFamily: 'Tajawal-Medium',
        fontSize: 13,
    },
    heroTitle: {
        fontSize: 32,
        fontFamily: 'Tajawal-Bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    heroDecor: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    decorLine: {
        width: 40,
        height: 2,
        borderRadius: 1,
    },
    premiumCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    cardTitle: {
        fontSize: 20,
        fontFamily: 'Tajawal-Bold',
        flex: 1,
        textAlign: 'right',
    },
    iconBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    descriptionText: {
        fontSize: 16,
        fontFamily: 'Tajawal-Regular',
        textAlign: 'right',
        lineHeight: 28,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitleRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginBottom: 16,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'Tajawal-Bold',
        flex: 1,
        textAlign: 'right',
    },
    sectionIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    virtueCard: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        gap: 14,
    },
    virtueNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    virtueNumberText: {
        fontSize: 16,
        fontFamily: 'Tajawal-Bold',
    },
    virtueText: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Tajawal-Medium',
        textAlign: 'right',
        lineHeight: 24,
    },
    hadithCard: {
        borderRadius: 24,
        padding: 28,
        marginBottom: 16,
        borderWidth: 1,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    quoteMarkContainer: {
        marginBottom: 8,
    },
    quoteMark: {
        fontSize: 60,
        fontFamily: 'Amiri-Bold',
        lineHeight: 60,
        opacity: 0.3,
    },
    hadithText: {
        fontSize: 22,
        fontFamily: 'Amiri-Bold',
        textAlign: 'center',
        lineHeight: 42,
        paddingHorizontal: 8,
    },
    hadithDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
        gap: 12,
    },
    dividerLine: {
        width: 50,
        height: 1,
    },
    dividerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    hadithSource: {
        fontSize: 14,
        fontFamily: 'Tajawal-Medium',
        textAlign: 'center',
        marginBottom: 20,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
    },
    copyButtonText: {
        fontSize: 14,
        fontFamily: 'Tajawal-Bold',
    },
    practicesCard: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
    practiceItem: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: 18,
        gap: 14,
    },
    practiceCheckbox: {
        width: 26,
        height: 26,
        borderRadius: 8,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    practiceText: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Tajawal-Medium',
        textAlign: 'right',
        lineHeight: 24,
    },
    toast: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        zIndex: 1000,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    toastText: {
        color: '#fff',
        fontFamily: 'Tajawal-Bold',
        fontSize: 15,
    },
});
