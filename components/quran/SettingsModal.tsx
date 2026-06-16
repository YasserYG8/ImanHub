import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MIN_SCALE = 0.6;
const MAX_SCALE = 2.0;
const STEP = 0.1;
const THUMB_SIZE = 30;

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    useArabicNumbers: boolean;
    onToggleNumbers: (val: boolean) => void;
    fontScale?: number;
    onFontScaleChange?: (val: number) => void;
    theme: any;
}

// Reliable Custom Slider — uses pageX + measured width for pixel-perfect tracking
const FontSizeSlider = ({ value, onValueChange, theme }: { value: number, onValueChange: (v: number) => void, theme: any }) => {
    const containerRef = useRef<View>(null);
    const layoutRef = useRef({ pageX: 0, width: 0 });
    const [trackWidth, setTrackWidth] = React.useState(0);

    const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
        const width = e.nativeEvent.layout.width;
        setTrackWidth(width);
        // Measure absolute position on screen for touch mapping
        containerRef.current?.measureInWindow((x, _y, w, _h) => {
            layoutRef.current = { pageX: x, width: w };
        });
    }, []);

    const positionToValue = useCallback((pageX: number) => {
        const { pageX: containerX, width } = layoutRef.current;
        if (width === 0) return value;
        // Map touch to the thumb-constrained range
        const usableWidth = width - THUMB_SIZE;
        const relativeX = pageX - containerX - THUMB_SIZE / 2;
        const ratio = Math.max(0, Math.min(1, relativeX / usableWidth));
        const rawValue = MIN_SCALE + ratio * (MAX_SCALE - MIN_SCALE);
        const stepped = Math.round(rawValue / STEP) * STEP;
        return Math.max(MIN_SCALE, Math.min(MAX_SCALE, parseFloat(stepped.toFixed(1))));
    }, [value]);

    const handleTouch = useCallback((pageX: number) => {
        const newValue = positionToValue(pageX);
        onValueChange(newValue);
    }, [positionToValue, onValueChange]);

    // Ratio 0..1
    const ratio = (value - MIN_SCALE) / (MAX_SCALE - MIN_SCALE);

    // Thumb pixel position: ranges from 0 to (trackWidth - THUMB_SIZE) 
    // so thumb circle always stays inside the container
    const thumbLeftPx = trackWidth > 0 ? ratio * (trackWidth - THUMB_SIZE) : 0;

    // Fill width: from left edge to thumb center
    const fillWidthPx = thumbLeftPx + THUMB_SIZE / 2;

    // Step count for markers
    const totalSteps = Math.round((MAX_SCALE - MIN_SCALE) / STEP);

    return (
        <View style={sliderStyles.container}>
            <View
                ref={containerRef}
                style={sliderStyles.hitArea}
                onLayout={onContainerLayout}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={(e) => handleTouch(e.nativeEvent.pageX)}
                onResponderMove={(e) => handleTouch(e.nativeEvent.pageX)}
                onResponderRelease={(e) => handleTouch(e.nativeEvent.pageX)}
            >
                {/* Visual Track — inset by half thumb so track ends align with thumb center at edges */}
                <View style={[
                    sliderStyles.trackWrapper,
                    { marginHorizontal: THUMB_SIZE / 2 }
                ]}>
                    {/* Track bar */}
                    <View style={[sliderStyles.track, { backgroundColor: theme.border + '50' }]}>
                        <View
                            style={[
                                sliderStyles.fill,
                                {
                                    backgroundColor: theme.primary,
                                    width: trackWidth > 0 ? Math.max(0, fillWidthPx - THUMB_SIZE / 2) : 0,
                                }
                            ]}
                        />
                    </View>

                    {/* Step dots — below the track, always visible */}
                    <View style={sliderStyles.dotsRow}>
                        {Array.from({ length: totalSteps + 1 }, (_, i) => {
                            const stepVal = MIN_SCALE + i * STEP;
                            const stepRatio = (stepVal - MIN_SCALE) / (MAX_SCALE - MIN_SCALE);
                            const isDefault = Math.abs(stepVal - 1.0) < 0.01;
                            const isActive = stepVal <= value + 0.01;
                            return (
                                <View
                                    key={i}
                                    style={[
                                        sliderStyles.stepDot,
                                        {
                                            left: `${stepRatio * 100}%` as any,
                                            backgroundColor: isDefault
                                                ? theme.primary
                                                : isActive
                                                    ? theme.primary + '90'
                                                    : theme.border,
                                            width: isDefault ? 8 : 4,
                                            height: isDefault ? 8 : 4,
                                            borderRadius: isDefault ? 4 : 2,
                                            marginLeft: isDefault ? -4 : -2,
                                        }
                                    ]}
                                />
                            );
                        })}
                    </View>
                </View>

                {/* Thumb — pixel positioned, never overflows */}
                <View
                    style={[
                        sliderStyles.thumb,
                        {
                            left: thumbLeftPx,
                            backgroundColor: theme.primary,
                            shadowColor: theme.primary,
                        }
                    ]}
                    pointerEvents="none"
                >
                    <Ionicons name="resize" size={14} color="#FFF" />
                </View>
            </View>
        </View>
    );
};

