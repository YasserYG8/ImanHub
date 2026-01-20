// Simple in-memory cache to prevent redundant network requests
const surahCache: { [key: number]: any[] } = {};

export const getSurahText = async (surahId: number) => {
    try {
        // Check cache first
        if (surahCache[surahId]) {
            console.log(`Returning cached data for surah ${surahId}`);
            return surahCache[surahId];
        }

        console.log(`Fetching remote data for surah ${surahId}...`);
        // Fetch both Uthmani text and Jalalayn Tafsir in one call
        const response = await fetch(`http://api.alquran.cloud/v1/surah/${surahId}/editions/quran-uthmani,ar.jalalayn`);
        const data = await response.json();

        if (data.status === 'OK' && data.data && data.data.length === 2) {
            const uthmaniData = data.data[0];
            const tafsirData = data.data[1];

            // Map and merge
            const ayahs = uthmaniData.ayahs.map((ayah: any, index: number) => ({
                number: ayah.number,
                numberInSurah: ayah.numberInSurah,
                arabic: ayah.text,
                tafsir: tafsirData.ayahs[index] ? tafsirData.ayahs[index].text : '',
                juz: ayah.juz,
                page: ayah.page, // API returns page number!
                surahNumber: surahId
            }));

            // Save to cache
            surahCache[surahId] = ayahs;
            console.log(`Fetched and cached ${ayahs.length} ayahs for surah ${surahId}`);
            return ayahs;
        } else {
            console.error('API Error or unexpected format:', data);
            return null;
        }

        return null;
    } catch (error) {
        console.error("Error fetching surah text:", error);
        return null;
    }
};

export const getQuranPage = async (pageNumber: number, edition: string = 'quran-uthmani') => {
    try {
        const cacheKey = `page_${pageNumber}_${edition}`;
        const cache = surahCache as any;

        if (cache[cacheKey]) {
            console.log(`[API] Returning cached page ${pageNumber}`);
            return cache[cacheKey];
        }

        console.log(`[API] Fetching page ${pageNumber} (${edition})...`);
        const response = await fetch(`http://api.alquran.cloud/v1/page/${pageNumber}/${edition}`);
        const data = await response.json();

        if (data.status === 'OK' && data.data && data.data.ayahs) {
            const ayahs = data.data.ayahs.map((ayah: any) => {
                let text = ayah.text;
                // Strip Basmalah if it's the first ayah of a Surah (but not Fatiha, Surah 1)
                // The API usually prepends it. We want to show it separately.
                if (ayah.numberInSurah === 1 && ayah.surah.number !== 1 && ayah.surah.number !== 9) {
                    const basmalahPrefixes = [
                        "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
                        "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
                    ];

                    for (const prefix of basmalahPrefixes) {
                        if (text.startsWith(prefix)) {
                            text = text.substring(prefix.length).trim();
                            break;
                        }
                    }
                }

                return {
                    ...ayah,
                    text: text,
                    surahNumber: ayah.surah.number,
                    surahName: ayah.surah.name,
                    surahEnglishName: ayah.surah.englishName,
                    isSurahStart: ayah.numberInSurah === 1
                };
            });

            cache[cacheKey] = ayahs;
            // console.log(`[API] SUCCESS: Fetched ${ayahs.length} ayahs for page ${pageNumber}`);
            return ayahs;
        } else {
            console.error('API Error:', data);
            return null;
        }
    } catch (error) {
        console.error("Error fetching page:", error);
        return null;
    }
};
