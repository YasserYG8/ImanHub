/**
 * Islamic Calendar Events and Reminders Data
 * 
 * This module provides utilities for calculating and displaying
 * Islamic calendar events, fasting reminders, and important dates.
 */

export interface IslamicEvent {
    id: string;
    nameAr: string;
    nameEn: string;
    description: string;
    icon: string;
    color: string;
    type: 'fasting' | 'holiday' | 'special' | 'monthly';
}

export interface UpcomingEvent extends IslamicEvent {
    daysUntil: number;
    hijriDate: string;
    gregorianDate?: string;
}

// Monthly recurring events (Ayyam al-Bidh)
export const AYYAM_AL_BIDH: IslamicEvent = {
    id: 'ayyam-bidh',
    nameAr: 'أيام البيض',
    nameEn: 'White Days',
    description: 'صيام الأيام البيض (١٣، ١٤، ١٥) من كل شهر هجري',
    icon: 'moon',
    color: '#9333EA',
    type: 'monthly',
};

// Weekly fasting
export const WEEKLY_FASTING: IslamicEvent = {
    id: 'weekly-fast',
    nameAr: 'صيام الاثنين والخميس',
    nameEn: 'Monday & Thursday Fasting',
    description: 'سُنة صيام يومي الاثنين والخميس من كل أسبوع',
    icon: 'calendar',
    color: '#0EA5E9',
    type: 'monthly',
};

// Annual events by Hijri month
export const ANNUAL_EVENTS: Record<number, IslamicEvent[]> = {
    // Muharram (Month 1)
    1: [
        {
            id: 'new-year',
            nameAr: 'رأس السنة الهجرية',
            nameEn: 'Islamic New Year',
            description: '١ محرم - بداية العام الهجري الجديد',
            icon: 'star',
            color: '#F59E0B',
            type: 'holiday',
        },
        {
            id: 'ashura',
            nameAr: 'عاشوراء',
            nameEn: 'Ashura',
            description: 'صيام ٩ و ١٠ محرم - يكفر السنة الماضية',
            icon: 'heart',
            color: '#EF4444',
            type: 'fasting',
        },
    ],
    // Rajab (Month 7)
    7: [
        {
            id: 'isra-miraj',
            nameAr: 'الإسراء والمعراج',
            nameEn: 'Isra and Miraj',
            description: '٢٧ رجب - ذكرى رحلة الإسراء والمعراج',
            icon: 'sparkles',
            color: '#8B5CF6',
            type: 'special',
        },
    ],
    // Shaban (Month 8)
    8: [
        {
            id: 'shaban-fasting',
            nameAr: 'صيام شعبان',
            nameEn: 'Shaban Fasting',
            description: 'الإكثار من الصيام في شعبان استعداداً لرمضان',
            icon: 'flame',
            color: '#F97316',
            type: 'fasting',
        },
        {
            id: 'mid-shaban',
            nameAr: 'ليلة النصف من شعبان',
            nameEn: 'Mid-Shaban Night',
            description: '١٥ شعبان - ليلة مباركة للدعاء والاستغفار',
            icon: 'moon',
            color: '#6366F1',
            type: 'special',
        },
    ],
    // Ramadan (Month 9)
    9: [
        {
            id: 'ramadan',
            nameAr: 'رمضان المبارك',
            nameEn: 'Ramadan',
            description: 'شهر الصيام والقيام وتلاوة القرآن',
            icon: 'moon',
            color: '#10B981',
            type: 'fasting',
        },
        {
            id: 'laylat-qadr',
            nameAr: 'ليلة القدر',
            nameEn: 'Laylat al-Qadr',
            description: 'ليلة خير من ألف شهر - العشر الأواخر',
            icon: 'sparkles',
            color: '#FFD700',
            type: 'special',
        },
    ],
    // Shawwal (Month 10)
    10: [
        {
            id: 'eid-fitr',
            nameAr: 'عيد الفطر',
            nameEn: 'Eid al-Fitr',
            description: '١ شوال - عيد الفطر المبارك',
            icon: 'gift',
            color: '#EC4899',
            type: 'holiday',
        },
        {
            id: 'six-shawwal',
            nameAr: 'صيام ست من شوال',
            nameEn: 'Six Days of Shawwal',
            description: 'صيام ٦ أيام بعد العيد = أجر صيام السنة',
            icon: 'trending-up',
            color: '#14B8A6',
            type: 'fasting',
        },
    ],
    // Dhul Hijjah (Month 12)
    12: [
        {
            id: 'dhul-hijjah-ten',
            nameAr: 'عشر ذي الحجة',
            nameEn: '10 Days of Dhul Hijjah',
            description: 'أفضل أيام الدنيا - صيام ١-٩ ذي الحجة',
            icon: 'flame',
            color: '#DC2626',
            type: 'fasting',
        },
        {
            id: 'arafah',
            nameAr: 'يوم عرفة',
            nameEn: 'Day of Arafah',
            description: '٩ ذي الحجة - صيامه يكفر سنتين',
            icon: 'sun',
            color: '#F59E0B',
            type: 'fasting',
        },
        {
            id: 'eid-adha',
            nameAr: 'عيد الأضحى',
            nameEn: 'Eid al-Adha',
            description: '١٠ ذي الحجة - عيد الأضحى المبارك',
            icon: 'gift',
            color: '#059669',
            type: 'holiday',
        },
    ],
};

/**
 * Check if today is one of Ayyam al-Bidh (13, 14, 15 of Hijri month)
 */
export function isAyyamAlBidh(hijriDay: number): boolean {
    return hijriDay >= 13 && hijriDay <= 15;
}

/**
 * Check if today is Monday or Thursday (weekly fasting days)
 */
export function isWeeklyFastingDay(): boolean {
    const day = new Date().getDay();
    return day === 1 || day === 4; // Monday = 1, Thursday = 4
}

/**
 * Get days until next Ayyam al-Bidh
 */
export function getDaysUntilAyyamBidh(hijriDay: number): number {
    if (hijriDay < 13) return 13 - hijriDay;
    if (hijriDay > 15) return (30 - hijriDay) + 13; // Approximate next month
    return 0; // Currently in Ayyam al-Bidh
}

/**
 * Calculate days until an event in a given Hijri month/day
 */
export function getDaysUntilHijriDate(
    currentMonth: number,
    currentDay: number,
    targetMonth: number,
    targetDay: number
): number {
    // Simple calculation - assumes 30 days per month
    if (currentMonth === targetMonth) {
        if (currentDay <= targetDay) {
            return targetDay - currentDay;
        } else {
            // Next year
            return (12 - currentMonth) * 30 + targetMonth * 30 + targetDay - currentDay;
        }
    } else if (currentMonth < targetMonth) {
        return (targetMonth - currentMonth - 1) * 30 + (30 - currentDay) + targetDay;
    } else {
        // Next year
        return (12 - currentMonth) * 30 + targetMonth * 30 + targetDay - currentDay;
    }
}