const sliderStyles = StyleSheet.create({
    container: {
        marginVertical: 6,
    },
    hitArea: {
        height: 56,
        justifyContent: 'center',
    },
    trackWrapper: {
    },
    track: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: 3,
        position: 'absolute',
        left: 0,
        top: 0,
    },
    dotsRow: {
        height: 12,
        marginTop: 6,
    },
    stepDot: {
        position: 'absolute',
        top: 0,
    },
    thumb: {
        position: 'absolute',
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        top: 4,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 5,
    },
});

export const SettingsModal = ({ visible, onClose, useArabicNumbers, onToggleNumbers, fontScale = 1.0, onFontScaleChange, theme }: SettingsModalProps) => {
    const percentage = Math.round(fontScale * 100);
    const previewFontSize = 22 * fontScale;

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable
                    style={[styles.container, { backgroundColor: theme.cardBackground }]}
                    onPress={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                            <Ionicons name="close-circle" size={26} color={theme.textSecondary} />
                        </TouchableOpacity>
                        <Text style={[styles.title, { color: theme.text }]}>إعدادات القراءة</Text>
                        <Ionicons name="settings-outline" size={22} color={theme.primary} />
                    </View>

                    {/* Divider */}
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    {/* Font Size Section */}
                    {onFontScaleChange && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIconBg, { backgroundColor: theme.primary + '15' }]}>
                                    <Ionicons name="text-outline" size={18} color={theme.primary} />
                                </View>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>حجم الخط</Text>
                            </View>

                            {/* Preview Text */}
                            <View style={[styles.previewContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                <Text style={[styles.previewText, { color: theme.text, fontSize: previewFontSize, lineHeight: previewFontSize * 1.8 }]}>
                                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                                </Text>
                            </View>

                            {/* Slider Row */}
                            <View style={styles.sliderRow}>
                                {/* Decrease Button */}
                                <TouchableOpacity
                                    style={[styles.scaleButton, { backgroundColor: theme.primary + '15', opacity: fontScale <= MIN_SCALE ? 0.3 : 1 }]}
                                    onPress={() => {
                                        const newVal = Math.max(MIN_SCALE, parseFloat((fontScale - STEP).toFixed(1)));
                                        onFontScaleChange(newVal);
                                    }}
                                    disabled={fontScale <= MIN_SCALE}
                                >
                                    <Text style={[styles.scaleButtonText, { color: theme.primary, fontSize: 13 }]}>أ</Text>
                                </TouchableOpacity>

                                {/* Slider */}
                                <View style={{ flex: 1 }}>
                                    <FontSizeSlider
                                        value={fontScale}
                                        onValueChange={onFontScaleChange}
                                        theme={theme}
                                    />
                                </View>

                                {/* Increase Button */}
                                <TouchableOpacity
                                    style={[styles.scaleButton, { backgroundColor: theme.primary + '15', opacity: fontScale >= MAX_SCALE ? 0.3 : 1 }]}
                                    onPress={() => {
                                        const newVal = Math.min(MAX_SCALE, parseFloat((fontScale + STEP).toFixed(1)));
                                        onFontScaleChange(newVal);
                                    }}
                                    disabled={fontScale >= MAX_SCALE}
                                >
                                    <Text style={[styles.scaleButtonText, { color: theme.primary, fontSize: 20 }]}>أ</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Percentage + Reset */}
                            <View style={styles.percentageRow}>
                                <TouchableOpacity
                                    style={[styles.resetButton, { borderColor: theme.border }]}
                                    onPress={() => onFontScaleChange(1.0)}
                                >
                                    <Ionicons name="refresh-outline" size={14} color={theme.textSecondary} />
                                    <Text style={[styles.resetText, { color: theme.textSecondary }]}>افتراضي</Text>
                                </TouchableOpacity>
                                <Text style={[styles.percentageText, { color: theme.primary }]}>
                                    {percentage}%
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Divider */}
                    {onFontScaleChange && <View style={[styles.divider, { backgroundColor: theme.border }]} />}

                    {/* Page Numbers Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIconBg, { backgroundColor: theme.primary + '15' }]}>
                                <Ionicons name="keypad-outline" size={18} color={theme.primary} />
                            </View>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>أرقام الصفحات</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.radioRow, { borderColor: useArabicNumbers ? theme.primary : theme.border }]}
                            onPress={() => onToggleNumbers(true)}
                        >
                            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
                                <Ionicons
                                    name={useArabicNumbers ? "radio-button-on" : "radio-button-off"}
                                    size={22}
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
                                    size={22}
                                    color={!useArabicNumbers ? theme.primary : theme.textSecondary}
                                />
                                <Text style={[styles.radioLabel, { color: theme.text }]}>أرقام إنجليزية (123)</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Divider */}
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    {/* Future: Riwayah Selector */}
                    <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
                        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
                            <View style={[styles.sectionIconBg, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
                                <Ionicons name="library-outline" size={18} color="#8B5CF6" />
                            </View>
                            <View>
                                <Text style={[styles.settingLabel, { color: theme.text }]}>الرواية (قريباً)</Text>
                                <Text style={[styles.settingSubLabel, { color: theme.textSecondary }]}>حفص عن عاصم</Text>
                            </View>
                        </View>
                        <Ionicons name="lock-closed-outline" size={18} color={theme.textSecondary} />
                    </View>

                    {/* Close Button */}
                    <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.primary }]} onPress={onClose}>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginLeft: 6 }} />
                        <Text style={styles.closeButtonText}>تـم</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    container: {
        width: '90%',
        borderRadius: 24,
        padding: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    headerRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    closeIcon: {
        padding: 2,
    },
    title: {
        fontSize: 20,
        fontFamily: 'Amiri-Bold',
        textAlign: 'center',
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: 14,
        opacity: 0.5,
    },
    section: {
        marginBottom: 4,
    },
    sectionHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
    },
    sectionIconBg: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Amiri-Bold',
        textAlign: 'right',
    },
    previewContainer: {
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        marginBottom: 14,
        alignItems: 'center',
    },
    previewText: {
        fontFamily: 'Amiri-Regular',
        textAlign: 'center',
    },
    sliderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    scaleButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scaleButtonText: {
        fontFamily: 'Amiri-Bold',
    },
    percentageRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    percentageText: {
        fontSize: 16,
        fontFamily: 'Amiri-Bold',
    },
    resetButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
    },
    resetText: {
        fontSize: 12,
        fontFamily: 'Amiri-Regular',
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
    settingRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    settingLabel: {
        fontSize: 15,
        fontFamily: 'Amiri-Bold',
        textAlign: 'right'
    },
    settingSubLabel: {
        fontSize: 12,
        fontFamily: 'Amiri-Regular',
        textAlign: 'right',
        marginTop: 2
    },
    closeButton: {
        marginTop: 16,
        padding: 14,
        borderRadius: 14,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontFamily: 'Amiri-Bold',
        fontSize: 17
    }
});
