import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';

interface PrayerCardProps {
    name: string;
    time: string;
    isNext: boolean;
    isGrid?: boolean;
    remaining?: string;
}

export function PrayerCard({ name, time, isNext, isGrid, remaining }: PrayerCardProps) {
    const theme = useTheme();

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: theme.cardBackground,
                    borderColor: isNext ? theme.primary : theme.border,
                    borderWidth: isNext ? 2 : 1,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isNext ? 0.15 : 0.08,
                    shadowRadius: isNext ? 8 : 4,
                    elevation: isNext ? 4 : 2,
                    padding: isGrid ? 16 : 20,
                }
            ]}
        >
            {!isGrid && isNext ? (
                /* Spotlight View */
                <View style={styles.spotlightContent}>
                    <View style={styles.spotlightHeader}>
                        <Text style={[styles.spotlightName, { color: theme.text }]}>
                            {name} ({time}) بعد :
                        </Text>
                    </View>
                    {remaining && (
                        <Text style={[
                            styles.remainingText,
                            styles.remainingTextLarge,
                            { color: theme.primary }
                        ]}>
                            {remaining}
                        </Text>
                    )}
                </View>
            ) : (
                /* Grid or List View */
                <>
                    <View style={[styles.nameContainer, isGrid && styles.nameContainerGrid]}>
                        <Text style={[styles.name, { color: isNext ? theme.primary : theme.text }, isGrid && styles.nameGrid]}>{name}</Text>
                        {isNext && (
                            <View style={{ gap: 8, alignItems: 'center', marginTop: isGrid ? 0 : 8 }}>

                                {remaining && (
                                    <Text style={[
                                        styles.remainingText,
                                        { color: theme.primary }
                                    ]}>
                                        {remaining}
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                    <View style={[styles.timeContainer, isGrid && styles.timeContainerGrid]}>
                        <Ionicons name="time-outline" size={isGrid ? 16 : 20} color={theme.textSecondary} />
                        <Text style={[styles.time, { color: isNext ? theme.primary : theme.text }, isGrid && styles.timeGrid]}>{time}</Text>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        marginBottom: 4,
    },
    content: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    contentSpotlight: {
        flexDirection: 'column',
        gap: 16,
        paddingVertical: 10,
    },
    spotlightContent: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 10,
    },
    spotlightHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    spotlightName: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
    },
    contentGrid: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
    },
    nameContainer: {
        alignItems: 'flex-end',
        gap: 8,
    },
    nameContainerGrid: {
        alignItems: 'center',
        gap: 4,
    },
    
    name: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'right',
    },
    nameGrid: {
        fontSize: 18,
        textAlign: 'center',
    },
    timeContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
    },
    timeContainerGrid: {
        flexDirection: 'column',
        gap: 2,
    },
    time: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'left',
    },
    timeGrid: {
        fontSize: 16,
        textAlign: 'center',
    },
    nextBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    nextBadgeGrid: {
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    nextText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    remainingText: {
        fontSize: 12,
        fontWeight: '800',
        textAlign: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        overflow: 'hidden',
        minWidth: 80,
    },
    remainingTextLarge: {
        fontSize: 28,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 16,
        minWidth: 160,
    },
});
