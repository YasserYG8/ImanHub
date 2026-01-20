import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MosquesMapWeb() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Map is not available on web.</Text>
            <Text style={styles.text}>Please use the mobile app.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 18,
        marginBottom: 10,
    }
});
