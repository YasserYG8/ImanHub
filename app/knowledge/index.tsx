import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import prophetsData from '../../assets/data/prophets_stories.json';
import sunnahData from '../../assets/data/sunnah_teachings.json';
import { useTheme } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { Header } from '../../components/Header';

type Tab = 'prophets' | 'sunnah';
const { width } = Dimensions.get('window');

export default function KnowledgeScreen() {
    const [activeTab, setActiveTab] = useState<Tab>('prophets');
    const router = useRouter();
    const theme = useTheme();

    const renderProphetItem = ({ item, index }: { item: any, index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()} layout={Layout.springify()}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push({
                    pathname: '/knowledge/prophet',
                    params: { id: item.id }
                })}
            >
                <View style={[styles.cardContainer, {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border // Fixed border color
                }]}>
                    <LinearGradient
                        colors={['rgba(99, 102, 241, 0.1)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardGradient}
                    />

                    <View style={styles.cardContent}>
                        <View style={styles.iconColumn}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                                <Ionicons name="people" size={24} color="#6366f1" />
                            </View>
                            <View style={[styles.connector, { backgroundColor: theme.border }]} />
                        </View>

                        <View style={styles.textContent}>
                            <View style={styles.rowHeader}>
                                <Text style={[styles.arabicName, { color: theme.primary }]}>{item.arabicName}</Text>
                                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} style={{ opacity: 0.5 }} />
                            </View>
                            <Text style={[styles.prophetName, { color: theme.text }]}>{item.name}</Text>
                            <Text style={[styles.summary, { color: theme.textSecondary }]} numberOfLines={2}>{item.summary}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderSunnahItem = ({ item, index }: { item: any, index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()} layout={Layout.springify()}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push({
                    pathname: '/knowledge/sunnah',
                    params: { id: item.id }
                })}
            >
                <View style={[styles.cardContainer, {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border // Fixed border color
                }]}>
                    <LinearGradient
                        colors={['rgba(16, 185, 129, 0.1)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardGradient}
                    />
                    <View style={styles.cardContent}>
                        <View style={styles.iconColumn}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <Ionicons name={item.icon as any || 'book'} size={24} color="#10B981" />
                            </View>
                            <View style={[styles.connector, { backgroundColor: theme.border }]} />
                        </View>

                        <View style={styles.textContent}>
                            <View style={styles.rowHeader}>
                                <Text style={[styles.sunnahCategory, { color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>{item.category}</Text>
                                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} style={{ opacity: 0.5 }} />
                            </View>
                            <Text style={[styles.sunnahTitle, { color: theme.text }]}>{item.title}</Text>
                            <Text style={[styles.arabicTitle, { color: theme.textSecondary }]}>{item.arabicTitle}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient
                colors={[theme.primary + '20', theme.background]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.3 }}
            />

            <Header />

            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>المعرفة الإسلامية</Text>
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>قصص الأنبياء وسنن المصطفى</Text>
            </View>

            {/* Custom Tab Switcher */}
            <View style={styles.tabWrapper}>
                <View style={[styles.tabContainer, { backgroundColor: theme.cardBackground }]}>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === 'prophets' && { backgroundColor: theme.background, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }
                        ]}
                        onPress={() => setActiveTab('prophets')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'prophets' ? theme.primary : theme.textSecondary }]}>قصص الأنبياء</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === 'sunnah' && { backgroundColor: theme.background, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }
                        ]}
                        onPress={() => setActiveTab('sunnah')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'sunnah' ? theme.primary : theme.textSecondary }]}>السنن</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            {activeTab === 'prophets' ? (
                <FlatList
                    data={prophetsData}
                    renderItem={renderProphetItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <FlatList
                    data={sunnahData}
                    renderItem={renderSunnahItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        alignItems: 'center',
    },
    headerTitle: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
    headerSubtitle: { fontSize: 14, fontWeight: '500', opacity: 0.7 },

    tabWrapper: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 16,
        height: 50,
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
    },

    list: { padding: 20, paddingTop: 8 },
    cardContainer: {
        borderRadius: 20,
        marginBottom: 16,
        padding: 0,
        overflow: 'hidden',
        borderWidth: 1, // Ensure border width is set
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardGradient: {
        position: 'absolute',
        left: 0, right: 0, top: 0, bottom: 0,
    },
    cardContent: {
        flexDirection: 'row',
        padding: 16,
    },
    iconColumn: {
        alignItems: 'center',
        marginRight: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    connector: {
        width: 2,
        flex: 1,
        borderRadius: 1,
        opacity: 0.5,
    },
    textContent: {
        flex: 1,
        justifyContent: 'center',
    },
    rowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    arabicName: {
        fontSize: 14,
        fontWeight: '700',
        opacity: 0.9,
    },
    prophetName: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 6,
    },
    summary: {
        fontSize: 13,
        lineHeight: 20,
        opacity: 0.7,
    },
    sunnahCategory: {
        fontSize: 10,
        fontWeight: '700',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
    },
    sunnahTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    arabicTitle: {
        fontSize: 13,
        opacity: 0.6,
    },
});
