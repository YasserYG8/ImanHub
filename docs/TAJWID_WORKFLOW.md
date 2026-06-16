# 🕌 Tajwid Interactive Feature — Complete Workflow

> **ImanHub** - AI-Powered Tajwid Learning System

---

## 📖 Overview

Build an **AI-powered Tajwid learning system** that allows users to:
1. Listen to correct Quran recitation
2. Record their own recitation
3. Receive real-time feedback with Tajwid analysis
4. Track their learning progress

---

## 🏗️ Architecture (3 Layers)

```
┌─────────────────────────────────────────────────────────────┐
│                  📱 LAYER 1: Mobile App                      │
│                     (Expo / React Native)                    │
│  • User Interface                                           │
│  • Audio Recording                                          │
│  • Progress Display                                         │
│  • Local Storage (AsyncStorage)                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  ⚙️ LAYER 2: Backend Server                  │
│                     (Node.js + Express)                      │
│  • Receive audio files                                      │
│  • Call OpenAI Whisper API                                  │
│  • Apply Tajwid rules                                       │
│  • Return score + feedback                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  🤖 LAYER 3: AI Processing                   │
│                     (OpenAI Whisper API)                     │
│  • Arabic speech recognition                                │
│  • Word-level timestamps                                    │
│  • Transcription                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 User Workflow (What User Experiences)

```
User opens Tajwid Section
        ↓
Selects Surah / Ayah
        ↓
Listens to correct recitation ▶️ (from EveryAyah.com)
        ↓
Presses Record 🎤
        ↓
Reads Ayah
        ↓
Stops Recording
        ↓
Sees "Analyzing..."
        ↓
Gets Feedback + Score + Highlights
```

### User Sees:
- ✅ Colored Quran text (Tajwid highlighting)
- ✅ Score (0–100%)
- ✅ Mistake explanations
- ✅ Tips for improvement
- ✅ Progress saved locally

---

## ⚙️ Technical Pipeline

### STEP A — Mobile Recording (Expo)
```
✔ User records voice using expo-av
✔ File saved locally as m4a/wav
✔ Ready for upload
```

### STEP B — Upload Audio
```
Mobile sends to: POST /api/tajwid/analyze
- audio file
- surah number
- ayah number
```

### STEP C — Backend Processing (Node.js)
```
✔ Receives audio file
✔ Calls OpenAI Whisper API
✔ Gets Arabic transcription
✔ Applies Tajwid rules
✔ Calculates score
✔ Returns JSON response
```

### STEP D — Display Results
```
✔ Mobile receives JSON
✔ Saves to AsyncStorage (local)
✔ Displays score + mistakes
✔ Updates progress
```

---

## 🤖 AI Processing Details

### 1. Audio Preprocessing
```
Input audio → Convert to WAV → 16kHz mono → Normalize
```

### 2. Speech Recognition (Whisper)
```
Audio → OpenAI Whisper API → Arabic text + timestamps
```

### 3. Text Comparison
```
User transcription vs Expected Ayah → Word matching
```

### 4. Tajwid Analysis
```
Check for:
├── Madd (المد) - elongation detection
├── Ghunnah (الغنة) - nasal sound
├── Qalqalah (القلقلة) - echo effect
├── Idgham (الإدغام) - letter merging
├── Ikhfa (الإخفاء) - concealment
└── More rules...
```

### 5. Scoring System
```
Final Score = (Text Accuracy × 0.4) + (Tajwid Accuracy × 0.4) + (Timing × 0.2)
```

---

## 📦 API Response Format

```json
{
  "success": true,
  "data": {
    "score": 86,
    "textAccuracy": 92,
    "tajwidAccuracy": 78,
    "transcription": "بسم الله الرحمن الرحيم",
    "expected": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    "mistakes": [
      {
        "word": "الرَّحْمَٰنِ",
        "wordIndex": 3,
        "rule": "madd",
        "ruleArabic": "المد",
        "message": "Madd is too short",
        "tip": "Stretch the 'aa' sound for 4-5 beats"
      }
    ],
    "correct": ["بِسْمِ", "اللَّهِ", "الرَّحِيمِ"]
  }
}
```

---

## 🎧 Reference Audio Source

Using **EveryAyah.com** (FREE):

```typescript
// Get audio URL for any Ayah
function getAyahAudioUrl(surah: number, ayah: number): string {
  const surahStr = surah.toString().padStart(3, '0');
  const ayahStr = ayah.toString().padStart(3, '0');
  return `https://everyayah.com/data/Husary_Muallim_128kbps/${surahStr}${ayahStr}.mp3`;
}

