import { Coordinates, CalculationMethod, PrayerTimes, Madhab, Prayer } from 'adhan';

export interface UserLocation {
    latitude: number;
    longitude: number;
}

export const getPrayerTimes = (location: UserLocation, date: Date = new Date()) => {
    const coordinates = new Coordinates(location.latitude, location.longitude);
    const params = CalculationMethod.MuslimWorldLeague();
    params.madhab = Madhab.Shafi;

    const prayerTimes = new PrayerTimes(coordinates, date, params);

    // Calculate Qiyam al-Layl (Last Third of the Night)
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowPrayerTimes = new PrayerTimes(coordinates, tomorrow, params);

    const maghrib = prayerTimes.maghrib;
    const nextFajr = tomorrowPrayerTimes.fajr;

    // Duration from Maghrib to next Fajr in ms
    const nightDuration = nextFajr.getTime() - maghrib.getTime();
    const middleStart = new Date(maghrib.getTime() + (nightDuration / 2));
    const lastThirdStart = new Date(nextFajr.getTime() - (nightDuration / 3));

    // Add properties to the instance without losing methods
    return Object.assign(prayerTimes, {
        middle: middleStart,
        qiyam: lastThirdStart
    });
};

export const getNextPrayer = (prayerTimes: PrayerTimes) => {
    let next = prayerTimes.nextPrayer();
    let time = prayerTimes.timeForPrayer(next);

    // If no more prayers today, look at tomorrow's Fajr
    if (next === Prayer.None || !time) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get coordinates from the current prayerTimes object
        const coordinates = prayerTimes.coordinates;
        const params = prayerTimes.calculationParameters;

        const nextDayPrayerTimes = new PrayerTimes(coordinates, tomorrow, params);
        next = Prayer.Fajr;
        time = nextDayPrayerTimes.fajr;
    }

    return { prayer: next, time };
};
