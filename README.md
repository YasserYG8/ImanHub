# ImanHub – Comprehensive Islamic Companion App

## 📖 Overview

**ImanHub** is a feature-rich **React Native / Expo** application designed to be your complete Islamic companion. It provides Muslims with essential daily tools including Quran reading, prayer times, Athkar (supplications), Qibla finder, and much more.

---

## 🏗️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform mobile framework |
| **Expo** | Development platform & toolchain |
| **TypeScript** | Type-safe JavaScript |
| **Expo Router** | File-based navigation |
| **React Native Reanimated** | Smooth, performant animations |
| **AsyncStorage** | Persistent local storage |
| **expo-location** | GPS & heading for Qibla |
| **expo-notifications** | Prayer & Athkar reminders |

---

## � Core Features

### 🏠 Home Dashboard (`/(tabs)/index`)
- **Hijri & Gregorian date** display with Arabic month names
- **Dynamic greeting** based on time of day
- **Next prayer countdown** with remaining time
- **Daily Ayah** – inspirational Quran verse
- **Islamic Events** – upcoming religious occasions & reminders
- **Continue Reading** – resume Quran from last position
- **Quick Services** – fast access to key features

### 📖 Quran Reader (`/(tabs)/quran`, `/quran/[id]`)
- **Dual display modes**: Image-based & text-based reading
- **604 pages** of authentic Quran text
- **Surah navigation** with search functionality
- **Ayah bookmarks** – save and navigate to favorite verses
- **Tafsir integration** – verse interpretation (~4.5 MB data)
- **Auto-scroll** to bookmarked positions

### 🕌 Prayer Times (`/(tabs)/prayers`)
- **Accurate calculations** with multiple methods
- **Location-based** automatic detection
- **Next prayer highlighting** with countdown
- **Configurable calculation methods**

### 🌙 Athkar & Supplications (`/(tabs)/athkar`, `/athkar/[id]`)
- **Morning Athkar** (أذكار الصباح)
- **Evening Athkar** (أذكار المساء)
- **Categorized supplications** with counter
- **Tasbeeh counter** with haptic feedback

### 🧭 Qibla Finder (`/qibla`)
- **Compass-based** direction finding
- **Physics-based animations** – smooth, realistic needle movement
- **Visual feedback** when aligned with Qibla
- **True heading** using device magnetometer

### 📍 Mosque Finder (`/mosques`)
- **Map integration** with `react-native-maps`
- **OpenStreetMap Overpass API** for mosque data
- **Configurable search radius**
- **Distance & direction** to nearby mosques

### 📚 Knowledge Hub (`/knowledge`)
- **Prophets' Stories** – detailed narratives
- **Sunnah Teachings** – authentic hadith
- **Islamic education** content

### 🤖 AI Assistant (`/chatbot`)
- **Islamic Q&A** chatbot
- **Knowledge-based** responses

### ⚙️ Settings (`/(tabs)/settings`)
- **Dark/Light theme** toggle
- **Notification controls** (prayers, Athkar, Jumu'ah)
- **Prayer calculation method** selection

---

## 📁 Project Structure

```
athkar-app/
├── app/                    # Expo Router screens
│   ├── (tabs)/             # Tab navigation screens
│   │   ├── index.tsx       # Home dashboard
│   │   ├── quran.tsx       # Quran surah list
│   │   ├── prayers.tsx     # Prayer times
│   │   ├── athkar.tsx      # Athkar categories
│   │   └── menu.tsx        # Additional features
│   ├── athkar/             # Athkar detail screens
│   ├── quran/              # Quran reader screens
│   ├── duaa/               # Duaa sections
│   ├── knowledge/          # Islamic knowledge
│   ├── mosques/            # Mosque finder
│   └── qibla.tsx           # Qibla compass
├── components/             # Reusable UI components
│   ├── home/               # Home screen components
│   ├── quran/              # Quran-related components
│   ├── qibla/              # Compass component
│   └── ui/                 # Generic UI components
├── hooks/                  # Custom React hooks
│   ├── usePrayerTimes.ts   # Prayer time calculations
│   ├── useHijriDate.ts     # Islamic calendar
│   ├── useQuran.ts         # Quran data management
│   └── useThemeColor.ts    # Theme utilities
├── utils/                  # Utility functions
│   ├── storage.ts          # AsyncStorage wrapper
│   ├── notifications.ts    # Notification scheduling
│   ├── prayerTimes.ts      # Prayer calculations
│   ├── qibla.ts            # Qibla direction math
│   ├── quranApi.ts         # Quran data fetching
│   └── aiService.ts        # AI chatbot service
├── assets/data/            # JSON data files
│   ├── quran_text.json     # Full Quran text (~3.9 MB)
│   ├── quran_tafsir.json   # Tafsir data (~4.5 MB)
│   ├── athkar_data.json    # Athkar supplications
│   ├── duaa_data.json      # Duaa collection
│   ├── prophets_stories.json
│   └── sunnah_teachings.json
├── context/                # React Context providers
│   └── ThemeContext.tsx    # Dark/light theme
└── constants/              # App constants
```

---

## 🎨 UI/UX Features

- **🌓 Dark/Light Theme** – Full theme support with context
- **✨ Premium Glassmorphism** – Blur effects & transparency
- **🎭 Smooth Animations** – React Native Reanimated powered
- **🔄 RTL Support** – Full Arabic right-to-left layout
- **🌈 Gradient Accents** – Beautiful color transitions
- **👆 Interactive Feedback** – Scale press animations & haptics

---

## 🚀 Quick Start

```bash
# 1️⃣ Clone the repository
git clone <YOUR_REPO_URL>
cd athkar-app

# 2️⃣ Install dependencies
npm install

# 3️⃣ Start the development server
npm run start

# 4️⃣ Run on device/emulator
# Press 'a' for Android
# Press 'i' for iOS
```

---

## 📦 Backup & Version Control

1. **Git** – All source files are tracked. Commit often.
2. **Remote Repository** – Push to GitHub/GitLab for cloud backup.
3. **ZIP Snapshot** – `Compress-Archive -Path . -DestinationPath ../imanhub-backup.zip`
4. **Cloud Sync** – Use OneDrive/Google Drive for continuous backup.

---

## 🔮 Future Enhancements

- [ ] MMKV storage for better performance (requires custom build)
- [ ] Audio recitation for Quran
- [ ] Widget support for prayer times
- [ ] Apple Watch / Wear OS companion
- [ ] Offline mode improvements
- [ ] Multi-language support

---

## 📄 License

This project is for personal/educational use.

---

*Built with ❤️ for the Muslim community*
