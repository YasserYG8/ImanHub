import { Colors } from '@/constants/theme';
import { useThemeContext } from '@/context/ThemeContext';

export function useThemeColor(
    props: { light?: string; dark?: string },
    colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
    const { theme, isDark } = useThemeContext();

    const overrideKey = isDark ? 'dark' : 'light';
    const colorFromProps = props[overrideKey];

    if (colorFromProps) {
        return colorFromProps;
    } else {
        return Colors[isDark ? 'dark' : 'light'][colorName];
    }
}

export function useTheme() {
    const { theme } = useThemeContext();
    return Colors[theme]; // Should be light or dark
}
