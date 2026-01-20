import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import sunnahData from '../../assets/data/sunnah_teachings.json';
import { useTheme } from '@/hooks/useThemeColor';
import { Header } from '@/components/Header';

export default function SunnahDetailScreen() {
    const { id } = useLocalSearchParams();
    const theme = useTheme();
    const sunnah = sunnahData.find(s => s.id === id);

    if (!sunnah) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <Header title="Not Found" />
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: theme.textSecondary }]}>Sunnah teaching not found</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title={sunnah.title} />
            <ScrollView contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.cardBackground, shadowColor: theme.text }]}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
                        <Ionicons name={sunnah.icon as any || 'book'} size={40} color={theme.primary} />
                    </View>
                    <Text style={[styles.arabicTitle, { color: theme.primary }]}>{sunnah.arabicTitle}</Text>
                    <Text style={[styles.title, { color: theme.text }]}>{sunnah.title}</Text>
                    <View style={[styles.categoryBadge, { backgroundColor: theme.background }]}>
                        <Text style={[styles.categoryText, { color: theme.primary }]}>{sunnah.category}</Text>
                    </View>
                </View>

                {/* Hadith */}
                <View style={[styles.section, { backgroundColor: theme.cardBackground, shadowColor: theme.text }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="book-outline" size={20} color={theme.primary} />
                        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Hadith</Text>
                    </View>
                    <View style={[styles.hadithContainer, { backgroundColor: theme.background, borderLeftColor: theme.primary }]}>
                        <Text style={[styles.hadithText, { color: theme.text }]}>{sunnah.hadith}</Text>
                    </View>
                    <Text style={[styles.reference, { color: theme.textSecondary }]}>📚 {sunnah.reference}</Text>
                </View>

                {/* Explanation */}
                <View style={[styles.section, { backgroundColor: theme.cardBackground, shadowColor: theme.text }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="bulb-outline" size={20} color={theme.primary} />
                        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Explanation</Text>
                    </View>
                    <Text style={[styles.text, { color: theme.text }]}>{sunnah.explanation}</Text>
                </View>

                {/* Practical Tips */}
                <View style={[styles.section, { backgroundColor: theme.cardBackground, shadowColor: theme.text }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="checkmark-circle-outline" size={20} color={theme.primary} />
                        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Practical Tips</Text>
                    </View>
                    {sunnah.practical_tips.map((tip, index) => (
                        <View key={index} style={styles.tipItem}>
                            <View style={[styles.tipNumber, { backgroundColor: theme.background }]}>
                                <Text style={[styles.tipNumberText, { color: theme.primary }]}>{index + 1}</Text>
                            </View>
                            <Text style={[styles.tipText, { color: theme.text }]}>{tip}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    header: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 20,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    arabicTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    categoryBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    section: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    hadithContainer: {
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        marginBottom: 12,
    },
    hadithText: {
        fontSize: 16,
        lineHeight: 26,
        fontStyle: 'italic',
    },
    reference: {
        fontSize: 13,
        fontWeight: '500',
    },
    text: {
        fontSize: 16,
        lineHeight: 26,
        textAlign: 'justify',
    },
    tipItem: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    tipNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    tipNumberText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    tipText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 24,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 18,
    },
});
