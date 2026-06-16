import { View, StyleSheet, StatusBar, ScrollView as RNScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useThemeColor';
import { useThemeContext } from '@/context/ThemeContext';
import { KEYS, getItem } from '@/utils/storage';
import * as Location from 'expo-location';

// Custom Hooks
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useHijriDate } from '@/hooks/useHijriDate';

// Home Components
import { HeroSection, HERO_HEIGHT } from '@/components/home/HeroSection';
import { NextPrayerCard } from '@/components/home/NextPrayerCard';
import { DailyAyah } from '@/components/home/DailyAyah';
import { IslamicEvents } from '@/components/home/IslamicEvents';
import { ContinueReading } from '@/components/home/ContinueReading';
import { QuickServices } from '@/components/home/QuickServices';
import { HomeStickyHeader } from '@/components/home/HomeStickyHeader';

const AnimatedScrollView = Animated.createAnimatedComponent(RNScrollView);

export default function HomeScreen() {
  const theme = useTheme();
  const { isDark } = useThemeContext();
  const scrollY = useSharedValue(0);

  // Custom hooks for data
  const { nextPrayer, currentPrayer, timeRemaining, isLoading } = usePrayerTimes();
  const { hijriDate, greeting } = useHijriDate();

  // Last read Quran position
  const [lastRead, setLastRead] = useState<{ surahId: number; page: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('');

  // Custom date formatting for Maghreb/North African month names
  const ARABIC_MONTHS = [
    'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
    'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const today = new Date();
  const day = today.getDate();
  const month = ARABIC_MONTHS[today.getMonth()];
  const year = today.getFullYear();
  const gregorianDate = `${day} ${month} ${year}`;

  const fetchLocation = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Use Nominatim API to get Arabic name
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`,
          {
            headers: {
              'User-Agent': 'AthkarApp/1.0'
            }
          }
        );
        const data = await response.json();

        if (data && data.address) {
          // Get the most specific location available
          const suburb = data.address.suburb || data.address.neighbourhood || data.address.district;
          const city = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state_district;
          const country = data.address.country;

          // Prefer suburb/district over city for more specific location (e.g., "Bardo" instead of "Tunis")
          const location = suburb || city;

          // Build location string, avoiding duplicates (e.g., "Tunis, Tunis")
          if (location && country && location !== country) {
            setLocationName(`${location}، ${country}`);
            return;
          } else if (location) {
            setLocationName(location);
            return;
          } else if (country) {
            setLocationName(country);
            return;
          }
        }
      } catch (apiError) {
        console.log('Nominatim API error, falling back to system geocoder:', apiError);
      }

      // Fallback to system geocoder if API fails
      const reverseGeo = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (reverseGeo.length > 0) {
        const place = reverseGeo[0];
        const name = [place.city, place.country].filter(Boolean).join(', ');
        setLocationName(name);
      }
    } catch (e) {
      console.log('Error fetching location:', e);
    }
  };

  const loadData = async () => {
    const lastReadData = await getItem(KEYS.LAST_READ);
    if (lastReadData && typeof lastReadData === 'object' && 'surahId' in lastReadData && 'page' in lastReadData) {
      setLastRead(lastReadData as { surahId: number; page: number });
    }
    fetchLocation();
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Scroll handler for parallax
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <AnimatedScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section with Date, Greeting & Next Prayer */}
        <HeroSection
          hijriDate={hijriDate}
          gregorianDate={gregorianDate}
          greeting={greeting}
          locationName={locationName}
          currentPrayer={currentPrayer}
          scrollY={scrollY}
        >
          {nextPrayer && (
            <NextPrayerCard
              prayerName={nextPrayer.nameAr}
              prayerTime={nextPrayer.time}
              timeRemaining={timeRemaining}
            />
          )}
        </HeroSection>

        {/* Main Content Area */}
        <View style={[styles.contentContainer, { backgroundColor: theme.background }]}>

          {/* Continue Reading (if applicable) */}
          <ContinueReading lastRead={lastRead} />

          {/* Quick Services */}
          <QuickServices />

          {/* Daily Ayah */}
          <DailyAyah delay={300} />

          {/* Islamic Events & Reminders */}
          <IslamicEvents delay={400} />

        </View>
      </AnimatedScrollView>

      {/* Sticky Header */}
      {nextPrayer && (
        <HomeStickyHeader
          scrollY={scrollY}
          hijriDate={hijriDate}
          gregorianDate={gregorianDate}
          nextPrayerName={nextPrayer.nameAr}
          nextPrayerTime={nextPrayer.time}
          timeRemaining={timeRemaining}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  contentContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    paddingTop: 8,
    minHeight: 600,
  },
});
