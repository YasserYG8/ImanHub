import { View, Text, StyleSheet, FlatList, Dimensions, Image, ActivityIndicator, TouchableOpacity, Share, Modal, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useThemeColor';
import { useThemeContext } from '@/context/ThemeContext';
import { getSurahStartPage, getSurahFromPage } from '@/utils/quranPageMapping';
import { getArabicSurahName } from '@/utils/arabicSurahNames';
import { NavigationModal } from '@/components/quran/NavigationModal';
import { SettingsModal } from '@/components/quran/SettingsModal';

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';

// ... (existing imports)

// State removed (Orphaned)

import { Ionicons } from '@expo/vector-icons';
import Toast, { ToastRef } from '@/components/Toast';
import { useQuran } from '@/hooks/useQuran';
import { KEYS, saveItem, getItem } from '@/utils/storage';
import { getSurahText, getQuranPage } from '@/utils/quranApi';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZoomableImage } from '@/components/quran/ZoomableImage';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

// Generate pages 1 to 604
const PAGES = Array.from({ length: 604 }, (_, i) => i + 1);

// Surah Header Component
const SurahHeader = ({ surahName, theme }: { surahName: string, theme: any }) => (
    <View style={styles.surahHeaderContainer}>
        <View style={[styles.surahOrnamentalFrame, { borderColor: theme.primary }]}>
            {/* Right Decoration */}
            <Ionicons name="leaf-outline" size={scale(24)} color={theme.primary} style={{ transform: [{ rotate: '-90deg' }] }} />

            <View style={styles.surahTitleContainer}>
                <Text style={[styles.surahTitleText, { color: theme.primary }]}>
                    {surahName}
                </Text>
                <Text style={[styles.surahSubtitleText, { color: theme.textSecondary }]}>
                    {/* Additional metadata could go here */}
                </Text>
            </View>

            {/* Left Decoration */}
            <Ionicons name="leaf-outline" size={scale(24)} color={theme.primary} style={{ transform: [{ rotate: '90deg' }] }} />
        </View>
    </View>
);

// Ayah Menu Component
// (AyahMenu is defined below, ensure we don't duplicate or shadow it if it was preserved)
// In the current broken file state, AyahMenu starts at line 61. 
// So I should STOP before line 61.
// But I need to wrap SurahScreen too. SurahScreen starts AFTER AyahMenu (usually).
// Let's check where AyahMenu ends. 

