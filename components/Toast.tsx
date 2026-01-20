import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export interface ToastRef {
    show: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

interface ToastProps {
    position?: 'top' | 'bottom';
}

const Toast = forwardRef<ToastRef, ToastProps>((props, ref) => {
    const { position = 'bottom' } = props;
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'success' | 'error' | 'info' | 'warning'>('success');

    const opacity = useSharedValue(0);
    const translateY = useSharedValue(position === 'bottom' ? 20 : -20);

    const show = useCallback((msg: string, t: 'success' | 'error' | 'info' | 'warning' = 'success') => {
        setMessage(msg);
        setType(t);
        setVisible(true);

        opacity.value = withSpring(1);
        translateY.value = withSpring(0);

        setTimeout(() => {
            opacity.value = withTiming(0, { duration: 300 });
            translateY.value = withTiming(position === 'bottom' ? 20 : -20, { duration: 300 }, (finished) => {
                if (finished) runOnJS(setVisible)(false);
            });
        }, 2500);
    }, [position]);

    useImperativeHandle(ref, () => ({
        show
    }));

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }]
    }));

    if (!visible) return null;

    // Color configurations for each type
    const config = {
        success: {
            colors: ['#059669', '#10B981'] as const,
            icon: 'checkmark-circle' as const,
        },
        error: {
            colors: ['#DC2626', '#EF4444'] as const,
            icon: 'close-circle' as const,
        },
        info: {
            colors: ['#2563EB', '#3B82F6'] as const,
            icon: 'information-circle' as const,
        },
        warning: {
            colors: ['#D97706', '#F59E0B'] as const,
            icon: 'warning' as const,
        }
    };

    const { colors, icon } = config[type];

    return (
        <Animated.View
            style={[
                styles.container,
                position === 'top' ? styles.topPosition : styles.bottomPosition,
                animatedStyle
            ]}
        >
            <LinearGradient
                colors={colors}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            />
            <Ionicons name={icon} size={22} color="#fff" />
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
        gap: 10,
        zIndex: 9999,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
        minWidth: 180,
    },
    topPosition: {
        top: Platform.OS === 'ios' ? 60 : 40,
    },
    bottomPosition: {
        bottom: 40,
    },
    text: {
        color: '#fff',
        fontFamily: 'Tajawal-Bold',
        fontSize: 15,
    },
});

export default Toast;
