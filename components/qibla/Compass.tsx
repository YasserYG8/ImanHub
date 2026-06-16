import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    ZoomIn,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useThemeColor';
import Svg, { Circle, Line, Text as SvgText, Path, Polygon, Rect, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = width * 0.8;
const CENTER = 50;
const RADIUS = 46;

interface CompassProps {
    qiblaBearing: number;
    onAlignChange?: (isAligned: boolean) => void;
}

// SVG Kaaba Component (3D isometric style - no center line gap)
const KaabaSvg = ({ isAligned }: { isAligned: boolean }) => (
    <Svg width={56} height={60} viewBox="-2 0 52 56">
        {/* Outer stroke - one unified shape */}
        <Path
            d="M0,18 L24,3 L48,18 L48,39 L24,44 L0,39 Z"
            fill="none"
            stroke={isAligned ? "#10B981" : "#555"}
            strokeWidth="4"
            strokeLinejoin="round"
        />
        {/* Left face (darker) - no stroke */}
        <Polygon points="0,18 24,3 24,44 0,39" fill="#1a1a1a" />
        {/* Right face (lighter) - no stroke */}
        <Polygon points="24,3 48,18 48,39 24,44" fill="#2a2a2a" />
        {/* Gold band left */}
        <Polygon points="0,22 24,12 24,18 0,28" fill="#D4AF37" />
        {/* Gold band right */}
        <Polygon points="24,12 48,22 48,28 24,18" fill="#E5C254" />
        {/* Gold door on right face */}
        <Polygon points="30,24 42,28 42,38 30,40" fill="#E5C254" />
    </Svg>
);

export const Compass = ({ qiblaBearing, onAlignChange }: CompassProps) => {
    const theme = useTheme();
    const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
    const [heading, setHeading] = useState(0);
    const [isAligned, setIsAligned] = useState(false);

    const rotateValue = useSharedValue(0);
    const kaabaRotateValue = useSharedValue(0);
    const hasVibratedRef = useRef(false);

    const _subscribe = async () => {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const sub = await Location.watchHeadingAsync((data) => {
            const h = data.trueHeading >= 0 ? data.trueHeading : data.magHeading;
            setHeading(h);
        });
        subscriptionRef.current = sub;
    };

    const _unsubscribe = () => {
        if (subscriptionRef.current) {
            subscriptionRef.current.remove();
            subscriptionRef.current = null;
        }
    };

    useEffect(() => {
        _subscribe();
        return () => _unsubscribe();
    }, []);

    useEffect(() => {
        const currentRotation = rotateValue.get();
        const targetRotation = -heading;

        let diff = targetRotation - currentRotation;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;

        rotateValue.set(withSpring(currentRotation + diff, {
            damping: 80,
            stiffness: 60,
            mass: 2,
        }));

        const kaabaAngle = qiblaBearing - heading;
        let kaabaDiff = kaabaAngle - kaabaRotateValue.get();
        while (kaabaDiff > 180) kaabaDiff -= 360;
        while (kaabaDiff < -180) kaabaDiff += 360;

        kaabaRotateValue.set(withSpring(kaabaRotateValue.get() + kaabaDiff, {
            damping: 80,
            stiffness: 60,
            mass: 2,
        }));
    }, [heading, qiblaBearing]);

    useEffect(() => {
        const diff = Math.abs(heading - qiblaBearing);
        const absDiff = Math.abs(diff > 180 ? 360 - diff : diff);
        const aligned = absDiff < 5;

        const wasAligned = isAligned;
        setIsAligned(aligned);
        onAlignChange?.(aligned);

        if (aligned && !wasAligned && !hasVibratedRef.current) {
            hasVibratedRef.current = true;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        if (!aligned) {
            hasVibratedRef.current = false;
        }
    }, [heading, qiblaBearing]);

    const compassAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotateValue.get()}deg` }],
    }));

    const kaabaAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${kaabaRotateValue.get()}deg` }],
    }));

    const compassBg = theme.cardBackground;
    const outerRingColor = isAligned ? '#10B981' : theme.border;

    return (
        <View style={styles.container}>
            {/* Kaaba orbiting outside - using SVG, no background */}
            <Animated.View style={[styles.kaabaOrbit, kaabaAnimatedStyle]}>
                <View style={styles.kaabaContainer}>
                    <KaabaSvg isAligned={isAligned} />
                </View>
            </Animated.View>

            {/* Compass */}
            <View style={[styles.outerRing, { borderColor: outerRingColor, backgroundColor: theme.background }]}>
                <Animated.View style={[styles.compassDial, compassAnimatedStyle]}>
                    <Svg height={COMPASS_SIZE * 0.85} width={COMPASS_SIZE * 0.85} viewBox="0 0 100 100">
                        <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill={compassBg} />

                        {[...Array(72)].map((_, i) => {
                            const angle = i * 5;
                            const isCardinal = angle % 90 === 0;
                            const isMajor = angle % 45 === 0;

                            if (isCardinal) return null;

                            return (
                                <Line
                                    key={i}
                                    x1={CENTER}
                                    y1={5}
                                    x2={CENTER}
                                    y2={isMajor ? 10 : 7}
                                    stroke={theme.textSecondary}
                                    strokeWidth={isMajor ? 1 : 0.5}
                                    strokeOpacity={0.4}
                                    rotation={angle}
                                    origin={`${CENTER}, ${CENTER}`}
                                />
                            );
                        })}

                        <SvgText x={CENTER} y={18} fill={theme.text} fontSize="9" fontWeight="bold" textAnchor="middle">ش</SvgText>
                        <SvgText x={CENTER} y={90} fill={theme.textSecondary} fontSize="9" textAnchor="middle">ج</SvgText>
                        <SvgText x={88} y={53} fill={theme.textSecondary} fontSize="9" textAnchor="middle">شر</SvgText>
                        <SvgText x={12} y={53} fill={theme.textSecondary} fontSize="9" textAnchor="middle">غ</SvgText>
                    </Svg>
                </Animated.View>

                {/* Fixed needle */}
                <View style={styles.needleContainer}>
                    <Svg height={COMPASS_SIZE * 0.6} width={60} viewBox="0 0 60 200">
                        <Path
                            d="M30,100 L22,180 L30,170 L38,180 Z"
                            fill={theme.textSecondary}
                            opacity={0.6}
                        />
                        <Path
                            d="M30,100 L22,20 L30,10 L38,20 Z"
                            fill={isAligned ? '#10B981' : '#FFF'}
                        />
                        <Circle cx={30} cy={100} r={8} fill={theme.cardBackground} stroke={theme.border} strokeWidth={2} />
                        <Circle cx={30} cy={100} r={4} fill={theme.primary} />
                    </Svg>
                </View>
            </View>

            {isAligned && (
                <Animated.View entering={ZoomIn.springify()} style={styles.successBadge}>
                    <LinearGradient colors={['#10B981', '#059669']} style={styles.successGradient}>
                        <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                        <Text style={styles.successText}>القبلة صحيحة</Text>
                    </LinearGradient>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: COMPASS_SIZE + 70,
        height: COMPASS_SIZE + 70,
    },
    kaabaOrbit: {
        position: 'absolute',
        width: COMPASS_SIZE + 60,
        height: COMPASS_SIZE + 60,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    kaabaContainer: {
        marginTop: -8,
    },
    outerRing: {
        width: COMPASS_SIZE,
        height: COMPASS_SIZE,
        borderRadius: COMPASS_SIZE / 2,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
    },
    compassDial: {
        width: COMPASS_SIZE * 0.85,
        height: COMPASS_SIZE * 0.85,
        alignItems: 'center',
        justifyContent: 'center',
    },
    needleContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    successBadge: {
        position: 'absolute',
        bottom: -50,
        borderRadius: 24,
        overflow: 'hidden',
    },
    successGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        gap: 10,
    },
    successText: {
        color: '#FFF',
        fontFamily: 'Tajawal-Bold',
        fontSize: 16,
    },
});
