import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useThemeColor';
import { useThemeContext } from '@/context/ThemeContext';
import moment from 'moment';

interface NextPrayerCardProps {
    prayerName: string;
    prayerTime: Date | null;
    timeRemaining: string;
}

export function NextPrayerCard({ prayerName, prayerTime, timeRemaining }: NextPrayerCardProps) {
    const theme = useTheme();
    const { isDark } = useThemeContext();

    const formattedTime = prayerTime
        ? moment(prayerTime).format('h:mm A')
        : '--:--';

    return (
        <Animated.View
            entering={FadeInUp.delay(200).springify()}
            style={styles.container}
        >
            <BlurView
                intensity={isDark ? 40 : 60}
                tint={isDark ? 'dark' : 'light'}
                style={styles.blurContainer}
            >
                <View style={styles.content}>
                    {/* Prayer Info */}
                    <View style={styles.prayerInfo}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                            <Ionicons name="time-outline" size={20} color="#10B981" />
                        </View>
                        <View style={styles.textContent}>
                            <Text style={styles.label}>الصلاة القادمة</Text>
                            <Text style={[styles.prayerName, { color: isDark ? '#FFF' : theme.text }]}>
                                {prayerName}
                            </Text>
                        </View>
                    </View>

                    {/* Time & Countdown */}
                    <View style={styles.timeInfo}>
                        <Text style={[styles.prayerTime, { color: isDark ? '#FFF' : theme.text }]}>
                            {formattedTime}
                        </Text>
                        <Text style={styles.countdown}>{timeRemaining}</Text>
                    </View>
                </View>
            </BlurView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 2,
        marginBottom: 8,
    },
    blurContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    content: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    prayerInfo: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContent: {
        alignItems: 'flex-end',
    },
    label: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontFamily: 'Tajawal-Medium',
        marginBottom: 2,
    },
    prayerName: {
        fontSize: 32,
        fontFamily: 'Tajawal-Bold',
    },
    timeInfo: {
        alignItems: 'flex-start',
    },
    prayerTime: {
        fontSize: 32,
        fontFamily: 'Tajawal-Bold',
    },
    countdown: {
        color: '#4ADE80',
        marginTop: 2,
        fontSize: 16,
        fontFamily: 'Tajawal-Medium',
        fontVariant: ['tabular-nums'],
    },
});