// Example: Al-Fatiha, Ayah 1
// https://everyayah.com/data/Husary_Muallim_128kbps/001001.mp3
```

**Recommended Reciter:** Al-Husary (Muallim/Teaching version) - slow, clear pronunciation.

---

## 🔧 OpenAI Whisper Configuration

### Getting API Key
1. Go to https://platform.openai.com
2. Sign up / Log in
3. Go to API Keys section
4. Create new key
5. Add payment method (pay per use: $0.006/minute)

### Usage
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const transcription = await openai.audio.transcriptions.create({
  file: audioFile,
  model: "whisper-1",
  language: "ar",
  response_format: "verbose_json",
});
```

---

## 📁 File Structure

### Mobile (athkar-app/)
```
app/tajwid/
├── index.tsx              # Surah/Ayah selection
├── practice/[ayahId].tsx  # Listen + Record
├── results.tsx            # Score + Mistakes
└── progress.tsx           # History & Stats

components/tajwid/
├── AyahSelector.tsx       # Dropdown picker
├── QuranText.tsx          # Colored text
├── AudioPlayer.tsx        # Play reference
├── VoiceRecorder.tsx      # Record voice
├── ScoreDisplay.tsx       # Animated score
└── MistakeCard.tsx        # Mistake details

utils/
├── tajwidApi.ts           # Backend API client
├── tajwidAudio.ts         # EveryAyah URLs
└── tajwidStorage.ts       # AsyncStorage
```

### Backend (tajwid-backend/)
```
src/
├── index.ts               # Express server
├── routes.ts              # API endpoints
├── whisper.ts             # OpenAI integration
├── tajwid.ts              # Rules analysis
└── scorer.ts              # Scoring
```

---

## 📊 Local Storage Schema

```typescript
interface TajwidLocalData {
  userId: string;
  sessions: PracticeSession[];
  stats: {
    totalSessions: number;
    averageScore: number;
    bestScore: number;
    currentStreak: number;
    lastPracticeDate: string;
  };
  ayahProgress: {
    [ayahKey: string]: {
      practiceCount: number;
      bestScore: number;
      lastScore: number;
    };
  };
}
```

---

## 🚀 MVP Scope

### Included in MVP:
- ✅ Surah/Ayah selection
- ✅ Reference audio player
- ✅ Voice recording
- ✅ Whisper transcription
- ✅ Basic word matching
- ✅ Madd detection
- ✅ Score display
- ✅ Local progress storage

### NOT in MVP (Future):
- ❌ Full Tajwid rules (start with Madd only)
- ❌ Real-time waveform
- ❌ Advanced phoneme analysis
- ❌ Gamification/streaks
- ❌ Offline AI processing

---

## 💰 Cost Estimate

| Service | Cost |
|---------|------|
| OpenAI Whisper | ~$0.006/minute |
| 1 Ayah (~10 sec) | ~$0.001 |
| 100 Ayahs/day | ~$0.10/day |
| EveryAyah.com | FREE |

---

## 📅 Timeline

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 | Week 1 | Mobile UI |
| Phase 2 | Week 1-2 | Audio features |
| Phase 3 | Week 2 | Backend |
| Phase 4 | Week 3 | Integration |

---

*بسم الله - Ready to build! 🌙*
