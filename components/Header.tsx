import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useThemeColor';
import { ScalePressable } from './ui/ScalePressable';

interface HeaderProps {
    title?: string;
    showBackButton?: boolean;
    transparent?: boolean;
    backButtonSide?: 'left' | 'right';
    onBack?: () => void;
}

export function Header({ title, showBackButton = true, transparent = false, backButtonSide = 'right', onBack }: HeaderProps) {
    const router = useRouter();
    const theme = useTheme();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    return (
        <View style={[
            styles.container,
            !transparent && { backgroundColor: theme.background, borderBottomWidth: 1, borderBottomColor: theme.border }
        ]}>
            <SafeAreaView>
                <View style={[styles.headerContent, { flexDirection: backButtonSide === 'left' ? 'row' : 'row-reverse' }]}>
                    {showBackButton && (
                        <ScalePressable
                            onPress={handleBack}
                            style={[styles.backButton, { backgroundColor: theme.cardBackground }]}
                        >
                            <Ionicons name={backButtonSide === 'left' ? "arrow-back" : "arrow-forward"} size={24} color={theme.text} />
                        </ScalePressable>
                    )}

                    {/* Centered Title */}
                    {title && (
                        <View style={styles.titleContainer}>
                            <Text
                                style={[styles.title, { color: theme.text }]}
                                numberOfLines={1}
                            >
                                {title}
                            </Text>
                        </View>
                    )}

                    {/* Placeholder to balance flex layout if needed, but absolute positioning is better for true center */}
                    {showBackButton && <View style={{ width: 40 }} />}
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        zIndex: 10,
    },
    headerContent: {
        height: 56,
        alignItems: 'center',
        paddingHorizontal: 16,
        justifyContent: 'space-between', // Ensure spacing if needed, but row-reverse with children will place them Right->Left
    },
    titleContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 50,
        right: 50,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: -1, // Behind buttons
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
});
