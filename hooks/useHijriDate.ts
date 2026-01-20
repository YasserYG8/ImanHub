import { useState, useEffect } from 'react';
import moment from 'moment-hijri';
import 'moment/locale/ar';

// Configure moment for Arabic
moment.locale('ar');
moment.updateLocale('ar', {
    postformat: (str: string) => str,
});

interface UseHijriDateReturn {
    hijriDate: string;
    gregorianDate: string;
    greeting: string;
    dayName: string;
}

/**
 * Returns time-appropriate Islamic greeting
 */
function getIslamicGreeting(): string {
    const hour = new Date().getHours();

    if (hour >= 3 && hour < 12) {
        return 'صباح الخير';
    } else if (hour >= 12 && hour < 15) {
        return 'طاب يومك';
    } else if (hour >= 15 && hour < 18) {
        return 'مساء الخير';
    } else {
        return 'مساء النور';
    }
}

/**
 * Custom hook for Hijri date and Islamic greetings
 */
export function useHijriDate(): UseHijriDateReturn {
    const [hijriDate, setHijriDate] = useState('');
    const [gregorianDate, setGregorianDate] = useState('');
    const [greeting, setGreeting] = useState('');
    const [dayName, setDayName] = useState('');

    useEffect(() => {
        const updateDate = () => {
            const m = moment();

            // Hijri months in Arabic
            const hijriMonths = [
                'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر',
                'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
                'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
            ];

            const hDay = m.format('iD');
            const hMonthIndex = parseInt(m.format('iM')) - 1;
            const hYear = m.format('iYYYY');
            const hijriMonthName = hijriMonths[hMonthIndex] || m.format('iMMMM');

            setHijriDate(`${hDay} ${hijriMonthName} ${hYear}`);
            setGregorianDate(m.format('D MMMM YYYY'));
            setDayName(m.format('dddd'));
            setGreeting(getIslamicGreeting());
        };

        updateDate();

        // Update every minute to catch greeting changes
        const interval = setInterval(updateDate, 60000);
        return () => clearInterval(interval);
    }, []);

    return {
        hijriDate,
        gregorianDate,
        greeting,
        dayName,
    };
}
