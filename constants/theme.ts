/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#1F2937', // Zinc 800 (Softer than #000)
    textSecondary: '#4B5563', // Zinc 600
    background: '#F0F2F5', // Slightly darker/warmer off-white (was #f8f9fa)
    cardBackground: '#FFFFFF',
    tint: tintColorLight,
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
    border: '#E5E7EB', // Zinc 200
    primary: '#10b981', // Emerald green
    error: '#ef4444',
  },
  dark: {
    text: '#F9FAFB', // Zinc 50
    textSecondary: '#D1D5DB', // Zinc 300
    background: '#18181b', // Zinc 900
    cardBackground: '#27272a', // Zinc 800
    tint: tintColorDark,
    tabIconDefault: '#71717a',
    tabIconSelected: tintColorDark,
    border: '#3f3f46',
    primary: '#10b981', // Emerald green
    error: '#ef4444',
  },
  // Dynamic Prayer Themes - All Dark/Premium
  fajr: { // Dawn - Cool Blue/Teal (Dark)
    text: '#E0F7FA',
    textSecondary: '#80DEEA',
    background: '#0D1B2A', // Deep Navy
    cardBackground: '#1B3A4B', // Dark Teal
    tint: '#4DD0E1', // Cyan
    tabIconDefault: '#4A6572',
    tabIconSelected: '#4DD0E1',
    border: '#1B3A4B',
    primary: '#4DD0E1', // Cyan
    error: '#EF5350',
  },
  sunrise: { // Morning - Warm Orange/Coral (Dark)
    text: '#FFF3E0',
    textSecondary: '#FFCC80',
    background: '#1A0F0A', // Dark Warm Brown
    cardBackground: '#3E2723', // Deep Brown
    tint: '#FF7043', // Deep Orange
    tabIconDefault: '#5D4037',
    tabIconSelected: '#FF7043',
    border: '#4E342E',
    primary: '#FF7043', // Coral
    error: '#EF5350',
  },
  dhuhr: { // Noon - Golden/Amber (Dark)
    text: '#FFF8E1',
    textSecondary: '#FFE082',
    background: '#1C1500', // Dark Gold
    cardBackground: '#33290A', // Deep Amber
    tint: '#FFC107', // Amber
    tabIconDefault: '#524A10',
    tabIconSelected: '#FFC107',
    border: '#3D3210',
    primary: '#FFC107', // Gold
    error: '#EF5350',
  },
  asr: { // Afternoon - Bronze/Copper (Dark)
    text: '#FFECB3',
    textSecondary: '#FFD54F',
    background: '#1A1205', // Dark Bronze
    cardBackground: '#2D2210', // Deep Bronze
    tint: '#FFB300', // Deep Amber
    tabIconDefault: '#4A3D15',
    tabIconSelected: '#FFB300',
    border: '#3D3015',
    primary: '#FFB300', // Bronze
    error: '#EF5350',
  },
  maghrib: { // Sunset - Purple/Magenta (Dark)
    text: '#F3E5F5',
    textSecondary: '#CE93D8',
    background: '#1A0A1A', // Deep Purple
    cardBackground: '#311B33', // Rich Plum
    tint: '#AB47BC', // Purple
    tabIconDefault: '#4A2C54',
    tabIconSelected: '#AB47BC',
    border: '#38223C',
    primary: '#AB47BC', // Magenta
    error: '#EF5350',
  },
  isha: { // Night - Deep Indigo/Navy (Dark)
    text: '#E8EAF6',
    textSecondary: '#9FA8DA',
    background: '#0A0A1A', // Near Black Blue
    cardBackground: '#1A1A2E', // Deep Navy
    tint: '#7C4DFF', // Deep Purple
    tabIconDefault: '#2C2C54',
    tabIconSelected: '#7C4DFF',
    border: '#1F1F3A',
    primary: '#7C4DFF', // Indigo
    error: '#EF5350',
  },
};

export default Colors;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
