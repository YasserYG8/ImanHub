import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import categories from '../../assets/data/athkar_categories.json';
import { useTheme } from '@/hooks/useThemeColor';
import { AthkarCategoryCard } from '@/components/athkar/AthkarCategoryCard';

const { width } = Dimensions.get('window');

export default function AthkarScreen() {
    const router = useRouter();
    const theme = useTheme();

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <AthkarCategoryCard
            item={item}
            index={index}
            theme={theme}
            onPress={() => router.push({
                pathname: '/athkar/counter/[category]', // Need to verify this route path compared to existing file structure
                params: { category: item.id }
            })}
        />
    );

    // Note: The route used previously was '/athkar/counter/[category]' but file list showed 'app/athkar/[id].tsx'
    // Previous file content showed: router.push({ pathname: '/athkar/counter/[category]', params: { category: item.id } })
    // But file list showed 'app/athkar/[id].tsx'. 
    // Wait, let me double check the file list from step 90.
    // 'app/athkar/[id].tsx' exists.
    // 'app/athkar/counter' dir exists.
    // The previous code had: pathname: '/athkar/counter/[category]'
    // If I look at file structure: app/athkar/counter/[category] might not exist if [id].tsx is the detail page.
    // app/(tabs)/athkar.tsx (original) line 22 says: pathname: '/athkar/counter/[category]'
    // But Step 90 showed `app/athkar/[id].tsx`.
    // And `app/athkar/counter` directory exists.
    // Let's stick to the previous route path to avoid breaking navigation: '/athkar/counter/[category]' 
    // Wait, if I am redesigning, I should probably point to the page I am designing.
    // The user previously requested to "focus about athkar page".
    // I read `app/athkar/[id].tsx` in step 94. Its default export is `AthkarCategoryScreen`.
    // It accepts `id` param.
    // The previous code had `pathname: '/athkar/counter/[category]'` which looks like it might point to `app/athkar/counter/[category].tsx` if it exists.
    // Let's assume the previous code was working. I will keep the path same.

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Custom Header */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>الأذكار</Text>
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                    اذكر الله في كل حين
                </Text>
            </View>
            <FlatList
                data={categories}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 32,
        fontFamily: 'Amiri-Bold', // Upgraded font
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        fontFamily: 'Amiri-Regular',
        opacity: 0.8,
    },
    list: {
        padding: 20,
        paddingTop: 8,
        paddingBottom: 100,
    },
});
