import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useThemeColor';
import { useThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, SlideInRight, SlideOutRight } from 'react-native-reanimated';

export default function SettingsScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { themeMode: currentTheme, setThemeMode } = useThemeContext();

    const themes = [
        { id: 'light', label: 'فاتح', icon: 'sunny' },
        { id: 'dark', label: 'داكن', icon: 'moon' },
        { id: 'system', label: 'تلقائي', icon: 'settings-outline' },
    ] as const;

    return (
        <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <StatusBar barStyle={currentTheme === 'dark' ? "light-content" : "dark-content"} />
            <LinearGradient
                colors={[theme.primary + '10', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.3 }}
                pointerEvents="none"
            />

            <Header onBack={() => router.push('/(tabs)')} />

            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>الإعدادات</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>تخصيص التطبيق</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Appearance Section */}
                <Animated.View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                            <Ionicons name="color-palette" size={20} color="#F59E0B" />
                        </View>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>المظهر</Text>
                    </View>

                    <View style={styles.themeSelector}>
                        {themes.map((item) => {
                            const isActive = currentTheme === item.id;
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.themeOption,
                                        {
                                            backgroundColor: isActive ? theme.primary : theme.background,
                                            borderColor: isActive ? theme.primary : theme.border
                                        }
                                    ]}
                                    onPress={() => setThemeMode(item.id)}
                                    activeOpacity={0.9}
                                >
                                    {isActive && (
                                        <LinearGradient
                                            colors={[theme.primary, theme.primary + 'CC']}
                                            style={StyleSheet.absoluteFill}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        />
                                    )}
                                    <Ionicons
                                        name={item.icon as any}
                                        size={24}
                                        color={isActive ? '#fff' : theme.text}
                                        style={{ marginBottom: 8 }}
                                    />
                                    <Text
                                        style={[
                                            styles.themeLabel,
                                            { color: isActive ? '#fff' : theme.text }
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>

                {/* About Section */}
                <Animated.View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                            <Ionicons name="information-circle" size={20} color="#3B82F6" />
                        </View>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>عن التطبيق</Text>
                    </View>

                    <View style={[styles.infoRow, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
                        <Text style={[styles.infoValue, { color: theme.textSecondary }]}>1.0.0</Text>
                        <Text style={[styles.infoLabel, { color: theme.text }]}>الإصدار</Text>
                    </View>

                    <View style={[styles.infoRow, { paddingTop: 16 }]}>
                        <Text style={[styles.infoValue, { color: theme.textSecondary }]}>أذكار</Text>
                        <Text style={[styles.infoLabel, { color: theme.text }]}>اسم التطبيق</Text>
                    </View>
                </Animated.View>
            </ScrollView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
        opacity: 0.7,
    },
    content: {
        padding: 20,
        paddingTop: 0,
    },
    section: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'right',
    },
    themeSelector: {
        flexDirection: 'row-reverse',
        gap: 12,
    },
    themeOption: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    themeLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 16,
    },
    infoLabel: {
        fontSize: 15,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '500',
        opacity: 0.8,
    },
});
