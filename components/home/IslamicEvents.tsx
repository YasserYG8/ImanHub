import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import moment from 'moment-hijri';
import { useTheme } from '@/hooks/useThemeColor';
import {
    ANNUAL_EVENTS,
    AYYAM_AL_BIDH,
    isAyyamAlBidh,
    isWeeklyFastingDay,
    getDaysUntilAyyamBidh,
    getDaysUntilHijriDate,
    IslamicEvent,
    UpcomingEvent
} from '@/utils/islamicEvents';

import { useRouter } from 'expo-router';

interface IslamicEventsProps {
    delay?: number;
}

export function IslamicEvents({ delay = 500 }: IslamicEventsProps) {
    const theme = useTheme();
    const router = useRouter();
    const [events, setEvents] = useState<UpcomingEvent[]>([]);
    const [todayReminders, setTodayReminders] = useState<string[]>([]);

    useEffect(() => {
        calculateEvents();
    }, []);

    const calculateEvents = () => {
        const m = moment();
        const hijriMonth = parseInt(m.format('iM'));
        const hijriDay = parseInt(m.format('iD'));
        const dayOfWeek = new Date().getDay();

        const reminders: string[] = [];
        const upcoming: UpcomingEvent[] = [];

        // Check today's reminders
        if (isAyyamAlBidh(hijriDay)) {
            reminders.push('اليوم من أيام البيض - صيام مستحب');
        }

        // Remind for Ayyam Al-Bidh tomorrow (if today is 12th)
        if (hijriDay === 12) {
            reminders.push('غداً أول أيام البيض - يُستحب صيامها');
        }

        if (isWeeklyFastingDay()) {
            const dayName = dayOfWeek === 1 ? 'الاثنين' : 'الخميس';
            reminders.push(`اليوم ${dayName} - صيام مستحب`);
        }

        // Remind for tomorrow (Sunday -> Monday, Wednesday -> Thursday)
        // Sunday = 0, Wednesday = 3
        if (dayOfWeek === 0) {
            reminders.push('غداً الاثنين - يُستحب صيامه');
        } else if (dayOfWeek === 3) {
            reminders.push('غداً الخميس - يُستحب صيامه');
        }

        // Calculate upcoming events
        const addedEventIds = new Set<string>(); // Track added events to avoid duplicates

        // Ayyam al-Bidh (Upcoming listing)
        const daysUntilBidh = getDaysUntilAyyamBidh(hijriDay);
        if (daysUntilBidh > 0 && daysUntilBidh <= 10) {
            upcoming.push({
                ...AYYAM_AL_BIDH,
                daysUntil: daysUntilBidh,
                hijriDate: '١٣-١٥ من الشهر الهجري',
            });
            addedEventIds.add(AYYAM_AL_BIDH.id);
        }

        // Annual events
        for (let monthOffset = 0; monthOffset <= 12; monthOffset++) {
            const checkMonth = ((hijriMonth - 1 + monthOffset) % 12) + 1;
            const monthEvents = ANNUAL_EVENTS[checkMonth];

            if (monthEvents) {
                for (const event of monthEvents) {
                    // Skip if already added
                    if (addedEventIds.has(event.id)) continue;

                    // Get target day from event description or default
                    let targetDay = 1;
                    if (event.id === 'ashura') targetDay = 10;
                    else if (event.id === 'mid-shaban') targetDay = 15;
                    else if (event.id === 'isra-miraj') targetDay = 27;
                    else if (event.id === 'arafah') targetDay = 9;
                    else if (event.id === 'eid-adha') targetDay = 10;

                    const daysUntil = getDaysUntilHijriDate(hijriMonth, hijriDay, checkMonth, targetDay);

                    if (daysUntil > 0 && daysUntil <= 60) {
                        upcoming.push({
                            ...event,
                            daysUntil,
                            hijriDate: event.description,
                        });
                        addedEventIds.add(event.id);

                        // Check if event is tomorrow
                        if (daysUntil === 1) {
                            reminders.push(`غداً ${event.nameAr} - لا تنس الاستعداد`);
                        }
                    }
                }
            }
        }

        // Sort by days until
        upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
        setEvents(upcoming.slice(0, 3)); // Show top 3
        setTodayReminders(reminders);
    };

    const getIconName = (iconName: string): keyof typeof Ionicons.glyphMap => {
        const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            'moon': 'moon',
            'star': 'star',
            'heart': 'heart',
            'flame': 'flame',
            'sun': 'sunny',
            'sparkles': 'sparkles',
            'gift': 'gift',
            'calendar': 'calendar',
            'trending-up': 'trending-up',
        };
        return iconMap[iconName] || 'calendar';
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(delay).springify()}
            style={styles.container}
        >
            <View style={styles.header}>
                <Ionicons name="calendar" size={18} color={theme.primary} />
                <Text style={[styles.title, { color: theme.text }]}>المناسبات والتذكيرات</Text>
            </View>

            {/* Today's Reminders - Premium Design */}
            {todayReminders.length > 0 && (
                <View style={styles.remindersContainer}>
                    {todayReminders.map((reminder, index) => (
                        <View key={index} style={styles.premiumReminderCard}>
                            <LinearGradient
                                colors={['#059669', '#047857']}
                                start={{ x: 1, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={styles.reminderGradient}
                            >
                                <View style={styles.reminderContent}>
                                    <View style={styles.reminderIconCircle}>
                                        <Ionicons name="notifications" size={20} color="#047857" />
                                    </View>
                                    <View style={styles.reminderTextContainer}>
                                        <Text style={styles.reminderLabel}>تذكير</Text>
                                        <Text style={styles.premiumReminderText}>
                                            {reminder}
                                        </Text>
                                    </View>
                                </View>
                            </LinearGradient>
                        </View>
                    ))}
                </View>
            )}

            {/* Upcoming Events */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.eventsScroll}
            >
                {events.map((event, index) => (
                    <TouchableOpacity
                        key={event.id + index}
                        activeOpacity={0.9}
                        onPress={() => router.push(`/events/${event.id}`)}
                        style={[styles.eventCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                    >
                        <LinearGradient
                            colors={[event.color + '20', 'transparent']}
                            style={styles.eventGradient}
                        />

                        <View style={[styles.eventIcon, { backgroundColor: event.color + '20' }]}>
                            <Ionicons
                                name={getIconName(event.icon)}
                                size={20}
                                color={event.color}
                            />
                        </View>

                        <Text style={[styles.eventName, { color: theme.text }]} numberOfLines={1}>
                            {event.nameAr}
                        </Text>

                        <View style={styles.daysContainer}>
                            <Text style={[styles.daysNumber, { color: event.color }]}>
                                {event.daysUntil}
                            </Text>
                            <Text style={[styles.daysLabel, { color: theme.textSecondary }]}>
                                يوم
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}

                {events.length === 0 && (
                    <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                        <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            لا توجد مناسبات قريبة
                        </Text>
                    </View>
                )}
            </ScrollView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
    },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 18,
        fontFamily: 'Tajawal-Bold',
    },
    remindersContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 12,
    },
    premiumReminderCard: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    reminderGradient: {
        padding: 16,
    },
    reminderContent: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12,
    },
    reminderIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    reminderTextContainer: {
        flex: 1,
        zIndex: 2,
    },
    reminderLabel: {
        fontSize: 14,
        fontFamily: 'Tajawal-Bold',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 4,
        textAlign: 'right',
    },
    premiumReminderText: {
        fontSize: 18,
        fontFamily: 'Tajawal-Bold',
        color: '#FFF',
        textAlign: 'right',
        lineHeight: 26,
    },
    eventsScroll: {
        paddingHorizontal: 20,
        gap: 12,
    },
    eventCard: {
        width: 140,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        overflow: 'hidden',
    },
    eventGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    eventIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    eventName: {
        fontSize: 13,
        fontFamily: 'Tajawal-Bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    daysContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'baseline',
        gap: 4,
    },
    daysNumber: {
        fontSize: 24,
        fontFamily: 'Tajawal-Bold',
    },
    daysLabel: {
        fontSize: 12,
        fontFamily: 'Tajawal-Regular',
    },
    emptyCard: {
        width: 200,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    emptyText: {
        fontSize: 14,
        fontFamily: 'Tajawal-Regular',
    },
});
