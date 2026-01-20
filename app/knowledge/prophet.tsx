import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import prophetsData from '../../assets/data/prophets_stories.json';
import { useTheme } from '@/hooks/useThemeColor';
import { Header } from '@/components/Header';

export default function ProphetDetailScreen() {
    const { id } = useLocalSearchParams();
    const theme = useTheme();
    const prophet = prophetsData.find(p => p.id === id);

    if (!prophet) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <Header title="Not Found" />
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: theme.textSecondary }]}>Prophet story not found</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title={prophet.name} />
            <ScrollView contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.cardBackground, shadowColor: theme.text }]}>
                    <Text style={[styles.arabicName, { color: theme.primary }]}>{prophet.arabicName}</Text>
                    <Text style={[styles.name, { color: theme.text }]}>{prophet.name}</Text>
                    <Text style={[styles.title, { color: theme.textSecondary }]}>{prophet.title}</Text>
                </View>

                {/* Summary */}
                <View style={[styles.section, { backgroundColor: theme.cardBackground, shadowColor: theme.text }]}>
                    <Text style={[styles.sectionTitle, { color: theme.primary }]}>Summary</Text>
                    <Text style={[styles.text, { color: theme.text }]}>{prophet.summary}</Text>
                </View>

                {/* Story Content */}
                <View style={[styles.section, { backgroundColor: theme.cardBackground, shadowColor: theme.text }]}>
                    <Text style={[styles.sectionTitle, { color: theme.primary }]}>The Story</Text>
                    <Text style={[styles.text, { color: theme.text }]}>{prophet.content}</Text>
                </View>

                {/* Lessons */}
                <View style={[styles.section, { backgroundColor: theme.cardBackground, shadowColor: theme.text }]}>
                    <Text style={[styles.sectionTitle, { color: theme.primary }]}>Lessons We Learn</Text>
                    {prophet.lessons.map((lesson, index) => (
                        <View key={index} style={styles.lessonItem}>
                            <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
                            <Text style={[styles.lessonText, { color: theme.text }]}>{lesson}</Text>
                        </View>
                    ))}
                </View>

                {/* Quranic References */}
                <View style={[styles.section, { backgroundColor: theme.cardBackground, shadowColor: theme.text }]}>
                    <Text style={[styles.sectionTitle, { color: theme.primary }]}>Quranic References</Text>
                    {prophet.references.map((ref, index) => (
                        <Text key={index} style={[styles.reference, { color: theme.textSecondary }]}>
                            📖 {ref}
                        </Text>
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
    arabicName: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontStyle: 'italic',
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
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    text: {
        fontSize: 16,
        lineHeight: 26,
        textAlign: 'justify',
    },
    lessonItem: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    bullet: {
        fontSize: 16,
        marginRight: 8,
        fontWeight: 'bold',
    },
    lessonText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
    },
    reference: {
        fontSize: 14,
        marginBottom: 6,
        paddingLeft: 8,
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
