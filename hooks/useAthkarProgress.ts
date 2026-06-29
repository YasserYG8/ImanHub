import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import athkarData from '../assets/data/athkar_data.json';

const STORAGE_KEY_PREFIX = 'athkar_progress_';

export interface AthkarProgress {
    [categoryId: string]: {
        [itemId: string]: number; // count
    };
}

export const useAthkarProgress = () => {
    const [progress, setProgress] = useState<AthkarProgress>({});
    const [loading, setLoading] = useState(true);

    const getDailyKey = () => {
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        return `${STORAGE_KEY_PREFIX}${date}`;
    };

    const loadProgress = useCallback(async () => {
        try {
            const key = getDailyKey();
            const stored = await AsyncStorage.getItem(key);
            if (stored) {
                setProgress(JSON.parse(stored));
            } else {
                setProgress({});
            }
        } catch (error) {
            console.error('Failed to load athkar progress', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const saveProgress = async (newProgress: AthkarProgress) => {
        try {
            const key = getDailyKey();
            await AsyncStorage.setItem(key, JSON.stringify(newProgress));
            // Optional: prune old keys here?
        } catch (error) {
            console.error('Failed to save athkar progress', error);
        }
    };

    const incrementCount = async (categoryId: string, itemId: string, maxCount: number) => {
        setProgress(prev => {
            const categoryProgress = prev[categoryId] || {};
            const itemCount = categoryProgress[itemId] || 0;

            if (itemCount >= maxCount) return prev; // Already maxed

            const newCount = itemCount + 1;
            const newProgress = {
                ...prev,
                [categoryId]: {
                    ...categoryProgress,
                    [itemId]: newCount
                }
            };

            saveProgress(newProgress);
            return newProgress;
        });
    };

    const getCategoryStats = (categoryId: string) => {
        const categoryData = (athkarData as any)[categoryId] || [];
        if (!categoryData.length) return { completedItems: 0, totalItems: 0, totalReads: 0, totalTargets: 0, percentage: 0 };

        const categoryProgress = progress[categoryId] || {};
        let completedItems = 0;
        let totalReads = 0;
        let totalTargets = 0;

        categoryData.forEach((item: any) => {
            const count = categoryProgress[item.id] || 0;
            if (count >= item.count) completedItems++;
            totalReads += count;
            totalTargets += item.count;
        });

        return {
            completedItems,         // How many athkar fully done
            totalItems: categoryData.length,
            totalReads,             // Total clicks/reads
            totalTargets,           // Sum of all targets
            percentage: totalTargets > 0 ? Math.round((totalReads / totalTargets) * 100) : 0
        };
    };

    const getTotalStats = () => {
        const categories = Object.keys(athkarData);
        let globalReads = 0;
        let globalTargets = 0;

        categories.forEach(cat => {
            const stats = getCategoryStats(cat);
            globalReads += stats.totalReads;
            globalTargets += stats.totalTargets;
        });

        return {
            percentage: globalTargets > 0 ? Math.round((globalReads / globalTargets) * 100) : 0
        };
    };

    useEffect(() => {
        loadProgress();
    }, []);

    // Reload when focusing screen if needed, usually global context is better but this is a simple hook.
    // We'll export a refresh function specifically for the list screen to call on focus.

    return {
        progress,
        loading,
        incrementCount,
        getCategoryStats,
        getTotalStats,
        refresh: loadProgress
    };
};
