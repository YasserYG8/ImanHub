import { Ionicons } from '@expo/vector-icons';

export const ATHKAR_THEMES: Record<string, { colors: readonly [string, string, ...string[]]; icon: keyof typeof Ionicons.glyphMap; patternOpacity: number }> = {
    morning: {
        colors: ['#FF9966', '#FF5E62'], // Sunrise Orange/Red
        icon: 'sunny',
        patternOpacity: 0.1
    },
    evening: {
        colors: ['#2C3E50', '#4CA1AF'], // Dusk Blue/Teal
        icon: 'moon',
        patternOpacity: 0.15
    },
    prayer: {
        colors: ['#11998e', '#38ef7d'], // Green
        icon: 'book',
        patternOpacity: 0.1
    },
    sleep: {
        colors: ['#0f2027', '#203a43', '#2c5364'], // Deep Night
        icon: 'bed',
        patternOpacity: 0.1
    },
    wake_up: {
        colors: ['#F2994A', '#F2C94C'], // Sun Yellow
        icon: 'sunny-outline',
        patternOpacity: 0.1
    },
    default: {
        colors: ['#4568DC', '#B06AB3'], // Purple/Blue generic
        icon: 'list',
        patternOpacity: 0.1
    }
};
