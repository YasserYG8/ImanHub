import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
    useAnimatedStyle,
    interpolate,
    Extrapolate,
    SharedValue,
    withTiming
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useThemeColor';
import { useThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { HERO_HEIGHT } from './HeroSection';

import moment from 'moment';

interface HomeStickyHeaderProps {
    scrollY: SharedValue<number>;
    hijriDate: string;
    gregorianDate: string;
    nextPrayerName: string;
    nextPrayerTime: Date | string;
    timeRemaining: string;
}

export function HomeStickyHeader({
    scrollY,
    hijriDate,
    gregorianDate,
    nextPrayerName,
    nextPrayerTime,
    timeRemaining
}: HomeStickyHeaderProps) {
    const theme = useTheme();
    const { isDark } = useThemeContext();

    const formattedTime = nextPrayerTime instanceof Date
        ? moment(nextPrayerTime).format('h:mm A')
        : nextPrayerTime;

    const animatedStyle = useAnimatedStyle(() => {
        // Start appearing when scrolled passed 200px (Hero fading out)
        // Fully visible by 280px
        const opacity = interpolate(
            scrollY.value,
            [200, 280],
            [0, 1],
            Extrapolate.CLAMP
        );

        // Slide down from top (-100) to 0
        const translateY = interpolate(
            scrollY.value,
            [200, 280],
            [-120, 0], // Start fully off-screen
            Extrapolate.CLAMP
        );

        return {
            opacity,
            transform: [{ translateY }],
        };
    });

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <BlurView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.blurContent, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)' }]}
            >
                <View style={[styles.contentWrapper, { borderBottomColor: theme.border }]}>

                    {/* Top Row: Dates */}
                    <View style={styles.dateRow}>
                        <Text style={[styles.dateText, { color: theme.text }]}>{hijriDate}</Text>
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                        <Text style={[styles.dateText, { color: theme.text }]}>{gregorianDate}</Text>
                    </View>

                    {/* Bottom Row: Prayer Info */}
                    <View style={styles.prayerRow}>
                        <View style={styles.prayerInfo}>
                            <Text style={[styles.prayerLabel, { color: theme.textSecondary }]}>الصلاة القادمة:</Text>
                            <Text style={[styles.prayerName, { color: theme.primary }]}>{nextPrayerName}</Text>
                            <Text style={[styles.prayerTime, { color: theme.text }]}>{formattedTime}</Text>
                        </View>

                        <View style={[styles.countdownBadge, { backgroundColor: theme.primary + '20' }]}>
                            <Ionicons name="time-outline" size={14} color={theme.primary} />
                            <Text style={[styles.countdownText, { color: theme.primary }]}>{timeRemaining}</Text>
                        </View>
                    </View>

                </View>
            </BlurView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        elevation: 5,
    },
    blurContent: {
        width: '100%',
        paddingTop: Platform.OS === 'ios' ? 48 : 36, // Safe area compensation
    },
    contentWrapper: {
        paddingHorizontal: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        gap: 8
    },
    dateRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12
    },
    divider: {
        width: 1,
        height: 12,
        opacity: 0.5
    },
    dateText: {
        fontSize: 14,
        fontFamily: 'Tajawal-Medium',
    },
    prayerRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    prayerInfo: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6
    },
    prayerLabel: {
        fontSize: 14,
        fontFamily: 'Tajawal-Regular',
    },
    prayerName: {
        fontSize: 14,
        fontFamily: 'Tajawal-Bold',
    },
    prayerTime: {
        fontSize: 14,
        fontFamily: 'Tajawal-Medium',
    },
    countdownBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countdownText: {
        fontSize: 12,
        fontFamily: 'Tajawal-Bold',
        fontVariant: ['tabular-nums']
    }
});
