
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Modal, Pressable, Alert, ImageBackground, StatusBar, Dimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import quranData from '../../assets/data/quran/quran.json';
import { useTheme } from '@/hooks/useThemeColor';
import { useThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { KEYS, getItem, saveItem } from '@/utils/storage';
import { useQuran } from '@/hooks/useQuran';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { SettingsModal } from '@/components/quran/SettingsModal';
import { getSurahFromPage } from '@/utils/quranPageMapping';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

type FilterType = 'all' | 'meccan' | 'medinan';
type SortType = 'number' | 'ayahs';

// Custom Chip Components
const FilterChip = ({ label, isSelected, activeColor, theme, isDark, onPress }: any) => {
    return (
        <TouchableOpacity
            style={[
                styles.filterChip,
                {
                    backgroundColor: isSelected 
                        ? activeColor 
                        : (isDark ? 'rgba(39, 39, 42, 0.4)' : theme.cardBackground),
                    borderColor: isSelected 
                        ? activeColor 
                        : (isDark ? 'rgba(255, 255, 255, 0.08)' : theme.border),
                    borderWidth: 1,
                }
            ]}
            onPress={onPress}
        >
            <Text style={[
                styles.filterChipText,
                { 
                    color: isSelected ? '#FFFFFF' : theme.text,
                    fontFamily: 'Amiri-Bold',
                    fontSize: 16,
                }
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};

export default function QuranScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { isDark } = useThemeContext();
    const { getSurah } = useQuran();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [sortBy, setSortBy] = useState<SortType>('number');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [lastRead, setLastRead] = useState<any>(null);
    const [bookmarks, setBookmarks] = useState<any[]>([]);
    const [ayahBookmarks, setAyahBookmarks] = useState<any[]>([]);
    const [isBookmarksModalVisible, setIsBookmarksModalVisible] = useState(false);
    const [isSettingsVisible, setSettingsVisible] = useState(false);
    const [isPageSearchVisible, setIsPageSearchVisible] = useState(false);
    const [pageSearchInput, setPageSearchInput] = useState('');
    const [useArabicNumbers, setUseArabicNumbers] = useState(true);
    const [fontScale, setFontScale] = useState(1.0);

    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                const lastReadData = await getItem(KEYS.LAST_READ);
                if (lastReadData) setLastRead(lastReadData);

                const bookmarksData = await getItem<any[]>(KEYS.BOOKMARKS);
                if (bookmarksData) setBookmarks(bookmarksData);

                const ayahBookmarksData = await getItem<any[]>('bookmarked_ayahs');
                if (ayahBookmarksData) setAyahBookmarks(ayahBookmarksData);

                const settingsData = await getItem<any>('quran_settings');
                if (settingsData) {
                    setUseArabicNumbers(settingsData.useArabicNumbers ?? true);
                    setFontScale(settingsData.fontScale ?? 1.0);
                }
            };
            loadData();
        }, [])
    );

    const handleToggleNumbers = async (val: boolean) => {
        setUseArabicNumbers(val);
        const settings = (await getItem<any>('quran_settings')) || {};
        await saveItem('quran_settings', { ...settings, useArabicNumbers: val });
    };

    const handleFontScaleChange = async (newScale: number) => {
        setFontScale(newScale);
        const settings = (await getItem<any>('quran_settings')) || {};
        await saveItem('quran_settings', { ...settings, fontScale: newScale });
    };

    const handleDeleteBookmark = async (pageToDelete: number) => {
        Alert.alert(
            "حذف العلامة",
            "هل أنت متأكد من حذف هذه العلامة المفضلة؟",
            [
                { text: "إلغاء", style: "cancel" },
                {
                    text: "حذف",
                    style: "destructive",
                    onPress: async () => {
                        const updated = bookmarks.filter(b => b.page !== pageToDelete);
                        setBookmarks(updated);
                        await saveItem(KEYS.BOOKMARKS, updated);
                    }
                }
            ]
        );
    };

    const lastReadSurah = lastRead ? getSurah(lastRead.surahId) : null;

    const filteredSurahs = useMemo(() => {
        let result = [...quranData];

        if (filterType === 'meccan') result = result.filter(s => s.type === 'meccan');
        else if (filterType === 'medinan') result = result.filter(s => s.type === 'medinan');

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(query) ||
                s.transliteration.toLowerCase().includes(query) ||
                s.id.toString().includes(query)
            );
        }

        if (sortBy === 'ayahs') {
            result.sort((a, b) => b.total_verses - a.total_verses);
        }

        if (sortOrder === 'desc') {
            result.reverse();
        }

        return result;
    }, [searchQuery, filterType, sortBy, sortOrder]);

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 50).springify()} layout={Layout.springify()}>
            <TouchableOpacity
                style={[
                    styles.card, 
                    { 
                        backgroundColor: isDark ? 'rgba(39, 39, 42, 0.5)' : theme.cardBackground,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : theme.border,
                        borderWidth: 1,
                    }
                ]}
                onPress={() => router.push({
                    pathname: '/quran/[id]',
                    params: { id: item.id }
                })}
                activeOpacity={0.7}
            >
                {/* Decorative Pattern Opacity */}
                <Ionicons
                    name="flower-outline"
                    size={80}
                    color={theme.primary}
                    style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.03, transform: [{ rotate: '45deg' }] }}
                />

                <View style={styles.numberContainer}>
                    <View style={[
                        styles.numberBadge, 
                        { 
                            borderColor: theme.primary,
                            backgroundColor: isDark ? 'rgba(0, 108, 73, 0.1)' : 'rgba(16, 185, 129, 0.05)'
                        }
                    ]}>
                        <Text style={[styles.numberText, { color: theme.primary, fontWeight: '700' }]}>{item.id}</Text>
                    </View>
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.textContainer}>
                        <Text style={[styles.arabicName, { color: theme.text }]}>{item.name}</Text>
                        <View style={styles.metaRow}>
                            <Text style={[styles.englishName, { color: theme.textSecondary }]}>{item.transliteration}</Text>
                            <View style={styles.dotSeparator} />
                            <Text style={[styles.englishName, { color: theme.textSecondary }]}>{item.total_verses} آية</Text>
                        </View>
                    </View>

                    <View style={styles.leftContainer}>
                        <View style={[styles.typeBadge, {
                            backgroundColor: item.type === 'meccan' ? 'rgba(171, 71, 188, 0.12)' : 'rgba(0, 108, 73, 0.12)',
                        }]}>
                            <Text style={[styles.typeText, {
                                color: item.type === 'meccan' ? '#AB47BC' : '#10B981'
                            }]}>
                                {item.type === 'meccan' ? 'مكية' : 'مدنية'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-back" size={20} color={theme.textSecondary} style={{ marginTop: 8, opacity: 0.5 }} />
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    const handleDeleteAyahBookmark = async (timestamp: number) => {
        Alert.alert(
            "حذف الآية المحفوظة",
            "هل أنت متأكد من حذف هذه الآية من المفضلة؟",
            [
                { text: "إلغاء", style: "cancel" },
                {
                    text: "حذف",
                    style: "destructive",
                    onPress: async () => {
                        const updated = ayahBookmarks.filter(b => b.timestamp !== timestamp);
                        setAyahBookmarks(updated);
                        await saveItem('bookmarked_ayahs', updated);
                    }
                }
            ]
        );
    };

    const EmptyList = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                لم يتم العثور على سور
            </Text>
        </View>
    );


    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

            {/* Ambient Background Glows (Dark Mode Only) */}
            {isDark && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    <LinearGradient
                        colors={['rgba(171, 71, 188, 0.08)', 'transparent']}
                        style={{ position: 'absolute', top: -50, right: -50, width: width * 0.9, height: width * 0.9, borderRadius: (width * 0.9) / 2 }}
                        start={{ x: 0.5, y: 0.5 }}
                        end={{ x: 1, y: 1 }}
                    />
                    <LinearGradient
                        colors={['rgba(0, 108, 73, 0.08)', 'transparent']}
                        style={{ position: 'absolute', bottom: 120, left: -50, width: width * 0.9, height: width * 0.9, borderRadius: (width * 0.9) / 2 }}
                        start={{ x: 0.5, y: 0.5 }}
                        end={{ x: 0, y: 0 }}
                    />
                </View>
            )}

            {/* Frosted Glass Header */}
            <View style={[styles.headerWrapper, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : theme.border }]}>
                <BlurView
                    intensity={80}
                    tint={isDark ? 'dark' : 'light'}
                    style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(24, 24, 27, 0.75)' : 'rgba(255, 255, 255, 0.75)' }]}
                />
                <View style={styles.headerContent}>
                    <View style={styles.headerTopRow}>
                        <TouchableOpacity
                            style={[
                                styles.iconButton, 
                                { 
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                    borderWidth: 1,
                                }
                            ]}
                            onPress={() => setSettingsVisible(true)}
                        >
                            <Ionicons name="settings-outline" size={22} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: 'Amiri-Bold', fontSize: 24 }]}>القرآن الكريم</Text>
                        <TouchableOpacity
                            style={[
                                styles.iconButton, 
                                { 
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                    borderWidth: 1,
                                }
                            ]}
                            onPress={() => setIsBookmarksModalVisible(true)}
                        >
                            <Ionicons name="bookmarks-outline" size={22} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar & Page Jump */}
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                        <View style={[
                            styles.searchContainerHeader, 
                            { 
                                backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.8)', 
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : theme.border 
                            }
                        ]}>
                            <Ionicons name="search" size={20} color={theme.textSecondary} />
                            <TextInput
                                style={[styles.searchInputHeader, { color: theme.text }]}
                                placeholder="ابحث عن سورة..."
                                placeholderTextColor={theme.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                textAlign="right"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.pageJumpButton, 
                                { 
                                    backgroundColor: theme.primary,
                                    borderColor: theme.primary,
                                    borderWidth: 1,
                                }
                            ]}
                            onPress={() => setIsPageSearchVisible(true)}
                        >
                            <Ionicons name="book-outline" size={20} color="#FFF" />
                            <Text style={styles.pageJumpText}>صفحة</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={styles.bodyContainer}>
                {/* Last Read Banner (Mini) */}
                {lastRead && lastReadSurah && (
                    <TouchableOpacity
                        style={[
                            styles.continueBanner, 
                            { 
                                backgroundColor: isDark ? 'rgba(39, 39, 42, 0.5)' : theme.cardBackground, 
                                borderColor: theme.primary,
                                borderWidth: 1,
                            }
                        ]}
                        onPress={() => router.push({
                            pathname: '/quran/[id]',
                            params: { id: lastRead.surahId, page: lastRead.page }
                        })}
                    >
                        <View style={[styles.continueIcon, { backgroundColor: theme.primary + '20' }]}>
                            <Ionicons name="time" size={20} color={theme.primary} />
                        </View>
                        <View style={styles.continueContent}>
                            <Text style={[styles.continueLabel, { color: theme.primary }]}>تابـع القـراءة</Text>
                            <Text style={[styles.continueTitle, { color: theme.text }]}>
                                {lastReadSurah.name} <Text style={{ fontSize: 13, opacity: 0.7 }}>• ص {lastRead.page}</Text>
                            </Text>
                        </View>
                        <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                )}

                {/* Filters */}
                <View style={styles.filtersContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filtersRow}
                    >
                        <TouchableOpacity
                            style={[
                                styles.filterChip, 
                                { 
                                    backgroundColor: isDark ? 'rgba(39, 39, 42, 0.4)' : theme.cardBackground, 
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : theme.border, 
                                    borderWidth: 1,
                                    width: 40, 
                                    paddingHorizontal: 0 
                                }
                            ]}
                            onPress={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        >
                            <Ionicons name={sortOrder === 'asc' ? "arrow-down" : "arrow-up"} size={18} color={theme.text} />
                        </TouchableOpacity>

                        <FilterChip
                            label="الكل"
                            isSelected={filterType === 'all'}
                            activeColor={theme.primary}
                            theme={theme}
                            isDark={isDark}
                            onPress={() => setFilterType('all')}
                        />
                        <FilterChip
                            label="مكية"
                            isSelected={filterType === 'meccan'}
                            activeColor="#AB47BC"
                            theme={theme}
                            isDark={isDark}
                            onPress={() => setFilterType('meccan')}
                        />
                        <FilterChip
                            label="مدنية"
                            isSelected={filterType === 'medinan'}
                            activeColor="#10B981"
                            theme={theme}
                            isDark={isDark}
                            onPress={() => setFilterType('medinan')}
                        />
                    </ScrollView>
                </View>

                {/* List */}
                <FlatList
                    data={filteredSurahs}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={EmptyList}
                />
            </View>

            {/* Bookmarks Modal (Kept clean) */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isBookmarksModalVisible}
                onRequestClose={() => setIsBookmarksModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsBookmarksModalVisible(false)}
                >
                    <Pressable
                        style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}
                        onPress={e => e.stopPropagation()}
                    >
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>العلامات المحفوظة</Text>
                            <TouchableOpacity onPress={() => setIsBookmarksModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>


                        <ScrollView contentContainerStyle={{ padding: 16 }}>
                            {/* Page Bookmarks Section */}
                            {bookmarks.length > 0 && (
                                <View style={{ marginBottom: 20 }}>
                                    <Text style={[styles.sectionHeader, { color: theme.primary }]}>الصفحات المحفوظة</Text>
                                    {bookmarks.map((item, index) => (
                                        <View key={index} style={[styles.bookmarkRow, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : theme.background, borderColor: theme.border, marginBottom: 8 }]}>
                                            <TouchableOpacity
                                                style={styles.bookmarkMain}
                                                onPress={async () => {
                                                    setIsBookmarksModalVisible(false);
                                                    router.push({
                                                        pathname: '/quran/[id]',
                                                        params: { id: item.surahId, page: item.page }
                                                    });
                                                }}
                                            >
                                                <View style={[styles.bookmarkIcon, { backgroundColor: theme.primary + '15' }]}>
                                                    <Ionicons name="bookmark" size={16} color={theme.primary} />
                                                </View>
                                                <View style={{ gap: 2 }}>
                                                    <Text style={[styles.bookmarkSurah, { color: theme.text }]}>سورة {getSurah(item.surahId)?.name}</Text>
                                                    <Text style={[styles.bookmarkPage, { color: theme.textSecondary }]}>صفحة {item.page}</Text>
                                                </View>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.deleteBtn}
                                                onPress={() => handleDeleteBookmark(item.page)}
                                            >
                                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Ayah Bookmarks Section */}
                            {ayahBookmarks.length > 0 && (
                                <View>
                                    <Text style={[styles.sectionHeader, { color: theme.primary }]}>الآيات المحفوظة ({ayahBookmarks.length})</Text>
                                    {ayahBookmarks.map((item, index) => (
                                        <View key={`ayah-${index}`} style={[styles.bookmarkRow, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : theme.background, borderColor: theme.border, marginBottom: 8 }]}>
                                            <TouchableOpacity
                                                style={styles.bookmarkMain}
                                                onPress={() => {
                                                    setIsBookmarksModalVisible(false);
                                                    const params: any = { id: item.surahId };
                                                    if (item.page) {
                                                        params.page = item.page;
                                                    }
                                                    router.push({
                                                        pathname: '/quran/[id]',
                                                        params: params
                                                    });
                                                }}
                                            >
                                                <View style={[styles.bookmarkIcon, { backgroundColor: '#8B5CF615' }]}>
                                                    <Ionicons name="star" size={16} color="#8B5CF6" />
                                                </View>
                                                <View style={{ gap: 2, flex: 1 }}>
                                                    <Text style={[styles.bookmarkSurah, { color: theme.text }]}>
                                                        سورة {getSurah(item.surahId)?.name} - آية {item.ayahNumber}
                                                    </Text>
                                                    <Text style={[styles.bookmarkPage, { color: theme.textSecondary }]}>صفحة {item.page}</Text>
                                                </View>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.deleteBtn}
                                                onPress={() => handleDeleteAyahBookmark(item.timestamp)}
                                            >
                                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {bookmarks.length === 0 && ayahBookmarks.length === 0 && (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="bookmark-outline" size={48} color={theme.textSecondary} />
                                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>لا توجد علامات محفوظة</Text>
                                </View>
                            )}
                        </ScrollView>
                    </Pressable>
                </TouchableOpacity>
            </Modal>

            <SettingsModal
                visible={isSettingsVisible}
                onClose={() => setSettingsVisible(false)}
                useArabicNumbers={useArabicNumbers}
                onToggleNumbers={handleToggleNumbers}
                fontScale={fontScale}
                onFontScaleChange={handleFontScaleChange}
                theme={theme}
            />

            {/* Page Jump Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isPageSearchVisible}
                onRequestClose={() => setIsPageSearchVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsPageSearchVisible(false)}
                >
                    <Pressable
                        style={[styles.smallModalContent, { backgroundColor: theme.cardBackground }]}
                        onPress={e => e.stopPropagation()}
                    >
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>الذهاب لصفحة</Text>
                            <TouchableOpacity onPress={() => setIsPageSearchVisible(false)}>
                                <Ionicons name="close-circle" size={24} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ padding: 20, alignItems: 'center', gap: 20 }}>
                            <Text style={{ fontSize: 16, color: theme.textSecondary, textAlign: 'center' }}>
                                أدخل رقم الصفحة (1 - 604)
                            </Text>

                            <TextInput
                                style={[styles.pageInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                keyboardType="number-pad"
                                placeholder="#"
                                placeholderTextColor={theme.textSecondary}
                                value={pageSearchInput}
                                onChangeText={setPageSearchInput}
                                autoFocus
                            />

                            <TouchableOpacity
                                style={[styles.goButton, { backgroundColor: theme.primary }]}
                                onPress={() => {
                                    const p = parseInt(pageSearchInput);
                                    if (p >= 1 && p <= 604) {
                                        const sId = getSurahFromPage(p);
                                        setIsPageSearchVisible(false);
                                        setPageSearchInput('');
                                        router.push({
                                            pathname: '/quran/[id]',
                                            params: { id: sId, page: p }
                                        });
                                    } else {
                                        Alert.alert('خطأ', 'الرجاء إدخال رقم صحيح بين 1 و 604');
                                    }
                                }}
                            >
                                <Text style={styles.goButtonText}>انتقـل</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </TouchableOpacity>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerWrapper: {
        paddingTop: 54,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        zIndex: 10,
        overflow: 'hidden',
        borderBottomWidth: 1,
    },
    headerContent: {
        zIndex: 2,
    },
    headerTopRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainerHeader: {
        flex: 1,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        borderRadius: 14,
        paddingHorizontal: 12,
        height: 44,
        gap: 8,
        borderWidth: 1,
    },
    searchInputHeader: {
        flex: 1,
        fontSize: 15,
        textAlign: 'right',
        fontWeight: '500',
    },
    headerPattern: {
        position: 'absolute',
        bottom: -20,
        left: -20,
        opacity: 0.2,
        zIndex: 1,
        transform: [{ rotate: '-15deg' }]
    },
    bodyContainer: {
        flex: 1,
        marginTop: 12,
        paddingBottom: 100, // Extra padding for tabs
    },
    continueBanner: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 12,
        borderRadius: 16,
        gap: 12,
        borderWidth: 1,
        borderLeftWidth: 4, // Accent on the side
    },
    continueIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    continueContent: {
        flex: 1,
        alignItems: 'flex-end',
    },
    continueLabel: {
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 2,
    },
    continueTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    filtersContainer: {
        marginBottom: 12,
    },
    filtersRow: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    card: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        overflow: 'hidden',
    },
    numberContainer: {
        marginLeft: 16,
    },
    numberBadge: {
        width: 36,
        height: 36,
        borderRadius: 12,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: '45deg' }],
    },
    numberText: {
        fontSize: 14,
        fontWeight: '800',
        transform: [{ rotate: '-45deg' }], // Counter rotate
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    textContainer: {
        alignItems: 'flex-end',
    },
    arabicName: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },
    englishName: {
        fontSize: 13,
        fontWeight: '500',
    },
    dotSeparator: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#9CA3AF',
        marginHorizontal: 6,
    },
    leftContainer: {
        alignItems: 'center',
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    typeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        borderRadius: 24,
        maxHeight: '70%',
        width: '100%',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    bookmarkRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        gap: 12,
    },
    bookmarkMain: {
        flex: 1,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12,
    },
    bookmarkIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookmarkSurah: {
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'right',
    },
    bookmarkAyahText: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'right',
        fontFamily: 'Amiri-Bold',
        marginBottom: 4,
    },
    bookmarkPage: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'right',
    },
    deleteBtn: {
        padding: 8,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'right',
        fontFamily: 'Amiri-Bold'
    },
    pageJumpButton: {
        height: 44,
        paddingHorizontal: 14,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 6
    },
    pageJumpText: {
        color: '#FFF',
        fontSize: 12,
        fontFamily: 'Amiri-Bold',
    },
    smallModalContent: {
        borderRadius: 24,
        width: '85%',
        overflow: 'hidden',
    },
    pageInput: {
        width: '60%',
        height: 60,
        fontSize: 32,
        fontWeight: '700',
        textAlign: 'center',
        borderRadius: 16,
        borderWidth: 1,
    },
    goButton: {
        width: '100%',
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    goButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'Amiri-Bold'
    }
});
