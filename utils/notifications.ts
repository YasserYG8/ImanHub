import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { storage } from './storage';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#10B981',
        });

        // Create separate channels for different notification types
        await Notifications.setNotificationChannelAsync('prayer-times', {
            name: 'Prayer Times',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            sound: 'default',
            lightColor: '#10B981',
        });

        await Notifications.setNotificationChannelAsync('athkar', {
            name: 'Athkar Reminders',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            sound: 'default',
            lightColor: '#10B981',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

/**
 * Schedule prayer time notifications
 */
export async function schedulePrayerNotifications(prayerTimes: {
    fajr: Date;
    sunrise: Date;
    dhuhr: Date;
    asr: Date;
    maghrib: Date;
    isha: Date;
}) {
    // Check if prayer notifications are enabled
    const enabled = await storage.getBoolean('prayerNotifications') ?? true;
    if (!enabled) return;

    // Cancel existing prayer notifications
    await cancelPrayerNotifications();

    const prayers = [
        { name: 'Fajr', time: prayerTimes.fajr, emoji: '🌅' },
        { name: 'Dhuhr', time: prayerTimes.dhuhr, emoji: '☀️' },
        { name: 'Asr', time: prayerTimes.asr, emoji: '🌤️' },
        { name: 'Maghrib', time: prayerTimes.maghrib, emoji: '🌆' },
        { name: 'Isha', time: prayerTimes.isha, emoji: '🌙' },
    ];

    const now = new Date();

    for (const prayer of prayers) {
        // Calculate seconds until prayer
        const diffInSeconds = Math.floor((prayer.time.getTime() - now.getTime()) / 1000);

        // Only schedule if the prayer is at least 60 seconds in the future to avoid immediate triggers
        // or edge cases with "now"
        if (diffInSeconds > 60) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `${prayer.emoji} ${prayer.name} Prayer Time`,
                    body: `It's time for ${prayer.name} prayer. May Allah accept your prayer.`,
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    categoryIdentifier: 'prayer',
                },
                trigger: {
                    seconds: diffInSeconds,
                    channelId: 'prayer-times',
                    repeats: false, // Ensure it's a one-time notification
                },
                identifier: `prayer-${prayer.name.toLowerCase()}`,
            });
        }
    }
}

/**
 * Cancel all prayer notifications
 */
export async function cancelPrayerNotifications() {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const prayerNotifications = scheduledNotifications.filter(n =>
        n.identifier.startsWith('prayer-')
    );

    for (const notification of prayerNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
}

/**
 * Schedule daily athkar reminders
 */
export async function scheduleAthkarReminders() {
    // Check if athkar reminders are enabled
    const enabled = await storage.getBoolean('athkarReminders') ?? true;
    if (!enabled) return;

    // Cancel existing athkar notifications
    await cancelAthkarReminders();

    // Morning athkar reminder (7:00 AM)
    await Notifications.scheduleNotificationAsync({
        content: {
            title: '🌅 Morning Athkar',
            body: 'Good morning! Don\'t forget to recite your morning athkar.',
            sound: 'default',
            categoryIdentifier: 'athkar',
        },
        trigger: {
            hour: 7,
            minute: 0,
            repeats: true,
            channelId: 'athkar',
        },
        identifier: 'athkar-morning',
    });

    // Evening athkar reminder (6:00 PM)
    await Notifications.scheduleNotificationAsync({
        content: {
            title: '🌆 Evening Athkar',
            body: 'Good evening! Time to recite your evening athkar.',
            sound: 'default',
            categoryIdentifier: 'athkar',
        },
        trigger: {
            hour: 18,
            minute: 0,
            repeats: true,
            channelId: 'athkar',
        },
        identifier: 'athkar-evening',
    });
}

/**
 * Cancel athkar reminders
 */
export async function cancelAthkarReminders() {
    await Notifications.cancelScheduledNotificationAsync('athkar-morning');
    await Notifications.cancelScheduledNotificationAsync('athkar-evening');
}

/**
 * Schedule Friday (Jumu'ah) reminder
 */
export async function scheduleJumuahReminder() {
    // Check if Jumu'ah reminder is enabled
    const enabled = await storage.getBoolean('jumuahReminder') ?? true;
    if (!enabled) return;

    // Cancel existing Jumu'ah notification
    await cancelJumuahReminder();

    // Friday reminder at 11:00 AM
    await Notifications.scheduleNotificationAsync({
        content: {
            title: '🕌 Jumu\'ah Prayer',
            body: 'It\'s Friday! Don\'t forget to attend Jumu\'ah prayer and recite Surah Al-Kahf.',
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
            categoryIdentifier: 'jumuah',
        },
        trigger: {
            weekday: 6, // Friday (1 = Sunday, 6 = Friday)
            hour: 11,
            minute: 0,
            repeats: true,
            channelId: 'prayer-times',
        },
        identifier: 'jumuah-reminder',
    });
}

/**
 * Cancel Jumu'ah reminder
 */
export async function cancelJumuahReminder() {
    await Notifications.cancelScheduledNotificationAsync('jumuah-reminder');
}

/**
 * Initialize all notifications based on user settings
 */
export async function initializeNotifications() {
    const hasPermission = await requestNotificationPermissions();

    if (!hasPermission) {
        console.log('Notification permissions not granted');
        return;
    }

    // Schedule athkar reminders
    await scheduleAthkarReminders();

    // Schedule Jumu'ah reminder
    await scheduleJumuahReminder();
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications (for debugging)
 */
export async function getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
}
