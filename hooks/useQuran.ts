import quranData from '@/assets/data/quran/quran.json';

export interface Verse {
    id: number;
    text: string;
    translation?: string;
}

export interface Surah {
    id: number;
    name: string;
    transliteration: string;
    translation: string;
    type: string;
    total_verses: number;
    verses: Verse[];
}

export function useQuran() {
    const getSurah = (surahNumber: number): Surah | undefined => {
        // The JSON might be strictly typed or implicit. 
        // Assuming quran.json is an array of objects matching Surah structure (roughly).
        // We cast it if necessary or just trust the import.
        const surah = (quranData as any[]).find((s: any) => s.id === surahNumber);
        return surah as Surah | undefined;
    };

    return {
        getSurah,
        allSurahs: quranData
    };
}
