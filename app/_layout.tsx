import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { ThemeProvider, useThemeContext } from '@/context/ThemeContext';
import { useTheme } from '@/hooks/useThemeColor';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Prevent the splash screen from auto-hiding before asset loading is complete.

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const { theme, isDark } = useThemeContext();
    const Colors = useTheme(); // Get the color palette for current theme

    // Create a custom Navigation Theme based on our active theme colors
    const AppNavigationTheme = {
        dark: isDark,
        colors: {
            primary: Colors.primary,
            background: Colors.background,
            card: Colors.cardBackground,
            text: Colors.text,
            border: Colors.border,
            notification: Colors.error,
        },
        fonts: DefaultTheme.fonts, // Required property
    };

    return (
        <NavThemeProvider value={AppNavigationTheme}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="quran/[id]" />
                <Stack.Screen name="athkar/[id]" />
                <Stack.Screen name="athkar/counter/[category]" />
                <Stack.Screen name="chatbot/index" />
                <Stack.Screen name="duaa/index" />
                <Stack.Screen name="duaa/[id]" />
                <Stack.Screen name="knowledge/index" />
                <Stack.Screen name="knowledge/[id]" />
                <Stack.Screen name="+not-found" />
            </Stack>
        </NavThemeProvider>
    );
}

export default function RootLayout() {
    const [loaded] = useFonts({
        'Amiri-Regular': require('../assets/fonts/Amiri-Regular.ttf'),
        'Amiri-Bold': require('../assets/fonts/Amiri-Bold.ttf'),
    });

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider>
                <RootLayoutNav />
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}
