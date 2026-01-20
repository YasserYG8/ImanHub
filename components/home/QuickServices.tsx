import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Define strict types for Ionicons and Routes to satisfy TS
type IconName = keyof typeof Ionicons.glyphMap;

interface ServiceItem {
    id: string;
    label: string;
    icon: IconName;
    route: string;
    colors: readonly [string, string, ...string[]];
}

const SERVICES: ServiceItem[] = [
    {
        id: 'qibla',
        label: 'القبلة',
        icon: 'compass',
        route: '/qibla',
        colors: ['#8B5CF6', '#6D28D9']
    },
    {
        id: 'morning',
        label: 'أذكار الصباح',
        icon: 'sunny',
        route: '/athkar/counter/morning',
        colors: ['#F59E0B', '#D97706']
    },
    {
        id: 'evening',
        label: 'أذكار المساء',
        icon: 'moon',
        route: '/athkar/counter/evening',
        colors: ['#3B82F6', '#1D4ED8']
    },
    {
        id: 'sleep',
        label: 'أذكار النوم',
        icon: 'bed',
        route: '/athkar/counter/sleep',
        colors: ['#1E293B', '#0F172A']
    },
    {
        id: 'duaa',
        label: 'أدعية',
        icon: 'heart',
        route: '/duaa',
        colors: ['#10B981', '#059669']
    },
    {
        id: 'stories',
        label: 'قصص الأنبياء',
        icon: 'book',
        route: '/knowledge/prophet',
        colors: ['#EC4899', '#DB2777']
    },
    {
        id: 'sunnah',
        label: 'السنن',
        icon: 'leaf',
        route: '/knowledge/sunnah',
        colors: ['#6366F1', '#4F46E5']
    },
    {
        id: 'mosques',
        label: 'أقرب مسجد',
        icon: 'navigate',
        route: '/mosques',
        colors: ['#22C55E', '#16A34A']
    }
];

export function QuickServices() {
    const theme = useTheme();
    const router = useRouter();

    return (
        <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.container}
        >
            {/* Restored Title: Quick Services */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>خدمات سريعة</Text>

            <View style={styles.gridContainer}>
                {SERVICES.filter(s => Platform.OS !== 'web' || s.id !== 'mosques').map((service, index) => (
                    <TouchableOpacity
                        key={service.id}
                        activeOpacity={0.8}
                        onPress={() => router.push(service.route as any)}
                        style={styles.serviceItem}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: theme.cardBackground }]}>
                            <LinearGradient
                                colors={service.colors}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            />
                            <Ionicons name={service.icon} size={24} color="#FFF" />
                        </View>
                        <Text
                            style={[styles.serviceLabel, { color: theme.text }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {service.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Tajawal-Bold',
        marginBottom: 16,
        paddingHorizontal: 20,
        textAlign: 'right'
    },
    gridContainer: {
        flexDirection: 'row-reverse',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        justifyContent: 'flex-start', // Start aligning from right (row-reverse)
        gap: 12, // Gap between items
    },
    serviceItem: {
        alignItems: 'center',
        // Calculate width for 4 items per row accounting for gaps
        // 100% / 4 = 25%. Minus gap adjustment.
        // Let's rely on flex-basis or percentage.
        width: '21.5%',
        gap: 8,
        marginBottom: 8
    },
    iconContainer: {
        width: 56, // Slightly smaller to fit 4
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4
    },
    serviceLabel: {
        fontSize: 11, // Smaller font to prevent wrap
        fontFamily: 'Tajawal-Medium',
        textAlign: 'center',
        width: '100%'
    }
});
