import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface AthkarCategoryCardProps {
    item: {
        id: string;
        title: string;
        arabicTitle: string;
        image: string;
    };
    index: number;
    onPress: () => void;
    theme: any;
}

import { ATHKAR_THEMES } from '@/utils/athkarThemes';

// Visual Theme Map for Categories - REMOVED (Moved to utils)


export const AthkarCategoryCard = ({ item, index, onPress, theme }: AthkarCategoryCardProps) => {
    const scale = useSharedValue(1);

    const themeConfig = ATHKAR_THEMES[item.id] || ATHKAR_THEMES.default;

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.96);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 100).springify().damping(12)}
            style={[styles.container, animatedStyle]}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.touchable}
            >
                <View style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: themeConfig.colors[0] }]}>

                    {/* Gradient Background Layer */}
                    <LinearGradient
                        colors={themeConfig.colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[StyleSheet.absoluteFill, { opacity: 0.15 }]} // Subtle tint
                    />

                    {/* Left Accent Bar */}
                    <LinearGradient
                        colors={themeConfig.colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.accentBar}
                    />

                    <View style={styles.contentContainer}>
                        {/* Icon Box */}
                        <LinearGradient
                            colors={themeConfig.colors}
                            style={styles.iconBox}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name={themeConfig.icon} size={28} color="#FFF" />
                        </LinearGradient>

                        {/* Text Content */}
                        <View style={styles.textContainer}>
                            <Text style={[styles.arabicTitle, { color: theme.text }]}>
                                {item.arabicTitle}
                            </Text>
                            <Text style={[styles.englishTitle, { color: theme.textSecondary }]}>
                                {item.title}
                            </Text>
                        </View>

                        {/* Arrow */}
                        <View style={[styles.arrowBox, { backgroundColor: theme.background }]}>
                            <Ionicons
                                name="chevron-back"
                                size={20}
                                color={theme.textSecondary}
                            />
                        </View>
                    </View>

                    {/* Decorative Circle (Background) */}
                    <View style={[styles.decorativeCircle, { borderColor: themeConfig.colors[0], opacity: 0.1 }]} />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    touchable: {
        width: '100%',
    },
    card: {
        height: 110,
        borderRadius: 24,
        overflow: 'hidden', // Clip accent bar and gradients
        flexDirection: 'row-reverse', // RTL Layout logic by default? Or construct manually. 
        // Using manual construction for better control: Left accent (which is visually right in RTL).
        // Let's stick to flex row reverse if the language is Arabic primary.

        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 6,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
    },
    accentBar: {
        width: 6,
        height: '100%',
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'row-reverse', // Align Arabic Right
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 16
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4
    },
    textContainer: {
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 4
    },
    arabicTitle: {
        fontSize: 20,
        fontFamily: 'Amiri-Bold',
        textAlign: 'right'
    },
    englishTitle: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'right',
        opacity: 0.7
    },
    arrowBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    decorativeCircle: {
        position: 'absolute',
        top: -20,
        left: -20,
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 20,
        zIndex: -1
    }
});
