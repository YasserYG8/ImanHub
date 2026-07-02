# 🕌 Tajweed Coach — End-to-End MVP System Design

This document details the system design, learning roadmaps, AI evaluation pipelines, data models, and backend structures for **Tajweed Coach**, an AI-powered Quran recitation companion.

---

## 🏗️ 1. System Architecture

The MVP system consists of three simple components: the **Mobile App Client** (Expo/React Native), the **Backend Application Server** (Express or FastAPI), and the **AI Processing Services** (OpenAI Whisper + LLM Translation/Explanation).

```mermaid
graph TD
    %% Client Layer
    subgraph "📱 Mobile App Client (Expo / React Native)"
        UI["Calm Spiritual UI (Tajawal/Amiri)"]
        AudioRec["Voice Recorder (expo-av)"]
        RefPlay["Reference Player (EveryAyah)"]
        LocalStore["Local State (AsyncStorage)"]
    end

    %% Network Boundary
    UI <-->|REST API / JSON| Router
    AudioRec -->|Upload Audio (M4A/WAV)| UploadAPI

    %% Backend Layer
    subgraph "⚙️ Backend Application Server"
        Router["Express / FastAPI Router"]
        UploadAPI["Audio Upload Handler"]
        AlignEngine["Text Alignment Engine (String Diff/DTW)"]
        RuleEval["Tajweed Rule Evaluator (MVP focus rule)"]
        Scorer["Scoring Engine (Correctness & Fluency)"]
        FBMaker["LLM Feedback Generator"]
    end

    %% External AI APIs
    subgraph "🤖 AI & Media APIs"
        Whisper["OpenAI Whisper API (Transcription + Timestamps)"]
        EveryAyah["EveryAyah.com (Husary Recitation)"]
        LLM["AI Explanation Model"]
    end

    %% Interactions
    RefPlay <-->|Stream MP3| EveryAyah
    UploadAPI -->|Send Audio File| Whisper
    Whisper -->|Verbose JSON Response| AlignEngine
    FBMaker -->|Prompt and Stats| LLM
```

---

## 🧭 2. MVP Workflow Explanation

```
[ User Selects Lesson ]
        │
        ▼
[ Fetch Lesson Data ] ──► (Quran text, focus rule, target audio)
        │
        ▼
[ View & Listen ] ──► (Listen to Husary recitation from EveryAyah)
        │
        ▼
[ Record Voice ] ──► (Record native audio on mobile device)
        │
        ▼
[ Send to Backend ] ──► (POST /api/recitation/evaluate)
        │
        ▼
[ Speech-to-Text ] ──► (Transcribe with Whisper, fetch word-level durations)
        │
        ▼
[ Align & Diff ] ──► (Detect omitted, extraneous, or mispronounced words)
        │
        ▼
[ Apply Focus Rule ] ──► (Verify only the lesson's target rule)
        │
        ▼
[ Compile Results ] ──► (Compute score + construct LLM friendly advice)
        │
        ▼
[ Display UI Details ] ──► (Render colors and interactive word cards)
        │
        ▼
[ Roadmap Update ] ──► (Unlock next node if score >= passScore)
```

---

## 📚 3. Learning Roadmap System

Rather than a straight Surah-by-Surah reader, the program follows a **Skill-Based Progression Path** comprised of 12 distinct levels:

| Level | Level Name | Key Skill Objective | Target Ayah / Phrase | Focus Rule |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Arabic Letters | Proper Makharij basics | ق، ك، ع، ح | Letter pronunciation |
| **2** | Harakat | Vowel lengths (Fatha, Damma, Kasra) | كَتَبَ | Short vowels |
| **3** | Sukoon & Shaddah | Joining letters and emphasis | رَبِّ العَالَمِينَ | Letter stress |
| **4** | Basic Fluency | Continuous word reading | هُدًى لِلْمُتَّقِينَ | Joining words |
| **5** | Simple Phrases | Reading short sentences | صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ | Verse transitions |
| **6** | Surah Al-Fatiha | Full opening surah verification | بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ | Surah fluency |
| **7** | Surah Al-Ikhlas | Sincerity surah verification | قُلْ هُوَ اللَّهُ أَحَدٌ | Qalqalah basics |
| **8** | Tajweed Intro | Understanding Madd basics | جَاءَ، السَّمَاءِ | Madd Wajib/Ja'iz |
| **9** | Ghunnah Practice | Holding nasalizations | إِنَّ، عَمَّ | Ghunnah (2 beats) |
| **10** | Ikhfa & Idgham | Merging and hiding letters | مَنْ يَقُولُ، مِنْ خَوْفٍ | Noon Sakinah |
| **11** | Full Surah practice | Short Juz Amma surahs | Surah Al-Kawthar / Al-Asr | Flow and correctness |
| **12** | Mastery Stage | Advanced reading and consistency | Surah An-Nasr / Al-Masad | Full Tajweed integration |

