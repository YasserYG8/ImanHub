import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useThemeColor';
import { Header } from '../../components/Header';
import categories from '../../assets/data/duaa_categories.json';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function DuaaCategoriesScreen() {
    const router = useRouter();
    const theme = useTheme();

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push({
                    pathname: '/duaa/[category]',
                    params: { category: item.id }
                })}
            >
                <View style={[styles.cardContainer, {
                    backgroundColor: theme.cardBackground,
                    shadowColor: theme.text
                }]}>
                    {/* Background Gradient Opacity */}
                    <LinearGradient
                        colors={[item.color, 'transparent']}
                        start={{ x: 1, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.bgGradient}
                    />

                    <View style={styles.cardContent}>
                        <View style={styles.iconWrapper}>
                            <LinearGradient
                                colors={[item.color, item.color + '99']}
                                style={styles.iconBg}
                            >
                                <Ionicons name={item.icon as any} size={28} color="#fff" />
                            </LinearGradient>
                        </View>

                        <View style={styles.textWrapper}>
                            <Text style={[styles.arabicTitle, { color: theme.text }]}>{item.arabicTitle}</Text>
                            <Text style={[styles.title, { color: theme.textSecondary }]}>{item.title}</Text>
                        </View>

                        <View style={[styles.arrowContainer, { backgroundColor: theme.background }]}>
                            <Ionicons name="chevron-back" size={20} color={item.color} />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header />
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>الأدعية</Text>
                <View style={[styles.badge, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <Text style={[styles.badgeText, { color: '#10B981' }]}>مجموعة من الأذكار والأدعية</Text>
                </View>
            </View>
            <FlatList
                data={categories}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 24,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 12,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    list: {
        padding: 20,
        paddingTop: 8,
    },
    cardContainer: {
        borderRadius: 24,
        marginBottom: 16,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        height: 110, // Slightly taller for richer info
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    bgGradient: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 120,
        height: 120,
        opacity: 0.15,
        borderBottomLeftRadius: 100,
    },
    cardContent: {
        flex: 1,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 16,
    },
    iconWrapper: {
        width: 60,
        height: 60,
    },
    iconBg: {
        width: '100%',
        height: '100%',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    textWrapper: {
        flex: 1,
        alignItems: 'flex-end',
        gap: 6,
    },
    arabicTitle: {
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'right',
    },
    title: {
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'right',
        opacity: 0.8,
    },
    arrowContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
