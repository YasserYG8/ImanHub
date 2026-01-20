import { View, Text, StyleSheet, FlatList, TouchableOpacity, Share } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useThemeColor';
import { Header } from '../../components/Header';
import Toast, { ToastRef } from '../../components/Toast';
import DUAA_DATA from '../../assets/data/duaa_data.json';
import CATEGORIES from '../../assets/data/duaa_categories.json';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';

export default function DuaaListScreen() {
    const { category } = useLocalSearchParams();
    const theme = useTheme();
    const toastRef = useRef<ToastRef>(null);

    const categoryData = CATEGORIES.find(c => c.id === category);
    const duaaList = (DUAA_DATA as any)[category as string] || [];

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toastRef.current?.show('تم النسخ بنجاح', 'success');
    };

    const onShare = async (text: string) => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await Share.share({ message: text });
        } catch (error) {
            console.log(error);
        }
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100)}>
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                <View style={styles.cardHeader}>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            onPress={() => onShare(`${item.arabic}\n\n${item.translation}`)}
                            style={[styles.actionButton, { backgroundColor: theme.primary + '10' }]}
                        >
                            <Ionicons name="share-outline" size={20} color={theme.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => copyToClipboard(item.arabic)}
                            style={[styles.actionButton, { backgroundColor: theme.primary + '10' }]}
                        >
                            <Ionicons name="copy-outline" size={20} color={theme.primary} />
                        </TouchableOpacity>
                    </View>
                    {item.reference && (
                        <View style={styles.referenceBadge}>
                            <Text style={[styles.referenceText, { color: theme.textSecondary }]}>{item.reference}</Text>
                        </View>
                    )}
                </View>

                <Text style={[styles.arabicText, { color: theme.text }]}>{item.arabic}</Text>

                <View style={[styles.divider, { backgroundColor: theme.border, opacity: 0.3 }]} />

                <Text style={[styles.translationText, { color: theme.textSecondary }]}>{item.translation}</Text>
            </View>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title={categoryData?.arabicTitle || 'الأدعية'} />
            <FlatList
                data={duaaList}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="documents-outline" size={64} color={theme.textSecondary} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>قريباً إن شاء الله</Text>
                    </View>
                }
            />

            <Toast ref={toastRef} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    list: {
        padding: 20,
    },
    card: {
        padding: 24,
        borderRadius: 28,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    referenceBadge: {
        backgroundColor: 'rgba(0,0,0,0.03)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    referenceText: {
        fontSize: 12,
        fontWeight: '600',
    },
    arabicText: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'right',
        lineHeight: 38,
        marginBottom: 16,
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 16,
    },
    translationText: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'right',
        opacity: 0.8,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        gap: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
    },
});