---

## 🎙️ 4. AI Processing Pipeline Breakdown

To keep the system modular and scalable, the pipeline divides audio analysis and feedback into 6 isolated layers:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. Audio Processing Layer                                               │
│    - Convert user upload format to 16kHz mono WAV                       │
│    - Normalize amplitude and filter low-frequency background noise       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. Speech Recognition Layer                                             │
│    - Pass processed WAV to OpenAI Whisper API with prompt "ar" (Arabic) │
│    - Request 'verbose_json' to retrieve word-level timestamps           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. Alignment Engine                                                     │
│    - Compare user transcription against expected Quranic text           │
│    - Run a string distance algorithm (Levenshtein) to isolate:          │
│      - Omitted words (missingWords)                                     │
│      - Extra spoken words (extraWords)                                  │
│      - Mispronounced words (wrongWords)                                 │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. Basic Tajweed Evaluation (MVP Focus)                                 │
│    - Evaluate only the lesson's target rule (e.g. Madd, Ghunnah)        │
│    - Verify the word's acoustic duration at the target rule position    │
│      (e.g., did the user hold the Ghunnah word for ~1.5 - 2.0 seconds?) │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. Scoring Engine                                                       │
│    - Accuracy Score (70%): Diffs between words (wrong/missing penalties)│
│    - Fluency/Rule Score (30%): Focus rule performance                   │
│    - Overall Score = (Accuracy × 0.7) + (Rule × 0.3)                    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. Feedback Generator                                                   │
│    - Synthesize scoring stats, wrong words, and rule evaluation into    │
│      an LLM explanation prompt.                                         │
│    - LLM returns a warm, coaching response in Arabic (not technical).    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 5. Lesson Data Model

```json
{
  "lessonId": 8,
  "levelId": 3,
  "title": "Madd Basics Practice",
  "objective": "Extend the Madd Al-Muttasil letter sound for 4-5 beats",
  "ayah": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  "focusRule": "madd",
  "difficulty": "beginner",
  "passScore": 85,
  "nextLessonId": 9,
  "referenceAudio": "https://everyayah.com/data/Husary_Muallim_128kbps/001001.mp3"
}
```

---

## 📊 6. Output Result Format

```json
{
  "score": 87,
  "missingWords": [],
  "extraWords": [],
  "wrongWords": [
    {
      "word": "الرحمن",
      "issue": "short pronunciation",
      "index": 2
    }
  ],
  "focusRuleEvaluation": {
    "rule": "madd",
    "status": "needs improvement",
    "details": "The Madd in 'الرحمن' was cut short (measured 0.8s, target is 1.5s+)"
  },
  "feedbackSummary": "تلاوتك ممتازة وواضحة! انتبه فقط لمد حرف الألف في كلمة 'الرحمن' ومده بمقدار حركتين بشكل كامل لتجويد صحيح."
}
```

---

## 💻 7. Minimal Backend Structure Suggestion

A clean, single-file backend architecture using **Express.js** and **Multer** for handling files:

```javascript
// server.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const OpenAI = require('openai');

const app = express();
const upload = multer({ dest: 'uploads/' });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());

app.post('/api/recitation/evaluate', upload.single('audio'), async (req, res) => {
    try {
        const { lessonId, expectedText, focusRule } = req.body;
        const audioFile = req.file;

        if (!audioFile) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        // 1. Send to OpenAI Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioFile.path),
            model: "whisper-1",
            language: "ar",
            response_format: "verbose_json"
        });

        // Clean temp file
        fs.unlinkSync(audioFile.path);

        // 2. Align user text with expected text (Levenshtein Diff)
        const userText = transcription.text;
        const analysis = compareRecitation(userText, expectedText);

        // 3. Evaluate focus rule
        const ruleEval = checkFocusRule(transcription.words, expectedText, focusRule);

        // 4. Calculate Final Score
        const score = calculateScore(analysis, ruleEval);

        // 5. Generate LLM Feedback explanation
        const feedback = await generateLLMFeedback(score, analysis.wrongWords, ruleEval);

        res.json({
            score,
            missingWords: analysis.missingWords,
            extraWords: analysis.extraWords,
            wrongWords: analysis.wrongWords,
            focusRuleEvaluation: ruleEval,
            feedbackSummary: feedback
        });

    } catch (error) {
        console.error('API Evaluation failed:', error);
        res.status(500).json({ error: 'Internal evaluation engine crash' });
    }
});

app.listen(3000, () => console.log('Tajweed Coach Backend running on port 3000'));
```
