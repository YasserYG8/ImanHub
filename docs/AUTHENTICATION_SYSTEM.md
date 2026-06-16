# 🔐 Authentication System — Complete Guide

> **ImanHub** - Optional Authentication with Supabase

---

## 📖 Overview

ImanHub uses **optional authentication** for the best user experience:
- **Guest Mode**: Use most features without an account
- **Logged In**: Required for Tajwid progress sync

This is called **Progressive Authentication** - users can explore before committing.

---

## 🎯 Authentication Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    ImanHub App                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔓 NO LOGIN REQUIRED:                                      │
│  ├── 📖 Read Quran                                         │
│  ├── 🕌 Prayer Times                                        │
│  ├── 📿 Athkar & Duaa                                       │
│  ├── 🧭 Qibla Finder                                        │
│  ├── 📍 Mosque Finder                                       │
│  ├── 📚 Knowledge Hub                                       │
│  └── 🤖 AI Assistant                                        │
│                                                             │
│  🔐 LOGIN REQUIRED:                                         │
│  └── 🎤 Tajwid Practice (progress synced to cloud)         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Onboarding Flow (First-Time User)

### Screen 1: Language Selection
```
┌─────────────────────────────────────────┐
│              ImanHub                    │
│                                         │
│              🕌                         │
│      بسم الله الرحمن الرحيم             │
│                                         │
│      Welcome to ImanHub                 │
│                                         │
│     ┌─────────────────────────────┐    │
│     │   🌐 Select Language        │    │
│     │   ─────────────────────     │    │
│     │   ● العربية                 │    │
│     │   ○ English (coming soon)   │    │
│     │   ○ Français (coming soon)  │    │
│     └─────────────────────────────┘    │
│                                         │
│           [Continue →]                  │
│                                         │
└─────────────────────────────────────────┘
```

### Screen 2: Authentication Options
```
┌─────────────────────────────────────────┐
│          Create Account                 │
│                                         │
│    Save your progress & sync devices   │
│                                         │
│    ┌─────────────────────────────┐     │
│    │  🔵 Continue with Google    │     │
│    └─────────────────────────────┘     │
│    ┌─────────────────────────────┐     │
│    │  📘 Continue with Facebook  │     │
│    └─────────────────────────────┘     │
│    ┌─────────────────────────────┐     │
│    │  🍎 Continue with Apple     │     │
│    └─────────────────────────────┘     │
│    ┌─────────────────────────────┐     │
│    │  📧 Sign up with Email      │     │
│    └─────────────────────────────┘     │
│                                         │
│    ─────────── or ───────────          │
│                                         │
│       [Skip for now →]                  │
│                                         │
│    Already have account? [Login]       │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔄 User Flow Diagram

```
                    App Opens
                        │
                        ▼
                ┌───────────────┐
                │ First Time?   │
                └───────┬───────┘
                        │
           ┌────────────┴────────────┐
           │                         │
          YES                        NO
           │                         │
           ▼                         ▼
    ┌─────────────┐          ┌─────────────┐
    │  Language   │          │ Has Session?│
    │  Selection  │          └──────┬──────┘
    └──────┬──────┘                 │
           │               ┌────────┼────────┐
           ▼               │        │        │
    ┌─────────────┐     GUEST    USER     NONE
    │    Auth     │        │        │        │
    │   Screen    │        ▼        ▼        │
    └──────┬──────┘      Home    Home        │
           │            (Guest) (Logged)     │
    ┌──────┴──────┐                          │
    │             │                          │
 SIGN IN       SKIP                          │
    │             │                          │
    ▼             ▼                          │
 Supabase     Guest ID                       │
   Auth       Created                        │
    │             │                          │
    ▼             ▼                          │
   Home          Home  ◄─────────────────────┘
 (Logged)      (Guest)
```

---

## 👤 Two User Types

### Guest User
```
┌─────────────────────────────────────────────────────────────┐
│  GUEST USER (No account)                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Identifier: Device UUID (auto-generated)                  │
│  Storage: AsyncStorage (local phone only)                  │
│                                                             │
│  ✅ Can use:                                                │
│     • All Quran features                                   │
│     • Prayer times                                         │
│     • Athkar & Duaa                                        │
│     • Qibla & Mosques                                      │
│     • Knowledge Hub                                        │
│     • Tajwid (local progress only)                         │
│                                                             │
│  ❌ Cannot:                                                 │
│     • Sync data across devices                             │
│     • Recover data if app deleted                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Logged In User
```
┌─────────────────────────────────────────────────────────────┐
│  LOGGED IN USER (Has account)                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Identifier: Supabase User ID                              │
│  Storage: Supabase Database (cloud)                        │
│                                                             │
│  ✅ Can use:                                                │
│     • Everything guests can                                │
│     • Tajwid with cloud sync                               │
│     • Data backup                                          │
│     • Multi-device sync                                    │
│                                                             │
│  ⭐ Benefits:                                               │
│     • Progress never lost                                  │
│     • Switch devices seamlessly                            │
│     • Future: leaderboards, community                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Supabase Setup

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Sign up (free tier available)
3. Create new project
4. Get your credentials:
   - `Project URL`
   - `Anon Key`

### 2. Configure OAuth Providers

#### Google OAuth:
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google
3. Get OAuth credentials from Google Cloud Console
4. Add redirect URL

#### Facebook OAuth:
1. Go to Facebook Developers
2. Create app
3. Get App ID and Secret
4. Add to Supabase

### 3. Environment Variables
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 💻 Code Implementation

### Supabase Client Setup
```typescript
// utils/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Auth Context
```typescript
// context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';

interface AuthState {
  isLoading: boolean;
  isGuest: boolean;
  user: User | null;
  guestId: string | null;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isGuest: false,
    user: null,
    guestId: null,
  });

  useEffect(() => {
    checkSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setState({
            isLoading: false,
            isGuest: false,
            user: session.user,
            guestId: null,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    // Check if guest
    const isGuest = await AsyncStorage.getItem('isGuest');
    if (isGuest === 'true') {
      const guestId = await AsyncStorage.getItem('guestId');
      setState({
        isLoading: false,
        isGuest: true,
        user: null,
        guestId,
      });
      return;
    }

    // Check Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setState({
        isLoading: false,
        isGuest: false,
        user: session.user,
        guestId: null,
      });
    } else {
      // No session - needs onboarding
      setState({
        isLoading: false,
        isGuest: false,
        user: null,
        guestId: null,
      });
    }
  };

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Auth Functions
```typescript
// utils/auth.ts
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';

