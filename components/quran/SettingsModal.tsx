import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    useArabicNumbers: boolean;
    onToggleNumbers: (val: boolean) => void;
    theme: any;
}

export const SettingsModal = ({ visible, onClose, useArabicNumbers, onToggleNumbers, theme }: SettingsModalProps) => {
    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
                    <Text style={[styles.title, { color: theme.text }]}>الإعدادات</Text>

                    <View style={{ marginBottom: 20 }}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>أرقام الصفحات</Text>

                        <TouchableOpacity
                            style={[styles.radioRow, { borderColor: useArabicNumbers ? theme.primary : theme.border }]}
                            onPress={() => onToggleNumbers(true)}
                        >
                            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
                                <Ionicons
                                    name={useArabicNumbers ? "radio-button-on" : "radio-button-off"}
                                    size={24}
                                    color={useArabicNumbers ? theme.primary : theme.textSecondary}
                                />
                                <Text style={[styles.radioLabel, { color: theme.text }]}>أرقام عربية (١٢٣)</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.radioRow, { marginTop: 10, borderColor: !useArabicNumbers ? theme.primary : theme.border }]}
                            onPress={() => onToggleNumbers(false)}
                        >
                            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
                                <Ionicons
                                    name={!useArabicNumbers ? "radio-button-on" : "radio-button-off"}
                                    size={24}
                                    color={!useArabicNumbers ? theme.primary : theme.textSecondary}
                                />
                                <Text style={[styles.radioLabel, { color: theme.text }]}>أرقام إنجليزية (123)</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Future: Riwayah Selector */}
                    <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
                        <View>
                            <Text style={[styles.settingLabel, { color: theme.text }]}>الرواية (قريباً)</Text>
                            <Text style={[styles.settingSubLabel, { color: theme.textSecondary }]}>حفص عن عاصم</Text>
                        </View>
                        <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
                    </View>

                    <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.primary }]} onPress={onClose}>
                        <Text style={styles.closeButtonText}>إغلاق</Text>
                    </TouchableOpacity>
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
        width: '85%',
        borderRadius: 16,
        padding: 20,
        elevation: 5
    },
    title: {
        fontSize: 20,
        fontFamily: 'Amiri-Bold',
        marginBottom: 20,
        textAlign: 'center'
    },
    settingRow: {
        flexDirection: 'row-reverse', // Arabic Layout
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth
    },
    settingLabel: {
        fontSize: 16,
        fontFamily: 'Amiri-Bold',
        textAlign: 'right'
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Amiri-Bold',
        textAlign: 'right',
        marginBottom: 10
    },
    radioRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'space-between'
    },
    radioLabel: {
        fontSize: 16,
        fontFamily: 'Amiri-Regular',
        textAlign: 'right'
    },
    settingSubLabel: {
        fontSize: 12,
        fontFamily: 'Amiri-Regular',
        textAlign: 'right',
        marginTop: 4
    },
    closeButton: {
        marginTop: 20,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    closeButtonText: {
        color: '#fff',
        fontFamily: 'Amiri-Bold',
        fontSize: 16
    }
});
