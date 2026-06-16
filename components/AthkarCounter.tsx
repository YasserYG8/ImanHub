import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
    interpolateColor
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface AthkarCounterProps {
    targetCount: number;
}

export function AthkarCounter({ targetCount }: AthkarCounterProps) {
    const [count, setCount] = useState(0);
    const scale = useSharedValue(1);
    const progress = useSharedValue(0);

    const isComplete = count >= targetCount;

    useEffect(() => {
        progress.set(withTiming(count / targetCount, { duration: 300 }));
    }, [count, targetCount]);

    const handlePress = () => {
        if (count < targetCount) {
            setCount(c => c + 1);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            // Pulse Animation
            scale.set(withSequence(
                withSpring(0.9),
                withSpring(1)
            ));

            if (count + 1 === targetCount) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } else {
            // Already done feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
    };

    const handleReset = () => {
        setCount(0);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        progress.set(withTiming(0));
    };

    const animatedButtonStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.get() }],
        };
    });

    return (
        <View style={styles.container}>
            {/* Main Circular Button */}
            <Animated.View style={[animatedButtonStyle]}>
                <Pressable
                    onPress={handlePress}
                    style={({ pressed }) => [
                        { opacity: pressed ? 0.9 : 1 }
                    ]}
                >
                    <LinearGradient
                        colors={isComplete ? ['#10B981', '#059669'] : ['#F59E0B', '#D97706']}
                        style={styles.counterButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {isComplete ? (
                            <Ionicons name="checkmark-circle" size={64} color="#FFF" />
                        ) : (
                            <View style={styles.countContent}>
                                <Text style={styles.countText}>{count}</Text>
                                <View style={styles.targetContainer}>
                                    <Text style={styles.targetLabel}>Min</Text>
                                    <Text style={styles.targetText}>{targetCount}</Text>
                                </View>
                            </View>
                        )}
                    </LinearGradient>
                </Pressable>
            </Animated.View>

            {/* Reset / Controls */}
            <View style={styles.controls}>
                <Pressable 
                    onPress={handleReset} 
                    style={({ pressed }) => [
                        styles.resetButton,
                        { opacity: pressed ? 0.7 : 1 }
                    ]}
                >
                    <Ionicons name="refresh" size={20} color="#666" />
                    <Text style={styles.resetText}>إعادة</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 12
    },
    counterButton: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    countContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    countText: {
        fontSize: 56,
        fontFamily: 'Amiri-Bold', // Use app font
        color: '#fff',
        lineHeight: 70,
        marginBottom: -5
    },
    targetContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 2,
        borderRadius: 12
    },
    targetLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600'
    },
    targetText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: 'bold'
    },
    controls: {
        marginTop: 20,
        flexDirection: 'row',
        gap: 20
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 20
    },
    resetText: {
        color: '#666',
        fontSize: 14,
        fontFamily: 'Amiri-Bold'
    },
});
