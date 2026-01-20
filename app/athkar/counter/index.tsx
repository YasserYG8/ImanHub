import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useThemeColor';
import { Header } from '../../../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function CounterIndexScreen() {
    const router = useRouter();
    const theme = useTheme();

    const counters = [
        { id: 'tasbeeh', title: 'تسبيح', icon: 'finger-print', color: '#10B981' },
        { id: 'istighfar', title: 'استغفار', icon: 'water', color: '#3B82F6' },
        { id: 'tahlil', title: 'تهليل', icon: 'moon', color: '#8B5CF6' },
        { id: 'takbir', title: 'تكبير', icon: 'add-circle', color: '#F59E0B' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient
                colors={[theme.primary + '10', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.3 }}
            />

            <Header />
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>المسابح الإلكترونية</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>اختر نوع التسبيح</Text>
            </View>

            <FlatList
                data={counters}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item, index }) => (
                    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
                        <TouchableOpacity
                            style={[styles.card, { backgroundColor: theme.cardBackground }]}
                            activeOpacity={0.9}
                            onPress={() => router.push({
                                pathname: '/athkar/counter/[category]',
                                params: { category: item.id }
                            })}
                        >
                            <LinearGradient
                                colors={[item.color, item.color + '99']}
                                style={styles.iconBox}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name={item.icon as any} size={32} color="#FFF" />
                            </LinearGradient>

                            <View style={styles.content}>
                                <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
                                <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        opacity: 0.7,
    },
    list: {
        padding: 20,
    },
    card: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: 16,
        marginBottom: 16,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 16,
    },
    content: {
        flex: 1,
        flexDirection: 'row-reverse', // To align text and arrow
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
});