const AyahMenu = ({ visible, onClose, onAction, ayah, theme, isDark, useArabicNumbers, isAyahBookmarked }: any) => {
    if (!visible || !ayah) return null;

    const actions = [
        { id: 'play', icon: 'play-circle-outline', label: 'تشغيل التلاوة' },
        { id: 'tafsir', icon: 'book-outline', label: 'تفسير' },
        isAyahBookmarked
            ? { id: 'removeBookmark', icon: 'bookmark', label: 'إزالة الحفظ', color: '#EF4444' }
            : { id: 'bookmark', icon: 'bookmark-outline', label: 'حفظ' },
        { id: 'copy', icon: 'copy-outline', label: 'نسخ الآية' },
        { id: 'share', icon: 'share-social-outline', label: 'مشاركة' },
    ];

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.menuOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                {/* Reference style: Dark popup with list */}
                <View style={[styles.menuContainer, { backgroundColor: '#1A1A1A', borderColor: '#333', borderWidth: 1 }]}>

                    {/* Header */}
                    <View style={styles.menuHeader}>
                        <View>
                            <Text style={[styles.menuTitle, { color: '#FFF' }]}>
                                {ayah.surahName} : {useArabicNumbers ? ayah.numberInSurah.toLocaleString('ar-EG') : ayah.numberInSurah}
                            </Text>
                        </View>
                    </View>

                    {/* Divider */}
                    <View style={[styles.menuDivider, { backgroundColor: '#333' }]} />

                    {/* List Actions */}
                    {actions.map((action) => (
                        <TouchableOpacity
                            key={action.id}
                            style={styles.menuItem}
                            onPress={() => {
                                onAction(action.id, ayah);
                                onClose();
                            }}
                        >
                            <Ionicons name={action.icon as any} size={22} color={action.color || '#FFF'} />
                            <Text style={[styles.menuItemText, { color: action.color || '#FFF' }]}>{action.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

// Duplicate SurahHeader removed

const QuranTextPage = React.memo(({ pageNumber, theme, onAyahPress, bookmarks, ayahBookmarks, useArabicNumbers, highlightAyah, fontScale = 1.0 }: any) => {
    const [ayahs, setAyahs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setLoading(true);
            console.log(`[QuranTextPage] Requesting page ${pageNumber}...`);
            const data = await getQuranPage(pageNumber, 'quran-uthmani');
            console.log(`[QuranTextPage] Received for page ${pageNumber}:`, data ? `${data.length} ayahs` : 'NULL');
            if (data && data.length > 0) {
                console.log(`[QuranTextPage] Sample ayah 0:`, JSON.stringify(data[0]).substring(0, 100));
            }
            if (isMounted) {
                setAyahs(data || []);
                setLoading(false);
            }
        };
        load();
        return () => { isMounted = false; };
    }, [pageNumber]);

    // Responsive Calculation
    // Responsive Calculation
    const { width: screenWidth } = Dimensions.get('window');
    const scale = (size: number) => (screenWidth / 375) * size;

    // STRICT USER RULES:
    // Ayah body text: 26px, Line height: 48px
    // Apply fontScale for zoom in/out accessibility
    const fontSize = scale(26) * fontScale;
    const lineHeight = scale(48) * fontScale;
    const textAlign = 'center'; // "Center aligned" strict
    const ayahMarkerSize = scale(24) * fontScale; // Approximation for "Diameter 24px" using font size

    // Group ayahs into paragraphs separated by Surah headers
    const paragraphs = useMemo(() => {
        if (!ayahs.length) return [];

        const result: { header?: { name: string; number: number }; ayahs: any[] }[] = [];
        let currentParagraph: any[] = [];

        ayahs.forEach((ayah, index) => {
            const isFirstAyahOfSurah = ayah.numberInSurah === 1;

            if (isFirstAyahOfSurah && index > 0) {
                // Save the current paragraph before starting a new one
                if (currentParagraph.length > 0) {
                    result.push({ ayahs: currentParagraph });
                    currentParagraph = [];
                }
                // Start new paragraph with header
                result.push({
                    header: { name: ayah.surahName, number: ayah.surahNumber },
                    ayahs: []
                });
            } else if (isFirstAyahOfSurah && index === 0) {
                // First ayah on page is also Surah start
                result.push({
                    header: { name: ayah.surahName, number: ayah.surahNumber },
                    ayahs: []
                });
            }

            // Add ayah to current or last paragraph
            if (result.length === 0) {
                currentParagraph.push(ayah);
            } else {
                const lastParagraph = result[result.length - 1];
                lastParagraph.ayahs.push(ayah);
            }
        });

        // Don't forget remaining ayahs
        if (currentParagraph.length > 0) {
            result.push({ ayahs: currentParagraph });
        }

        return result;
    }, [ayahs]);

    const scrollViewRef = useRef<ScrollView>(null);
    const [targetScrollPos, setTargetScrollPos] = useState<number | null>(null);
    const [paragraphLayouts, setParagraphLayouts] = useState<{ [key: number]: number }>({});
    const [targetAyahInfo, setTargetAyahInfo] = useState<{ pIndex: number; y: number } | null>(null);

    // Auto-scroll when target position is determined
    useEffect(() => {
        if (targetScrollPos !== null && scrollViewRef.current) {
            setTimeout(() => {
                scrollViewRef.current?.scrollTo({ y: Math.max(0, targetScrollPos - scale(100)), animated: true });
            }, 500);
        }
    }, [targetScrollPos]);

    // Calculate final scroll position when inputs are ready
    useEffect(() => {
        if (targetAyahInfo && paragraphLayouts[targetAyahInfo.pIndex] !== undefined) {
            const finalY = paragraphLayouts[targetAyahInfo.pIndex] + targetAyahInfo.y;
            // Only update if significantly different to avoid loops, though strict equality check usually handles it
            setTargetScrollPos(prev => (prev === finalY ? prev : finalY));
        } else if (highlightAyah && !targetAyahInfo) {
            // Fallback: Check if we have the paragraph layout for the ayah's paragraph
            // We need to know WHICH paragraph has the ayah.
            // We can find it from the ayahs data if needed, or set it during render.
            // Let's rely on the render loop finding it.
        }
    }, [targetAyahInfo, paragraphLayouts, highlightAyah]);

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { height: Dimensions.get('window').height * 0.7 }]}>
                <ActivityIndicator color={theme.primary} />
            </View>
        );
    }

    // Render each paragraph with its optional header
    return (
        <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.textPageContent}
            showsVerticalScrollIndicator={false}
        >
            {paragraphs.map((paragraph, pIndex) => {
                // Check if this paragraph contains the highlighted ayah
                const targetAyahInThisParagraph = highlightAyah && paragraph.ayahs.find((a: any) =>
                    a.surahNumber === highlightAyah.surahId && a.numberInSurah === highlightAyah.ayahNumber
                );

                return (
                    <View
                        key={`paragraph-${pIndex}`}
                        style={{ width: '100%' }}
                        onLayout={(e) => {
                            const y = e.nativeEvent.layout.y;
                            setParagraphLayouts(prev => ({ ...prev, [pIndex]: y }));

                            // Fallback: If we found user's target paragraph but no specific ayah layout (yet),
                            // we can tentatively set scroll to paragraph top.
                            // Use a separate state or just setTargetScrollPos if not set?
                            if (targetAyahInThisParagraph && !targetAyahInfo) {
                                // Optional: setTargetScrollPos(y); 
                                // But let's wait for exact position if possible.
                            }
                        }}
                    >
                        {/* Surah Header (rendered OUTSIDE of Text block) */}
                        {paragraph.header && (
                            <View style={[styles.surahHeaderWrapper, pIndex > 0 && { marginTop: scale(11) }]}>
                                <SurahHeader surahName={paragraph.header.name} theme={theme} />
                                {/* Basmalah - not for Fatiha (1) or At-Tawbah (9) */}
                                {paragraph.header.number !== 1 && paragraph.header.number !== 9 && (
                                    <Text style={[
                                        styles.basmalahText,
                                        {
                                            color: theme.text,
                                            fontSize: fontSize,
                                            lineHeight: lineHeight
                                        }
                                    ]}>
                                        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Justified paragraph text block */}
                        {paragraph.ayahs.length > 0 && (
                            <Text style={[
                                styles.quranTextParagraph,
                                {
                                    color: theme.text,
                                    textAlign: textAlign,
                                    fontSize: fontSize,
                                    lineHeight: lineHeight
                                }
                            ]} textBreakStrategy="simple">
                                {paragraph.ayahs.map((ayah) => {
                                    const isBookmarked = ayahBookmarks?.some((b: any) => b.surahId === ayah.surahNumber && b.ayahNumber === ayah.numberInSurah);
                                    const isHighlighted = highlightAyah && highlightAyah.ayahNumber === ayah.numberInSurah && (highlightAyah.surahId === ayah.surahNumber || !ayah.surahNumber);

                                    return (
                                        <Text
                                            key={ayah.number}
                                            onPress={() => onAyahPress(ayah)}
                                            onLayout={isHighlighted ? (e) => {
                                                const y = e.nativeEvent.layout.y;
                                                setTargetAyahInfo({ pIndex, y });
                                            } : undefined}
                                            style={{
                                                fontFamily: 'Amiri-Regular',
                                                backgroundColor: isBookmarked
                                                    ? theme.primary + '40'
                                                    : (isHighlighted ? theme.primary + '25' : undefined)
                                            }}
                                        >


                                            {ayah.text}
                                            <Text style={{
                                                color: theme.primary,
                                                fontFamily: 'Amiri-Bold',
                                                fontSize: fontSize * 0.85
                                            }}>
                                                {` \u06DD${useArabicNumbers ? ayah.numberInSurah.toLocaleString('ar-EG') : ayah.numberInSurah} `}
                                            </Text>
                                        </Text>
                                    );
                                })}
                            </Text>
                        )}
                    </View>
                )
            })}
        </ScrollView>
    );
});

// ...




export default function SurahScreen() {
    const { id, page, ayah, textMode } = useLocalSearchParams();
    const theme = useTheme();
    const { isDark } = useThemeContext();


    const router = useRouter();
    const { getSurah } = useQuran();
    const insets = useSafeAreaInsets();

    const surahId = parseInt(id as string);
    const targetAyah = ayah ? parseInt(ayah as string) : null;
    const shouldStartInTextMode = textMode === 'true';

    // If 'page' param is provided, use it. Otherwise use Surah start page.
    const startPage = useMemo(() => {
        if (page) {
            console.log('[SurahScreen] Page param received:', page);
            return parseInt(page as string);
        }
        const start = getSurahStartPage(surahId);
        console.log('[SurahScreen] No page param. Using Surah Start:', start);
        return start;
    }, [surahId, page]);

    const [currentPage, setCurrentPage] = useState(startPage);
    const [currentSurahId, setCurrentSurahId] = useState(surahId);

    // Derived state
    const currentSurah = getSurah(currentSurahId);

    const [isBookmarked, setIsBookmarked] = useState(false);
    const [bookmarksList, setBookmarksList] = useState<any[]>([]);

    const [selectedAyah, setSelectedAyah] = useState<any>(null);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [isNavModalVisible, setNavModalVisible] = useState(false);
    const [useArabicNumbers, setUseArabicNumbers] = useState(true);
    const [fontScale, setFontScale] = useState(1.0);
    const [isSettingsVisible, setSettingsVisible] = useState(false);

    // Toast ref
    const toastRef = useRef<ToastRef>(null);
    const flatListRef = useRef<FlatList>(null);

    const [ayahBookmarks, setAyahBookmarks] = useState<any[]>([]);

    // Check bookmark status on load and page change
    useFocusEffect(
        useCallback(() => {
            const checkStatus = async () => {
                const stored = (await getItem<any[]>(KEYS.BOOKMARKS)) || [];
                setBookmarksList(stored);
                const exists = stored.some(b => b.page === currentPage);
                setIsBookmarked(exists);

                const storedAyahs = (await getItem<any[]>('bookmarked_ayahs')) || [];
                setAyahBookmarks(storedAyahs);

                const settings = await getItem<any>('quran_settings');
                console.log('[SurahScreen] Settings Loaded:', settings);
                if (settings) {
                    setUseArabicNumbers(settings.useArabicNumbers ?? true);
                    setFontScale(settings.fontScale ?? 1.0);
                }
            };
            checkStatus();
        }, [currentPage])
    );

    // Initial scroll index calculation
    const initialIndex = Math.max(0, startPage - 1);

    // Force scroll to initial index on mount (Reliability fix)
    useEffect(() => {
        if (flatListRef.current && initialIndex > 0) {
            // Small timeout to ensure layout is ready
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
            }, 100);
        }
    }, []);

    const handleNavigation = (type: 'page' | 'surah' | 'hizb', value: number) => {
        let targetPage = 1;
        if (type === 'page') {
            targetPage = value;
        } else if (type === 'surah') {
            targetPage = getSurahStartPage(value);
        }

        setCurrentPage(targetPage);
        const newSurahId = getSurahFromPage(targetPage);
        setCurrentSurahId(newSurahId);

        // Fix: Programmatic Scroll
        flatListRef.current?.scrollToIndex({ index: targetPage - 1, animated: false });
        setNavModalVisible(false);
    };

    const getItemLayout = (_: any, index: number) => ({
        length: width,
        offset: width * index,
        index,
    });

    const handleFontScaleChange = async (newScale: number) => {
        setFontScale(newScale);
        const settings = (await getItem<any>('quran_settings')) || {};
        await saveItem('quran_settings', { ...settings, fontScale: newScale });
    };

    const handleToggleNumbers = async (val: boolean) => {
        setUseArabicNumbers(val);
        const settings = (await getItem<any>('quran_settings')) || {};
        await saveItem('quran_settings', { ...settings, useArabicNumbers: val });
    };

    const renderItem = useCallback(({ item: pageNumber }: { item: number }) => {
        return (
            <View style={{ width, flex: 1 }}>
                <QuranTextPage
                    pageNumber={pageNumber}
                    theme={theme}
                    bookmarks={bookmarksList}
                    ayahBookmarks={ayahBookmarks}
                    useArabicNumbers={useArabicNumbers}
                    fontScale={fontScale}
                    highlightAyah={(targetAyah && currentSurahId) ? { surahId: currentSurahId, ayahNumber: targetAyah } : null}
                    onAyahPress={(ayah: any) => {
                        setSelectedAyah({ ...ayah, page: pageNumber });
                        setIsMenuVisible(true);
                    }}
                />
            </View>
        );
    }, [theme, bookmarksList, ayahBookmarks, useArabicNumbers, fontScale, targetAyah, currentSurahId]);

    const headerTitle = useMemo(() => {
        return currentSurah?.name || "القرآن الكريم"; // Use Arabic Name or Generic
    }, [currentSurah]);

    const handleToggleBookmark = async () => {
        try {
            const existingBookmarks: any[] = (await getItem(KEYS.BOOKMARKS)) || [];

            if (isBookmarked) {
                // Remove Bookmark
                const filtered = existingBookmarks.filter(b => b.page !== currentPage);
                await saveItem(KEYS.BOOKMARKS, filtered);
                setBookmarksList(filtered);
                setIsBookmarked(false);
                toastRef.current?.show("تم إزالة الحفظ", "info"); // Arabic Message
            } else {
                // Add Bookmark
                const filtered = existingBookmarks.filter(b => b.page !== currentPage); // Just in case

                if (filtered.length >= 10) {
                    filtered.pop(); // Remove oldest
                }

                const newBookmark = {
                    surahId: currentSurahId,
                    page: currentPage,
                    timestamp: Date.now(),
                    surahName: currentSurah?.name || 'القرآن'
                };

                const updatedBookmarks = [newBookmark, ...filtered];
                await saveItem(KEYS.BOOKMARKS, updatedBookmarks);

                // Also update Last Read
                await saveItem(KEYS.LAST_READ, {
                    surahId: currentSurahId,
                    page: currentPage,
                    timestamp: Date.now(),
                });

                setBookmarksList(updatedBookmarks);
                setIsBookmarked(true);
                toastRef.current?.show("تم الحفظ بنجاح", "success"); // Arabic Message
            }

        } catch (error) {
            console.error(error);
            toastRef.current?.show("خطأ في الحفظ", "error");
        }
    };

    // Track visible items in Text View to know which Page we are on


    const handleAyahAction = async (actionId: string, item: any) => {
        switch (actionId) {
            case 'copy':
                await Clipboard.setStringAsync(item.arabic);
                toastRef.current?.show("تم نسخ النص", "success");
                break;
            case 'share':
                try {
                    await Share.share({
                        message: `${item.arabic}\n\n${item.tafsir || ''}\n\n[${currentSurah?.name}: ${item.numberInSurah}]`
                    });
                } catch (error) {
                    // ignore
                }
                break;
            case 'play':
                toastRef.current?.show("جاري تشغيل التلاوة...", "info");
                setTimeout(() => {
                    toastRef.current?.show("تلاوة " + currentSurah?.name, "success");
                }, 500);
                break;
            case 'bookmark':
                try {
                    const savedAyahs = (await getItem<any[]>('bookmarked_ayahs')) || [];
                    const newBm = {
                        surahId: currentSurahId,
                        ayahNumber: item.numberInSurah,
                        text: item.arabic,
                        page: item.page || currentPage,
                        timestamp: Date.now()
                    };
                    const updatedList = [newBm, ...savedAyahs];
                    await saveItem('bookmarked_ayahs', updatedList);
                    setAyahBookmarks(updatedList);
                    toastRef.current?.show("تم حفظ الآية", "success");
                } catch (e) {
                    toastRef.current?.show("خطأ في الحفظ", "error");
                }
                break;
            case 'removeBookmark':
                try {
                    const savedAyahs = (await getItem<any[]>('bookmarked_ayahs')) || [];
                    const filteredList = savedAyahs.filter(
                        (b: any) => !(b.surahId === currentSurahId && b.ayahNumber === item.numberInSurah)
                    );
                    await saveItem('bookmarked_ayahs', filteredList);
                    setAyahBookmarks(filteredList);
                    toastRef.current?.show("تم إزالة الحفظ", "info");
                } catch (e) {
                    toastRef.current?.show("خطأ في الإزالة", "error");
                }
                break;
            default:
                break;
        }
    };

    // renderAyahItem removed


    // Unified View (Text Mode Enforced)
    // RTL Navigation: inverted={true} means Swipe Left -> Next Page (Higher ID)
    return (
        <View style={[
            styles.container,
            {
                backgroundColor: theme.background,
                paddingTop: insets.top,
                paddingBottom: insets.bottom
            }
        ]}>

            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    style={[styles.headerButton, { backgroundColor: theme.cardBackground }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-forward" size={24} color={theme.text} />
                </TouchableOpacity>
                {/* Arrow Forward for RTL Back Button context (or keep Arrow Back and flip logic? Usually arrow-forward is "Back" in RTL if not mirrored automatically. Let's stick to arrow-forward for visual RTL 'Right' pointing) - Wait, arrow-back points Left. In RTL, Back is Right. So arrow-forward points Right.*/}

                <TouchableOpacity
                    style={[styles.titleContainer, { backgroundColor: theme.cardBackground }]}
                    onPress={() => setNavModalVisible(true)}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Text style={[styles.headerTitle, { color: theme.primary, fontFamily: 'Amiri-Bold', fontSize: 20 }]}>
                            {currentSurah ? getArabicSurahName(currentSurah.id) : ""}
                        </Text>
                        <Ionicons name="chevron-down-circle-outline" size={16} color={theme.primary} />
                    </View>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                        style={[styles.headerButton, { backgroundColor: theme.cardBackground }]}
                        onPress={() => setSettingsVisible(true)}
                    >
                        <Ionicons
                            name="settings-outline"
                            size={20}
                            color={theme.text}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.headerButton, { backgroundColor: theme.cardBackground }]}
                        onPress={handleToggleBookmark}
                    >
                        <Ionicons
                            name={isBookmarked ? "bookmark" : "bookmark-outline"}
                            size={20}
                            color={isBookmarked ? theme.primary : theme.text}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ flex: 1, backgroundColor: theme.background }}>
                <FlatList
                    ref={flatListRef}
                    data={PAGES}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.toString()}
                    horizontal
                    pagingEnabled
                    inverted={true} // RTL Fix: Swipe Left to go Next
                    showsHorizontalScrollIndicator={false}
                    initialScrollIndex={initialIndex}
                    getItemLayout={getItemLayout}
                    // Adjust Momentum logic for Inverted List?
                    // FlatList inverted reverses the rendering order. Index 0 is at right.
                    // Swipe Left (scroll right) goes to Index 1?
                    // No, Inverted means start from Right. Swipe Left moves to Left content (Index 1).
                    // Logic for page calculation stays same if contentOffset works accurately.
                    onMomentumScrollEnd={(ev) => {
                        const newIndex = Math.round(ev.nativeEvent.contentOffset.x / width);
                        // Inverted might affect index calculation depending on platform? 
                        // Usually RN handles this transparently for horizontal lists.
                        const newPage = newIndex + 1;
                        if (newPage !== currentPage) {
                            setCurrentPage(newPage);
                            const newSurahId = getSurahFromPage(newPage);
                            if (newSurahId !== currentSurahId) {
                                setCurrentSurahId(newSurahId);
                            }
                        }
                    }}
                    windowSize={3}
                    maxToRenderPerBatch={2}
                    removeClippedSubviews={true}
                />

                {/* Bottom Page Number Footer */}
                <View style={styles.footerContainer}>
                    <Text style={[styles.footerPageText, { color: theme.textSecondary }]}>
                        {useArabicNumbers
                            ? currentPage.toLocaleString('ar-EG')
                            : currentPage}
                    </Text>
                </View>
            </View>

            <AyahMenu
                visible={isMenuVisible}
                onClose={() => {
                    setIsMenuVisible(false);
                    setSelectedAyah(null);
                }}
                onAction={handleAyahAction}
                ayah={selectedAyah}
                theme={theme}
                isDark={isDark}
                useArabicNumbers={useArabicNumbers}
                isAyahBookmarked={selectedAyah && ayahBookmarks?.some(
                    (b: any) => b.surahId === currentSurahId && b.ayahNumber === selectedAyah.numberInSurah
                )}
            />

            <NavigationModal
                visible={isNavModalVisible}
                onClose={() => setNavModalVisible(false)}
                onNavigate={handleNavigation}
                theme={theme}
            />

            <SettingsModal
                visible={isSettingsVisible}
                onClose={() => setSettingsVisible(false)}
                useArabicNumbers={useArabicNumbers}
                onToggleNumbers={handleToggleNumbers}
                fontScale={fontScale}
                onFontScaleChange={handleFontScaleChange}
                theme={theme}
            />

            <Toast ref={toastRef} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    pageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quranImage: {
        width: '100%',
        height: '100%',
    },
    footerContainer: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    footerPageText: {
        fontSize: 14,
        fontFamily: 'Amiri-Bold',
    },
    pageNumberBadge: {
        position: 'absolute',
        bottom: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'center',
    },
    pageNumberText: {
        fontSize: 12,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        width: '100%',
        zIndex: 10,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 10,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '500',
    },
    textListContent: {
        padding: 20,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '500',
    },
    ayahContainer: {
        marginBottom: 24,
        padding: 12,
        borderRadius: 12,
        borderBottomWidth: 1,
    },
    ayahHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 12,
    },
    ayahBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ayahNumber: {
        fontSize: 14,
        fontWeight: '700',
    },
    arabicText: {
        fontSize: 28,
        fontWeight: '600',
        textAlign: 'right',
        lineHeight: 56,
        marginBottom: 16,
    },
    englishText: {
        fontSize: 16,
        textAlign: 'left',
        lineHeight: 24,
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    menuContainer: {
        borderRadius: 20,
        padding: 20,
        width: '100%',
        maxWidth: 340,
        // Shadow
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    menuHeader: {
        marginBottom: 4,
        alignItems: 'flex-start',
    },
    menuTitle: {
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Tajawal-Bold', // Use app font if available
    },
    surahBadge: {
        display: 'none', // Removed
    },
    surahBadgeText: {
        display: 'none',
    },
    menuDivider: {
        height: 1,
        width: '100%',
        marginVertical: 12,
        opacity: 0.2
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 16,
        borderRadius: 8,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '500',
    },
    textPageContent: {
        paddingVertical: 20,
        paddingHorizontal: width * 0.06, // "Page side padding: 6%"
        paddingBottom: scale(40),
        flexGrow: 1,
        justifyContent: 'center'
    },
    textBlockContainer: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    quranTextParagraph: {
        fontSize: scale(26), // Fallback
        lineHeight: scale(48),
        writingDirection: 'rtl',
        fontFamily: 'Amiri-Regular',
        width: '100%',
        marginBottom: scale(12) // "Vertical margin bottom: 12px"
    },
    surahHeaderWrapper: {
        width: '100%',
        alignItems: 'center',
        // Margins handled in container/basmalah
    },
    surahHeaderContainer: {
        width: '100%',
        height: scale(100), // "Height: 100px"
        marginTop: scale(12), // "Top margin: 12px"
        marginBottom: scale(10), // "Bottom margin: 10px"
        alignItems: 'center',
        justifyContent: 'center'
    },
    surahOrnamentalFrame: {
        width: '100%',
        height: '100%',
        paddingHorizontal: 12,
        borderWidth: 2,
        borderRadius: 12,
        borderColor: '#D4AF37', // Gold
        backgroundColor: 'rgba(212, 175, 55, 0.05)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    surahTitleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    surahTitleText: {
        fontSize: scale(36), // "Font size: 36px"
        fontFamily: 'Amiri-Bold',
        textAlign: 'center',
        marginBottom: 0
    },
    surahSubtitleText: {
        fontSize: scale(16),
        textAlign: 'center',
        opacity: 0.7,
        marginTop: 4
    },
    basmalahText: {
        fontSize: scale(30), // "Font size: 30px"
        fontFamily: 'Amiri-Regular',
        textAlign: 'center',
        marginTop: scale(18), // "Margin top ... 18px"
        marginBottom: scale(16), // "Margin bottom ... 16px"
        width: '100%'
    }
});