// Google Sign In
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'imanhub://auth/callback',
    },
  });
  return { data, error };
}

// Facebook Sign In
export async function signInWithFacebook() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: 'imanhub://auth/callback',
    },
  });
  return { data, error };
}

// Email Sign Up
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

// Email Sign In
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

// Skip (Guest Mode)
export async function continueAsGuest() {
  const guestId = await Application.getInstallationIdAsync();
  await AsyncStorage.setItem('isGuest', 'true');
  await AsyncStorage.setItem('guestId', guestId);
  return { guestId };
}

// Sign Out
export async function signOut() {
  await supabase.auth.signOut();
  await AsyncStorage.removeItem('isGuest');
  await AsyncStorage.removeItem('guestId');
}

// Check if needs auth for feature
export async function checkAuthForFeature(feature: string) {
  const isGuest = await AsyncStorage.getItem('isGuest');
  
  const protectedFeatures = ['tajwid-sync'];
  
  if (protectedFeatures.includes(feature) && isGuest === 'true') {
    return { needsAuth: true };
  }
  
  return { needsAuth: false };
}
```

---

## 🗄️ Database Schema (Supabase)

```sql
-- Users table (auto-created by Supabase Auth)
-- auth.users

-- User profiles (additional data)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'ar',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tajwid practice sessions
CREATE TABLE public.tajwid_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  surah_number INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  score INTEGER NOT NULL,
  text_accuracy INTEGER,
  tajwid_accuracy INTEGER,
  mistakes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress
CREATE TABLE public.tajwid_progress (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  total_sessions INTEGER DEFAULT 0,
  average_score REAL DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_practice DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tajwid_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tajwid_progress ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own sessions" ON public.tajwid_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.tajwid_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## 📁 File Structure

```
athkar-app/
├── app/
│   ├── (auth)/                    # Auth screens
│   │   ├── _layout.tsx            # Auth layout
│   │   ├── onboarding.tsx         # Language selection
│   │   ├── login.tsx              # Login screen
│   │   └── register.tsx           # Sign up screen
│   │
│   ├── (tabs)/                    # Main app (protected)
│   │   └── ...
│   │
│   └── _layout.tsx                # Root layout with auth check
│
├── context/
│   └── AuthContext.tsx            # Auth state management
│
├── utils/
│   ├── supabase.ts                # Supabase client
│   └── auth.ts                    # Auth helper functions
│
└── components/
    └── auth/
        ├── SocialButton.tsx       # Google/Facebook button
        ├── EmailForm.tsx          # Email sign up form
        └── AuthGuard.tsx          # Protect routes
```

---

## 🔐 Session Persistence

### How it works:
```
App Opens
    │
    ▼
Check AsyncStorage
    │
    ├── isGuest = 'true'?  → Load as Guest
    │
    ├── Check Supabase session
    │       │
    │       ├── Valid session? → Load as User
    │       │
    │       └── No session? → Show Onboarding
    │
    └── First time? → Show Onboarding
```

### Session stored in:
- **Guest**: AsyncStorage (`isGuest`, `guestId`)
- **User**: Supabase handles automatically

---

## 🚀 MVP Scope

### MVP (Phase 0):
- ✅ Language selection (Arabic only)
- ✅ Google Sign-In
- ✅ Skip for Guest mode
- ✅ Session persistence
- ✅ Basic profile

### V2 (Later):
- ⬜ Facebook Sign-In
- ⬜ Apple Sign-In
- ⬜ Email/Password
- ⬜ Password reset
- ⬜ Email verification
- ⬜ More languages

---

## 📦 Required Packages

```bash
npm install @supabase/supabase-js
npm install react-native-url-polyfill
npm install expo-auth-session expo-crypto expo-web-browser
```

---

## 🔗 Useful Links

- Supabase Dashboard: https://supabase.com/dashboard
- Supabase Docs: https://supabase.com/docs
- Expo Auth: https://docs.expo.dev/guides/authentication/
- Google OAuth Setup: https://supabase.com/docs/guides/auth/social-login/auth-google

---

*🔐 Secure authentication for ImanHub 🌙*
