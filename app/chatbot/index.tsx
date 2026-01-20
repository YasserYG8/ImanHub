import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useThemeColor';
import { Message, ChatThread } from '@/types/chat';
import { sendMessageToAI, getWelcomeMessage, generateChatTitle } from '@/utils/aiService';
import { Header } from '../../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Share } from 'react-native';
import Toast, { ToastRef } from '../../components/Toast';
import { BlurView } from 'expo-blur';
import Animated, {
    FadeInRight,
    FadeInLeft,
    ZoomIn,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    runOnJS
} from 'react-native-reanimated';
import { useThemeContext } from '@/context/ThemeContext';

const THREADS_STORAGE_KEY = '@chatbot_threads_v2';
const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

interface MessageItemProps {
    item: Message;
    theme: any;
    showMessageActionMenu: (item: Message, x: number, y: number, width: number, height: number) => void;
}

const MessageItem = ({ item, theme, showMessageActionMenu }: MessageItemProps) => {
    const isUser = item.sender === 'user';
    const bubbleRef = useRef<any>(null);

    const onLongPress = () => {
        bubbleRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
            showMessageActionMenu(item, x, y, width, height);
        });
    };

    return (
        <Animated.View
            entering={isUser ? FadeInRight.delay(100) : FadeInLeft.delay(100)}
            style={[
                styles.messageContainer,
                isUser ? styles.userMessageContainer : styles.aiMessageContainer
            ]}
        >
            {!isUser && (
                <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
                    <Ionicons name="sparkles" size={16} color={theme.primary} />
                </View>
            )}
            <TouchableOpacity
                ref={bubbleRef}
                activeOpacity={0.9}
                onLongPress={onLongPress}
                style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : [styles.aiBubble, { backgroundColor: theme.cardBackground + 'CC', borderColor: theme.border }]
                ]}
            >
                {isUser ? (
                    <LinearGradient
                        colors={['#10B981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.bubbleGradient}
                    >
                        <Text style={styles.userMessageText}>{item.text}</Text>
                    </LinearGradient>
                ) : (
                    <Text style={[styles.aiMessageText, { color: theme.text }]}>{item.text}</Text>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function ChatbotScreen() {
    const theme = useTheme();
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);
    const insets = useSafeAreaInsets();


    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [selectedMessageLayout, setSelectedMessageLayout] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

    const sidebarOffset = useSharedValue(SIDEBAR_WIDTH);
    const toastRef = useRef<ToastRef>(null);
    const overlayOpacity = useSharedValue(0);
    const menuScale = useSharedValue(0);
    const bubbleScale = useSharedValue(1);

    // Sidebar animation
    useEffect(() => {
        sidebarOffset.value = withTiming(isSidebarOpen ? 0 : SIDEBAR_WIDTH, {
            duration: 200,
        });
    }, [isSidebarOpen]);

    const sidebarStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: sidebarOffset.value }]
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: interpolate(sidebarOffset.value, [SIDEBAR_WIDTH, 0], [0, 0.5]),
        display: sidebarOffset.value === SIDEBAR_WIDTH ? 'none' : 'flex'
    }));

    // Load all threads on mount
    useEffect(() => {
        loadThreads();
    }, []);

    const loadThreads = async () => {
        try {
            const stored = await AsyncStorage.getItem(THREADS_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Filter out empty threads (only welcome message) during load
                const loadedThreads = parsed
                    .map((t: any) => ({
                        ...t,
                        createdAt: new Date(t.createdAt),
                        updatedAt: new Date(t.updatedAt),
                        messages: t.messages.map((m: any) => ({
                            ...m,
                            timestamp: new Date(m.timestamp)
                        }))
                    }))
                    .filter((t: ChatThread) => t.messages.length > 1);

                setThreads(loadedThreads);
                if (loadedThreads.length > 0) {
                    setCurrentThreadId(loadedThreads[0].id);
                } else {
                    createNewThread();
                }
            } else {
                createNewThread();
            }
        } catch (error) {
            console.error('Error loading threads:', error);
        }
    };

    const saveThreads = async (updatedThreads: ChatThread[]) => {
        try {
            await AsyncStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(updatedThreads));
        } catch (error) {
            console.error('Error saving threads:', error);
        }
    };

    const createNewThread = () => {
        // If current thread is empty (only has welcome message), just close sidebar
        if (currentThread && currentThread.messages.length <= 1) {
            setIsSidebarOpen(false);
            return;
        }

        const newThread: ChatThread = {
            id: Date.now().toString(),
            title: 'محادثة جديدة',
            messages: [{
                id: (Date.now() + 1).toString(),
                text: getWelcomeMessage(),
                sender: 'ai',
                timestamp: new Date()
            }],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        // Don't save to storage yet, only set in state
        const updatedThreads = [newThread, ...threads];
        setThreads(updatedThreads);
        setCurrentThreadId(newThread.id);
        // saveThreads(updatedThreads); // Removed: Only save when user sends a message
        setIsSidebarOpen(false);
    };

    const currentThread = useMemo(() =>
        threads.find(t => t.id === currentThreadId),
        [threads, currentThreadId]);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading || !currentThreadId) return;

        const userMsgText = inputText.trim();
        const userMessage: Message = {
            id: Date.now().toString(),
            text: userMsgText,
            sender: 'user',
            timestamp: new Date()
        };

        let activeContext: { role: 'user' | 'assistant', content: string }[] = [];

        // Update threads with user message and prepare context
        setThreads(prev => {
            const updated = prev.map(t => {
                if (t.id === currentThreadId) {
                    const firstUserMsg = t.messages.find(m => m.sender === 'user');
                    const newTitle = !firstUserMsg ? userMsgText.slice(0, 30) + (userMsgText.length > 30 ? '...' : '') : t.title;

                    const newMessages = [...t.messages, userMessage];

                    // Extract context for AI from these specific new messages
                    activeContext = newMessages.slice(-20).map(m => ({
                        role: m.sender === 'ai' ? 'assistant' : 'user',
                        content: m.text
                    }));

                    return {
                        ...t,
                        title: newTitle,
                        messages: newMessages,
                        updatedAt: new Date()
                    };
                }
                return t;
            });
            saveThreads(updated); // Save to storage now that we have a user message
            return updated;
        });

        setInputText('');
        setIsLoading(true);

        try {
            const aiResponse = await sendMessageToAI(activeContext);
            const aiMessage: Message = {
                id: (Date.now() + 2).toString(),
                text: aiResponse,
                sender: 'ai',
                timestamp: new Date()
            };

            setThreads(prev => {
                const final = prev.map(t => {
                    if (t.id === currentThreadId) {
                        return {
                            ...t,
                            messages: [...t.messages, aiMessage],
                            updatedAt: new Date()
                        };
                    }
                    return t;
                });
                return final as ChatThread[];
            });

            // Generate a better summary title after the first exchange
            if (activeContext.length <= 2) {
                const fullContext = activeContext.map(c => ({
                    role: c.role as 'user' | 'assistant',
                    content: c.content
                }));
                fullContext.push({ role: 'assistant', content: aiResponse });

                const summaryTitle = await generateChatTitle(fullContext);
                setThreads(prev => prev.map(t =>
                    t.id === currentThreadId ? { ...t, title: summaryTitle } : t
                ));
            }
        } catch (error) {
            console.error('Error getting AI response:', error);
            const errorMessage: Message = {
                id: (Date.now() + 3).toString(),
                text: 'عذراً، حدث خطأ في الاتصال.',
                sender: 'ai',
                timestamp: new Date()
            };
            setThreads(prev => prev.map(t =>
                t.id === currentThreadId ? { ...t, messages: [...t.messages, errorMessage] } : t
            ));
        } finally {
            setIsLoading(true); // Keeping loading state briefly to ensure UI sync
            setTimeout(() => setIsLoading(false), 300);
        }
    };

    const handleCopy = async (text: string) => {
        await Clipboard.setStringAsync(text);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toastRef.current?.show('تم النسخ بنجاح', 'success');
    };

    const handleShare = async (text: string) => {
        // Close overlay IMMEDIATELY and SYNCHRONOUSLY to prevent any possibility of blocking
        setSelectedMessage(null);
        setSelectedMessageLayout(null);
        bubbleScale.value = 1;
        menuScale.value = 0;
        overlayOpacity.value = 0;

        // Tiny delay just to ensure the Modal unmounts before the heavy system sheet takes over
        setTimeout(async () => {
            try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await Share.share({ message: text });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        }, 60);
    };

    const handleCopyAction = (text: string) => {
        setCloseOverlay();
        handleCopy(text);
    };

    const setCloseOverlay = () => {
        // High-speed solid transitions (No trembling)
        bubbleScale.value = withTiming(1, { duration: 150 });
        menuScale.value = withTiming(0, { duration: 150 });

        overlayOpacity.value = withTiming(0, { duration: 150 }, () => {
            runOnJS(setSelectedMessage)(null);
            runOnJS(setSelectedMessageLayout)(null);
        });

        // Safety timeout
        setTimeout(() => {
            if (selectedMessage) {
                setSelectedMessage(null);
                setSelectedMessageLayout(null);
            }
        }, 400);
    };

    const showMessageActionMenu = (item: Message, x: number, y: number, width: number, height: number) => {
        // Multi-stage haptics for "Senior Dev" feel
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        setSelectedMessage(item);
        setSelectedMessageLayout({ x, y, width, height });

        // Fast Solid Lift & Fade
        overlayOpacity.value = withTiming(1, { duration: 150 });
        bubbleScale.value = withTiming(1.05, { duration: 150 });
        menuScale.value = withTiming(1, { duration: 150 });

        // Small delay for menu haptic to make it feel like it "popped" out
        setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 100);
    };

    const overlayAnimatedStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value,
    }));

    const menuAnimatedStyle = useAnimatedStyle(() => ({
        opacity: menuScale.value,
        transform: [
            { scale: interpolate(menuScale.value, [0, 1], [0.8, 1]) },
            { translateY: interpolate(menuScale.value, [0, 1], [10, 0]) }
        ]
    }));

    const bubbleAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: bubbleScale.value }
        ],
        shadowOpacity: interpolate(bubbleScale.value, [1, 1.05], [0, 0.3]),
    }));

    const { isDark } = useThemeContext();

    const deleteThread = (id: string) => {
        const updated = threads.filter(t => t.id !== id);
        setThreads(updated);
        saveThreads(updated);
        if (currentThreadId === id) {
            if (updated.length > 0) setCurrentThreadId(updated[0].id);
            else createNewThread();
        }
    };


    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient colors={[theme.primary + '10', 'transparent', theme.primary + '05']} style={StyleSheet.absoluteFill} />

            <Header
                title={currentThread?.title || "المساعد الإسلامي"}
                showBackButton={true}
                backButtonSide="left"
            />

            {/* Sidebar Toggle Button */}
            <TouchableOpacity
                style={[styles.sidebarToggle, { top: Platform.OS === 'ios' ? 60 : 18 }]}
                onPress={() => setIsSidebarOpen(true)}
            >
                <Ionicons name="menu" size={26} color={theme.text} />
            </TouchableOpacity>



            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                <View style={styles.flex}>
                    <FlatList
                        ref={flatListRef}
                        style={styles.flex}
                        data={currentThread?.messages || []}
                        renderItem={({ item }) => (
                            <MessageItem
                                item={item}
                                theme={theme}
                                showMessageActionMenu={showMessageActionMenu}
                            />
                        )}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.messagesList}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                        onLayout={() => flatListRef.current?.scrollToEnd()}
                        showsVerticalScrollIndicator={false}
                    />

                    {isLoading && (
                        <Animated.View entering={ZoomIn} style={styles.loadingContainer}>
                            <View style={[styles.loadingBubble, { backgroundColor: theme.cardBackground + 'CC', borderColor: theme.border }]}>
                                <ActivityIndicator size="small" color={theme.primary} />
                                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>جاري التفكير...</Text>
                            </View>
                        </Animated.View>
                    )}

                    <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                        <View style={[styles.inputWrapper, { backgroundColor: theme.cardBackground + 'EE', borderColor: theme.border }]}>
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                placeholder="طالب العلم يسأل..."
                                placeholderTextColor={theme.textSecondary}
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                                maxLength={1000}
                                textAlign="right"
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                onPress={handleSend}
                                style={[styles.sendButton, { backgroundColor: inputText.trim() ? theme.primary : theme.textSecondary + '40' }]}
                                disabled={!inputText.trim() || isLoading}
                            >
                                <Ionicons
                                    name="arrow-up"
                                    size={24}
                                    color={inputText.trim() ? '#fff' : theme.textSecondary + '80'}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>

            <Toast ref={toastRef} />

            {/* WhatsApp Style Overlay */}
            <Modal
                transparent
                visible={!!selectedMessage && !!selectedMessageLayout}
                animationType="none"
                onRequestClose={setCloseOverlay}
            >
                <Pressable style={styles.flex} onPress={setCloseOverlay}>
                    <Animated.View style={[StyleSheet.absoluteFill, overlayAnimatedStyle]}>
                        <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                    </Animated.View>

                    {selectedMessage && selectedMessageLayout && (
                        <View style={StyleSheet.absoluteFill}>
                            {/* Cloned Highlighted Bubble with Lift Effect */}
                            <Animated.View
                                style={[{
                                    position: 'absolute',
                                    left: selectedMessageLayout.x,
                                    top: selectedMessageLayout.y,
                                    width: selectedMessageLayout.width, // Explicit width matches original
                                    height: selectedMessageLayout.height,
                                    zIndex: 1000,
                                }, bubbleAnimatedStyle]}
                            >
                                <View style={[
                                    styles.messageBubble,
                                    selectedMessage.sender === 'user' ? styles.userBubble : [styles.aiBubble, { backgroundColor: theme.cardBackground, borderColor: theme.border }],
                                    { width: '100%' } // Ensure inner bubble fills the animated container
                                ]}>
                                    {selectedMessage.sender === 'user' ? (
                                        <LinearGradient
                                            colors={['#10B981', '#059669']}
                                            style={styles.bubbleGradient}
                                        >
                                            <Text style={styles.userMessageText}>{selectedMessage.text}</Text>
                                        </LinearGradient>
                                    ) : (
                                        <Text style={[styles.aiMessageText, { color: theme.text }]}>{selectedMessage.text}</Text>
                                    )}
                                </View>
                            </Animated.View>

                            {/* Options Menu */}
                            <Animated.View style={[
                                styles.whatsappMenu,
                                {
                                    top: selectedMessageLayout.y + selectedMessageLayout.height + 8,
                                    left: (() => {
                                        const menuWidth = 160;
                                        let pos = selectedMessage.sender === 'user'
                                            ? selectedMessageLayout.x + selectedMessageLayout.width - menuWidth
                                            : selectedMessageLayout.x;

                                        if (pos + menuWidth > width - 16) pos = width - menuWidth - 16;
                                        if (pos < 16) pos = 16;

                                        return pos;
                                    })(),
                                    backgroundColor: theme.cardBackground,
                                    borderColor: theme.border,
                                },
                                menuAnimatedStyle
                            ]}>
                                <TouchableOpacity
                                    style={styles.whatsappMenuItem}
                                    onPress={() => handleCopyAction(selectedMessage.text)}
                                >
                                    <Ionicons name="copy-outline" size={18} color={theme.text} />
                                    <Text style={[styles.whatsappMenuText, { color: theme.text }]}>نسخ</Text>
                                </TouchableOpacity>
                                <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
                                <TouchableOpacity
                                    style={styles.whatsappMenuItem}
                                    onPress={() => handleShare(selectedMessage.text)}
                                >
                                    <Ionicons name="share-outline" size={18} color={theme.text} />
                                    <Text style={[styles.whatsappMenuText, { color: theme.text }]}>مشاركة</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    )}
                </Pressable>
            </Modal>
            <Pressable
                style={[StyleSheet.absoluteFill, styles.backdrop]}
                onPress={() => setIsSidebarOpen(false)}
                pointerEvents={isSidebarOpen ? 'auto' : 'none'}
            >
                <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, backdropStyle]} />
            </Pressable>

            {/* Sidebar Panel */}
            <Animated.View
                style={[styles.sidebar, { backgroundColor: theme.background }, sidebarStyle]}
                pointerEvents={isSidebarOpen ? 'auto' : 'none'}
            >
                <SafeAreaView style={styles.flex}>
                    <View style={styles.sidebarHeader}>
                        <Text style={[styles.sidebarTitle, { color: theme.text }]}>تاريخ المحادثات</Text>
                        <TouchableOpacity onPress={() => setIsSidebarOpen(false)}>
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.newChatButton, { backgroundColor: theme.primary + '20' }]}
                        onPress={createNewThread}
                    >
                        <Ionicons name="add" size={20} color={theme.primary} />
                        <Text style={[styles.newChatText, { color: theme.primary }]}>محادثة جديدة</Text>
                    </TouchableOpacity>

                    <FlatList
                        data={threads}
                        keyExtractor={item => item.id}
                        renderItem={({ item, index }) => (
                            <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
                                <View style={styles.threadItemWrapper}>
                                    <TouchableOpacity
                                        style={[
                                            styles.threadItem,
                                            item.id === currentThreadId
                                                ? { backgroundColor: theme.primary, shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }
                                                : { backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.border }
                                        ]}
                                        onPress={() => {
                                            setCurrentThreadId(item.id);
                                            setIsSidebarOpen(false);
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                                            <Ionicons
                                                name={item.id === currentThreadId ? "chatbubble" : "chatbubble-outline"}
                                                size={18}
                                                color={item.id === currentThreadId ? '#fff' : theme.textSecondary}
                                            />
                                            <Text
                                                style={[
                                                    styles.threadText,
                                                    { color: item.id === currentThreadId ? '#fff' : theme.text }
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {item.title}
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            style={[
                                                styles.deleteButton,
                                                { backgroundColor: item.id === currentThreadId ? 'rgba(255,255,255,0.2)' : 'transparent' }
                                            ]}
                                            onPress={() => deleteThread(item.id)}
                                        >
                                            <Ionicons
                                                name="trash-outline"
                                                size={16}
                                                color={item.id === currentThreadId ? '#fff' : theme.textSecondary}
                                            />
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        )}
                        contentContainerStyle={styles.threadList}
                        showsVerticalScrollIndicator={false}
                    />
                </SafeAreaView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
    sidebarToggle: {
        position: 'absolute',
        right: 16, // Standard margin
        top: Platform.OS === 'ios' ? 60 : 16, // Aligned vertically with header content
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    messagesList: { padding: 20, paddingBottom: 20 },
    messageContainer: { marginBottom: 16, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    userMessageContainer: { justifyContent: 'flex-end' },
    aiMessageContainer: { justifyContent: 'flex-start' },
    avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    messageBubble: { maxWidth: width * 0.75, borderRadius: 20, overflow: 'hidden' },
    userBubble: { borderBottomRightRadius: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    aiBubble: { borderBottomLeftRadius: 4, borderWidth: 1 },
    bubbleGradient: { padding: 12, paddingHorizontal: 16 },
    userMessageText: { color: '#fff', fontSize: 16, lineHeight: 24, textAlign: 'right' },
    aiMessageText: { padding: 12, paddingHorizontal: 16, fontSize: 16, lineHeight: 24, textAlign: 'right' },
    loadingContainer: { marginBottom: 10, alignSelf: 'center' },
    loadingBubble: { flexDirection: 'row', alignItems: 'center', padding: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, gap: 8 },
    loadingText: { fontSize: 14, fontWeight: '500' },
    inputArea: { padding: 16, paddingBottom: 25 },
    inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', padding: 8, paddingLeft: 8, borderRadius: 30, borderWidth: 1, gap: 8 },
    input: { flex: 1, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, maxHeight: 120, textAlignVertical: 'center' },
    sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    sidebar: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0, // Switched from left to right
        width: SIDEBAR_WIDTH,
        zIndex: 1000,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: -4, height: 0 }, // Shadow on the left now
        shadowOpacity: 0.2,
        shadowRadius: 10,
        paddingTop: Platform.OS === 'ios' ? 0 : 25,
    },
    sidebarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    sidebarTitle: { fontSize: 18, fontWeight: 'bold' },
    newChatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 16,
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    newChatText: { fontWeight: '600', fontSize: 15 },
    threadList: { paddingHorizontal: 12 },
    threadItemWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    threadItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        gap: 10,
    },
    threadText: { fontSize: 14, fontWeight: '500' },
    deleteButton: { padding: 10 },
    backdrop: { zIndex: 999 },
    toast: {
        position: 'absolute',
        top: 100,
        left: 20,
        right: 20,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 16,
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
        zIndex: 5000,
    },
    toastText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    whatsappMenu: {
        position: 'absolute',
        width: 160,
        flexDirection: 'row',
        borderRadius: 14,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 15,
    },
    whatsappMenuItem: {
        flex: 1,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        gap: 6,
    },
    whatsappMenuText: {
        fontSize: 14,
        fontWeight: '600',
    },
    menuDivider: {
        width: 1,
        height: '60%',
        alignSelf: 'center',
        opacity: 0.5,
    }
});
