import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { storage, KEYS } from '@/utils/storage';
import { getPrayerTimes, getNextPrayer } from '@/utils/prayerTimes';
import { Prayer } from 'adhan';


// Simplified types
type ThemeType = 'light' | 'dark' | 'system';
export type AppTheme = 'light' | 'dark';

interface ThemeContextType {
    theme: AppTheme; // The actual active visual theme
    themeMode: ThemeType; // The user preference
    setThemeMode: (mode: ThemeType) => void;
    isDark: boolean;
    currentGradient: string[];
    refreshPrayerTheme: () => void;
}

const PRAYER_GRADIENTS = {
    [Prayer.Fajr]: ['#2C3E50', '#FD746C'], // Dark Blue -> Pink (Sunrise)
    [Prayer.Sunrise]: ['#2C3E50', '#FD746C'], // Keep Fajr vibe or lighter
    [Prayer.Dhuhr]: ['#4FACFE', '#00F2FE'], // Blue -> Light Blue (Noon) - Adjusted to be brighter
    [Prayer.Asr]: ['#43C6AC', '#F8FFAE'], // Teal -> Soft Orange/Yellow
    [Prayer.Maghrib]: ['#f12711', '#f5af19'], // Red/Orange -> Yellow (Sunset)
    [Prayer.Isha]: ['#0F2027', '#203A43', '#2C5364'], // Dark Night
    [Prayer.None]: ['#0F2027', '#203A43', '#2C5364'], // Default Night
};

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    themeMode: 'system',
    setThemeMode: () => { },
    isDark: false,
    currentGradient: ['#0F2027', '#203A43', '#2C5364'],
    refreshPrayerTheme: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [themeMode, setThemeModeState] = useState<ThemeType>('system');
    const [activeTheme, setActiveTheme] = useState<AppTheme>('light');
    const [currentGradient, setCurrentGradient] = useState<string[]>(PRAYER_GRADIENTS[Prayer.None]);
    const systemColorScheme = useColorScheme();

    const updatePrayerTheme = async () => {
        try {
            const savedLocation = await storage.getString(KEYS.LOCATION);
            if (savedLocation) {
                const { latitude, longitude } = JSON.parse(savedLocation);
                const date = new Date();
                const times = getPrayerTimes({ latitude, longitude }, date);

                // Determine current prayer
                const current = times.currentPrayer();
                // adhan returns 'None' if after Isha, so we default to Isha/Night gradient
                let gradient = PRAYER_GRADIENTS[current] || PRAYER_GRADIENTS[Prayer.Isha];

                // Special check: If current is 'None' (after Isha before midnight/Fajr usually), use Isha
                if (current === Prayer.None) {
                    gradient = PRAYER_GRADIENTS[Prayer.Isha];
                }

                setCurrentGradient(gradient);
            }
        } catch (e) {
            console.log('Error updating prayer theme:', e);
        }
    };

    // 1. Load Preference
    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await storage.getString(KEYS.THEME);
            if (savedTheme) {
                setThemeModeState(savedTheme as ThemeType);
            }
            // Trigger initial prayer theme calculation
            updatePrayerTheme();
        };
        loadTheme();
    }, []);

    // Update gradient every minute to stay accurate
    useEffect(() => {
        const interval = setInterval(updatePrayerTheme, 60000);
        return () => clearInterval(interval);
    }, []);

    // 2. Save Preference
    const setThemeMode = (newMode: ThemeType) => {
        setThemeModeState(newMode);
        storage.set(KEYS.THEME, newMode);
    };

    // 3. Resolve Active Theme
    useEffect(() => {
        const resolveTheme = () => {
            if (themeMode === 'light') {
                setActiveTheme('light');
            } else if (themeMode === 'dark') {
                setActiveTheme('dark');
            } else {
                // System
                setActiveTheme(systemColorScheme === 'dark' ? 'dark' : 'light');
            }
        };

        resolveTheme();
    }, [themeMode, systemColorScheme]);

    // All prayer themes are now dark
    const isDark = activeTheme === 'dark';

    return (
        <ThemeContext.Provider value={{
            theme: activeTheme,
            themeMode,
            setThemeMode,
            isDark,
            currentGradient,
            refreshPrayerTheme: updatePrayerTheme
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useThemeContext = () => useContext(ThemeContext);
