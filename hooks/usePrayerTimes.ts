import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { getPrayerTimes, getNextPrayer } from '@/utils/prayerTimes';
import { Prayer } from 'adhan';
import { storage, KEYS } from '@/utils/storage';

export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'none';

interface NextPrayerInfo {
    prayer: typeof Prayer[keyof typeof Prayer];
    time: Date;
    name: string;
    nameAr: string;
}

interface UsePrayerTimesReturn {
    prayerTimes: any | null;
    nextPrayer: NextPrayerInfo | null;
    currentPrayer: PrayerName;
    timeRemaining: string;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

const PRAYER_NAMES_AR: Record<string, string> = {
    [Prayer.Fajr]: 'الفجر',
    [Prayer.Sunrise]: 'الشروق',
    [Prayer.Dhuhr]: 'الظهر',
    [Prayer.Asr]: 'العصر',
    [Prayer.Maghrib]: 'المغرب',
    [Prayer.Isha]: 'العشاء',
    [Prayer.None]: 'الفجر',
};

const PRAYER_NAMES_EN: Record<string, PrayerName> = {
    [Prayer.Fajr]: 'fajr',
    [Prayer.Sunrise]: 'sunrise',
    [Prayer.Dhuhr]: 'dhuhr',
    [Prayer.Asr]: 'asr',
    [Prayer.Maghrib]: 'maghrib',
    [Prayer.Isha]: 'isha',
    [Prayer.None]: 'none',
};

/**
 * Determines the CURRENT prayer period based on what the NEXT prayer is.
 * If next is Dhuhr, we are currently in Fajr/Sunrise period.
 */
function getCurrentPrayerFromNext(nextPrayer: typeof Prayer[keyof typeof Prayer]): PrayerName {
    switch (nextPrayer) {
        case Prayer.Sunrise: return 'fajr';
        case Prayer.Dhuhr: return 'sunrise'; // or could show dhuhr image
        case Prayer.Asr: return 'dhuhr';
        case Prayer.Maghrib: return 'asr';
        case Prayer.Isha: return 'maghrib';
        case Prayer.Fajr: return 'isha';
        default: return 'fajr';
    }
}

export function usePrayerTimes(): UsePrayerTimesReturn {
    const [prayerTimes, setPrayerTimes] = useState<any | null>(null);
    const [nextPrayer, setNextPrayer] = useState<NextPrayerInfo | null>(null);
    const [currentPrayer, setCurrentPrayer] = useState<PrayerName>('fajr');
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPrayerTimes = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setError('يرجى السماح بالوصول إلى الموقع');
                setIsLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});

            // Cache location
            storage.set(KEYS.LOCATION, JSON.stringify({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            }));

            const times = getPrayerTimes({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            setPrayerTimes(times);

            const next = getNextPrayer(times);
            const nextInfo: NextPrayerInfo = {
                prayer: next.prayer,
                time: next.time,
                name: PRAYER_NAMES_EN[next.prayer] || 'fajr',
                nameAr: PRAYER_NAMES_AR[next.prayer] || 'الفجر',
            };

            setNextPrayer(nextInfo);
            setCurrentPrayer(getCurrentPrayerFromNext(next.prayer));
            setIsLoading(false);
        } catch (err) {
            setError('حدث خطأ في تحميل أوقات الصلاة');
            setIsLoading(false);
        }
    }, []);

    // Update countdown every second
    useEffect(() => {
        if (!nextPrayer) return;

        const updateCountdown = () => {
            const now = new Date();
            const diff = nextPrayer.time.getTime() - now.getTime();

            if (diff <= 0) {
                // Time to refresh prayer times
                fetchPrayerTimes();
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeRemaining(
                `-${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [nextPrayer, fetchPrayerTimes]);

    // Initial fetch
    useEffect(() => {
        fetchPrayerTimes();
    }, [fetchPrayerTimes]);

    return {
        prayerTimes,
        nextPrayer,
        currentPrayer,
        timeRemaining,
        isLoading,
        error,
        refresh: fetchPrayerTimes,
    };
}
