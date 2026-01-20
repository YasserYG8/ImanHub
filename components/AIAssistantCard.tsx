import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useThemeColor';
import { useThemeContext } from '@/context/ThemeContext';

export const AIAssistantCard = () => {
    const theme = useTheme();
    const { isDark } = useThemeContext();
    const router = useRouter();

    return (
        <View style={styles.section}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push('/chatbot')}
            >
                <LinearGradient
                    colors={isDark ? ['#1e1b4b', '#312e81'] : ['#e0e7ff', '#c7d2fe']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.aiCard, { borderColor: isDark ? '#4338ca' : '#a5b4fc' }]}
                >
                    <View style={styles.aiContent}>
                        <View style={[styles.aiBadge, { backgroundColor: isDark ? '#4338ca' : '#6366f1' }]}>
                            <Text style={styles.aiBadgeText}>جديد</Text>
                        </View>
                        <Text style={[styles.aiTitle, { color: theme.text }]}>المساعد الإسلامي الذكي</Text>
                        <Text style={[styles.aiSubtitle, { color: theme.textSecondary }]}>
                            اسأل عن أي فتوى أو معلومة دينية
                        </Text>
                    </View>
                    <View style={styles.aiIconContainer}>
                        <LinearGradient
                            colors={['#6366f1', '#4f46e5']}
                            style={styles.aiIconCircle}
                        >
                            <Ionicons name="chatbubbles" size={28} color="#FFF" />
                        </LinearGradient>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    aiCard: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
    },
    aiContent: {
        flex: 1,
        alignItems: 'flex-end',
        gap: 6,
    },
    aiBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 4,
    },
    aiBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    aiTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'right',
    },
    aiSubtitle: {
        fontSize: 13,
        textAlign: 'right',
        lineHeight: 20,
    },
    aiIconContainer: {
        marginLeft: 16,
    },
    aiIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#4f46e5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
});
