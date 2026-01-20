import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface ScalePressableProps extends PressableProps {
    scaleTo?: number;
    style?: StyleProp<ViewStyle>;
    activeOpacity?: number; // Kept for API compatibility, though we use scale mainly
}

export function ScalePressable({
    children,
    style,
    scaleTo = 0.95,
    onPressIn,
    onPressOut,
    onPress,
    ...props
}: ScalePressableProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = (event: any) => {
        scale.value = withSpring(scaleTo, { damping: 10, stiffness: 300 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPressIn?.(event);
    };

    const handlePressOut = (event: any) => {
        scale.value = withSpring(1, { damping: 10, stiffness: 300 });
        onPressOut?.(event);
    };

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            {...props}
        >
            <Animated.View style={[style, animatedStyle]}>
                {typeof children === 'function'
                    ? children({ pressed: false } as any)
                    : children
                }
            </Animated.View>
        </Pressable>
    );
}
