import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { AthkarCounter } from '../../components/AthkarCounter';
import ATHKAR_DATA from '../../assets/data/athkar_data.json';
import { useTheme } from '@/hooks/useThemeColor';
import { ATHKAR_THEMES } from '@/utils/athkarThemes';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

type AthkarCategory = keyof typeof ATHKAR_DATA;

const { width } = Dimensions.get('window');

export default function AthkarCategoryScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const theme = useTheme();

    const categoryId: AthkarCategory = (typeof id === 'string' && id in ATHKAR_DATA)
        ? id as AthkarCategory
        : 'morning';

    const athkarList = ATHKAR_DATA[categoryId];
    // Fallback to default if category not found in map (though keys match id usually)
    const themeConfig = ATHKAR_THEMES[categoryId] || ATHKAR_THEMES.default;

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).springify().damping(12)}>
            <View style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: themeConfig.colors[0] }]}>
                {/* Decorative Side Bar */}
                <LinearGradient
                    colors={themeConfig.colors}
                    style={styles.cardAccent}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                />

                <View style={styles.cardContent}>
                    {/* Header: Reference/Title */}
                    <View style={styles.cardHeader}>
                        <View style={[styles.referenceTag, { backgroundColor: theme.background }]}>
                            <Text style={[styles.referenceText, { color: theme.textSecondary }]}>
                                {item.reference || "Source"}
                            </Text>
                        </View>
                        {item.summary && (
                            <Text style={[styles.summaryText, { color: themeConfig.colors[1] }]}>
                                {item.summary}
                            </Text>
                        )}
                    </View>

                    {/* Arabic Text */}
                    <Text style={[styles.arabicText, { color: theme.text }]}>
                        {item.arabic}
                    </Text>

                    {/* Translation Section */}
                    <View style={styles.translationContainer}>
                        <Text style={[styles.translationText, { color: theme.textSecondary }]}>
                            {item.translation}
                        </Text>
                    </View>

                    {/* Interactive Counter */}
                    <View style={styles.counterContainer}>
                        <AthkarCounter targetCount={item.count || 1} />
                    </View>
                </View>
            </View>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>

            {/* Expanded Premium Header */}
            <LinearGradient
                colors={themeConfig.colors}
                style={styles.headerBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>

                    <View style={styles.headerTitleContainer}>
                        <Ionicons name={themeConfig.icon} size={32} color="#FFF" style={{ opacity: 0.9 }} />
                        <Text style={styles.headerTitle}>
                            {categoryId === 'morning' ? 'أذكار الصباح' :
                                categoryId === 'evening' ? 'أذكار المساء' :
                                    categoryId.charAt(0).toUpperCase() + categoryId.slice(1)}
                        </Text>
                    </View>
                    <View style={{ width: 40 }} /> {/* Spacer */}
                </View>

                {/* Decorative Circles */}
                <View style={[styles.headerCircle, { top: -20, right: -20, opacity: 0.2 }]} />
                <View style={[styles.headerCircle, { bottom: -40, left: 10, opacity: 0.1, width: 100, height: 100 }]} />
            </LinearGradient>

            <FlatList
                data={athkarList}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerBackground: {
        width: '100%',
        paddingTop: 50, // Safe Area approx
        paddingBottom: 30,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        overflow: 'hidden'
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20
    },
    headerTitleContainer: {
        alignItems: 'center',
        gap: 8
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: 'Amiri-Bold',
        color: '#FFF',
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerCircle: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#FFF'
    },
    list: {
        padding: 20,
        paddingTop: 10
    },
    card: {
        borderRadius: 24,
        marginBottom: 24,
        overflow: 'hidden',
        flexDirection: 'row-reverse',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)'
    },
    cardAccent: {
        width: 6,
        height: '100%'
    },
    cardContent: {
        flex: 1,
        padding: 24,
        alignItems: 'center'
    },
    cardHeader: {
        width: '100%',
        flexDirection: 'row-reverse', // Align Arabic Right
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    referenceTag: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    referenceText: {
        fontSize: 12,
        fontWeight: '600',
        fontStyle: 'italic'
    },
    summaryText: {
        fontSize: 14,
        fontWeight: '700',
        fontFamily: 'Amiri-Bold',
    },
    arabicText: {
        fontSize: 26,
        fontFamily: 'Amiri-Regular',
        textAlign: 'center', // Center align for Quranic text generally looks best in cards
        lineHeight: 48,
        marginBottom: 16
    },
    translationContainer: {
        width: '100%',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        marginBottom: 16
    },
    translationText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.9
    },
    counterContainer: {
        width: '100%',
        alignItems: 'center',
        marginTop: 8
    }
});
