import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
    THEME: 'theme',
    LOCATION: 'location',
    NOTIFICATIONS: 'notifications',
    CALCULATION_METHOD: 'calculation_method',
    LAST_READ: 'quran_last_read',
    BOOKMARKS: 'quran_bookmarks',
    ATHKAR_COUNTS: 'athkar_counts',         // { [category]: { [itemId]: count } }
    ATHKAR_LAST_INDEX: 'athkar_last_index', // { [category]: number }
};

// Storage wrapper that mimics MMKV API but uses AsyncStorage
export const storage = {
    set: async (key: string, value: string | number | boolean) => {
        try {
            await AsyncStorage.setItem(key, String(value));
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    },

    getString: async (key: string): Promise<string | undefined> => {
        try {
            const value = await AsyncStorage.getItem(key);
            return value ?? undefined;
        } catch (error) {
            console.error('Error reading from storage:', error);
            return undefined;
        }
    },

    getNumber: async (key: string): Promise<number | undefined> => {
        try {
            const value = await AsyncStorage.getItem(key);
            return value ? Number(value) : undefined;
        } catch (error) {
            console.error('Error reading from storage:', error);
            return undefined;
        }
    },

    getBoolean: async (key: string): Promise<boolean | undefined> => {
        try {
            const value = await AsyncStorage.getItem(key);
            return value ? value === 'true' : undefined;
        } catch (error) {
            console.error('Error reading from storage:', error);
            return undefined;
        }
    },

    delete: async (key: string) => {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('Error deleting from storage:', error);
        }
    },

    clearAll: async () => {
        try {
            await AsyncStorage.clear();
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    },
};

export const saveItem = async (key: string, value: any) => {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error saving item:', error);
    }
};

export const getItem = async <T>(key: string): Promise<T | null> => {
    try {
        const value = await AsyncStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error('Error getting item:', error);
        return null;
    }
};
