
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScalePressable } from '@/components/ui/ScalePressable';

export default function MenuScreen() {
    const router = useRouter();
    const theme = useTheme();

    const menuItems = [
        { title: 'القبلة', route: '/qibla', icon: 'navigate', color: '#10B981', gradient: ['#10B981', '#059669'] },
        { title: 'المسابح', route: '/athkar/counter', icon: 'finger-print', color: '#14B8A6', gradient: ['#14B8A6', '#0F766E'] },
        { title: 'المعرفة', route: '/knowledge', icon: 'library', color: '#6366f1', gradient: ['#6366f1', '#4f46e5'] },
        { title: 'أدعية', route: '/duaa', icon: 'heart', color: '#EC4899', gradient: ['#EC4899', '#BE185D'] },
        { title: 'المساعد الذكي', route: '/chatbot', icon: 'chatbubbles', color: '#3B82F6', gradient: ['#3B82F6', '#2563EB'] },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>القائمة</Text>
            </View>

            <ScrollView contentContainerStyle={styles.gridContainer}>
                {menuItems.map((item, index) => (
                    <Animated.View
                        key={index}
                        entering={FadeInDown.delay(index * 50).springify()}
                        style={styles.gridItem}
                    >
                        <ScalePressable
                            onPress={() => {
                                router.push(item.route as any);
                            }}
                            style={[styles.menuCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                        >
                            <LinearGradient
                                colors={item.gradient as any}
                                style={styles.iconContainer}
                            >
                                <Ionicons name={item.icon as any} size={28} color="#FFF" />
                            </LinearGradient>
                            <Text style={[styles.menuTitle, { color: theme.text }]}>{item.title}</Text>
                        </ScalePressable>
                    </Animated.View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    header: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '800',
        textAlign: 'right',
    },
    gridContainer: {
        flexDirection: 'row-reverse',
        flexWrap: 'wrap',
        padding: 20,
        gap: 16,
    },
    gridItem: {
        width: '47%',
    },
    menuCard: {
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        height: 140,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '700',
    }
});
