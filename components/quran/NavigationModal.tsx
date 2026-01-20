import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ARABIC_SURAH_NAMES } from '@/utils/arabicSurahNames';

interface NavigationModalProps {
    visible: boolean;
    onClose: () => void;
    onNavigate: (type: 'page' | 'surah' | 'hizb', value: number) => void;
    theme: any;
}

export const NavigationModal = ({ visible, onClose, onNavigate, theme }: NavigationModalProps) => {
    const [activeTab, setActiveTab] = useState<'page' | 'surah'>('surah');
    const [pageInput, setPageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const surahList = Object.entries(ARABIC_SURAH_NAMES)
        .map(([num, name]) => ({
            number: parseInt(num),
            name
        }))
        .filter(item => item.name.includes(searchQuery));

    const handlePageSubmit = () => {
        const page = parseInt(pageInput);
        if (page >= 1 && page <= 604) {
            onNavigate('page', page);
            onClose();
            setPageInput('');
        }
    };

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'surah' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
                            onPress={() => setActiveTab('surah')}
                        >
                            <Text style={[styles.tabText, { color: theme.text }]}>السورة</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'page' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
                            onPress={() => setActiveTab('page')}
                        >
                            <Text style={[styles.tabText, { color: theme.text }]}>رقم الصفحة</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {activeTab === 'page' && (
                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>أدخل رقم الصفحة (1-604)</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                    keyboardType="number-pad"
                                    value={pageInput}
                                    onChangeText={setPageInput}
                                    placeholder="مثال: 100"
                                    placeholderTextColor={theme.textSecondary}
                                    onSubmitEditing={handlePageSubmit}
                                />
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: theme.primary }]}
                                    onPress={handlePageSubmit}
                                >
                                    <Text style={styles.buttonText}>انتقل</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {activeTab === 'surah' && (
                            <View style={{ flex: 1 }}>
                                <View style={styles.searchContainer}>
                                    <Ionicons name="search" size={20} color={theme.textSecondary} style={{ marginLeft: 8 }} />
                                    <TextInput
                                        style={[styles.searchInput, { color: theme.text }]}
                                        placeholder="ابحث عن اسم السورة..."
                                        placeholderTextColor={theme.textSecondary}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        textAlign="right"
                                    />
                                </View>
                                <FlatList
                                    data={surahList}
                                    keyExtractor={(item) => item.number.toString()}
                                    showsVerticalScrollIndicator={false}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[styles.surahItem, { borderBottomColor: theme.border }]}
                                            onPress={() => {
                                                onNavigate('surah', item.number);
                                                onClose();
                                            }}
                                        >
                                            <Text style={[styles.surahNumber, { color: theme.primary }]}>{item.number}</Text>
                                            <Text style={[styles.surahName, { color: theme.text }]}>{item.name}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        )}
                    </View>

                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    container: {
        width: '90%',
        height: 500, // Increased height for better list view
        borderRadius: 16,
        padding: 16,
        elevation: 5
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    tab: {
        paddingBottom: 8,
        flex: 1,
        alignItems: 'center'
    },
    tabText: {
        fontSize: 16,
        fontFamily: 'Amiri-Bold'
    },
    content: {
        flex: 1
    },
    inputContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        gap: 16
    },
    label: {
        fontSize: 16,
        fontFamily: 'Amiri-Regular'
    },
    input: {
        width: '80%',
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 20
    },
    button: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontFamily: 'Amiri-Bold',
        fontSize: 16
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 12,
        height: 48,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)'
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'Amiri-Regular',
        textAlign: 'right'
    },
    surahItem: {
        flexDirection: 'row-reverse', // Arabic Layout
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    surahName: {
        fontSize: 18,
        fontFamily: 'Amiri-Regular'
    },
    surahNumber: {
        fontSize: 14,
        fontFamily: 'Amiri-Bold'
    }
});
