
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useThemeColor';
import { useThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const theme = useTheme();
  const { isDark } = useThemeContext();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 85,
          borderTopWidth: 0,
          backgroundColor: isDark ? 'rgba(23, 23, 23, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            tint={isDark ? "dark" : "light"}
            intensity={80}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Tajawal-Medium', // Assuming font family, otherwise default
          marginBottom: 5,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingTop: 10,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quran"
        options={{
          title: 'القرآن',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "book" : "book-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="prayers"
        options={{
          title: 'الصلاة',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "time" : "time-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="athkar"
        options={{
          title: 'الأذكار',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "moon" : "moon-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'المزيد',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null}} />
      <Tabs.Screen name="knowledge" options={{ href: null }} />

    </Tabs>
  );
}
