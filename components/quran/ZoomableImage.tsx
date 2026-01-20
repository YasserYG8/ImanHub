import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';

interface ZoomableImageProps {
    source: any;
    style?: any;
    resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
    tintColor?: string;
}

export const ZoomableImage = ({ source, style, resizeMode = 'contain', tintColor }: ZoomableImageProps) => {
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    const pinch = Gesture.Pinch()
        .onUpdate((event) => {
            scale.value = savedScale.value * event.scale;
        })
        .onEnd(() => {
            if (scale.value < 1) {
                scale.value = withSpring(1);
                savedScale.value = 1;
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
            } else {
                savedScale.value = scale.value;
            }
        });

    const pan = Gesture.Pan()
        .averageTouches(true) // Should allow to pan while pinching or with 2 fingers
        .onUpdate((event) => {
            if (scale.value > 1) {
                translateX.value = savedTranslateX.value + event.translationX;
                translateY.value = savedTranslateY.value + event.translationY;
            }
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    const composed = Gesture.Simultaneous(pinch, pan);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value }
        ],
    }));

    // Logic:
    // 1. Root View fills the container (flex:1).
    // 2. Animated.Image applies transforms.
    // 3. Image is rendered directly as Animated.Image to avoid layout complexity.
    // Passing styles safely.

    return (
        <GestureDetector gesture={composed}>
            <View style={{ flex: 1, overflow: 'hidden' }}>
                <Animated.Image
                    source={source}
                    style={[
                        style,
                        { width: '100%', height: '100%' }, // Force dimensions
                        animatedStyle,
                        { tintColor }
                    ]}
                    resizeMode={resizeMode}
                />
            </View>
        </GestureDetector>
    );
};
