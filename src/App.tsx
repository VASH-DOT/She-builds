import React, { useState, useEffect } from 'react';
import { auth, authProvider, testConnection } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, Music, LogIn, BookOpen, Heart, Sparkles } from 'lucide-react';
import { playReactionSound } from './lib/audio';

// Components imports
import Banner from './components/Banner';
import CoffeeCup from './components/CoffeeCup';
import MusicBox from './components/MusicBox';
import BoardOfGratitude from './components/BoardOfGratitude';
import Reactions from './components/Reactions';
import DailyCorner from './components/DailyCorner';
import CelebrationCorner from './components/CelebrationCorner';
import PresenceList from './components/PresenceList';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginError, setLoginError] = useState('');

  // 1. Initial configuration connection warmups and state listener
  useEffect(() => {
    testConnection(); // warm-up Firebase ping on boot

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecking(false);
    }, (error) => {
      console.error('Auth state change error', error);
      setAuthChecking(false);
    });

    return () => unsub();
  }, []);

  const handleLogin = async () => {
    setLoginError('');
    try {
      playReactionSound();
      await signInWithPopup(auth, authProvider);
    } catch (err: any) {
      console.error('Google Sign-In failed', err);
      setLoginError(err?.message || 'Google Sign-In was cancelled or incomplete.');
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center select-none font-serif text-[#3D2B1F]">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="bg-[#5A3E2B] text-[#FDFBF7] p-5 rounded-full border-2 border-[#D4A373]/30 shadow-md mb-4 flex items-center justify-center"
        >
          <span className="text-3xl select-none">☕</span>
        </motion.div>
        <p className="text-sm font-sans font-bold uppercase tracking-widest text-[#A68A64]">Warming up Coffee Corner...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3D2B1F] py-8 px-4 sm:px-6 lg:px-8 font-serif select-none">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="login_card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto bg-white border border-[#E9E4DB] rounded-3xl p-8 shadow-sm text-center flex flex-col items-center justify-center mt-12 font-serif text-[#3D2B1F]"
          >
            {/* Logo animation */}
            <div className="relative mb-6">
              {/* Animated steam lines */}
              <div className="flex gap-1.5 justify-center mb-1 h-8">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-[#D4A373]/60 rounded-full"
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.4,
                    }}
                  />
                ))}
              </div>
              <div className="bg-[#5A3E2B] text-[#FDFBF7] p-5 rounded-full border-2 border-[#D4A373]/30 shadow-md relative z-10 flex items-center justify-center">
                <span className="text-3xl select-none">☕</span>
              </div>
              <div className="absolute inset-0 bg-[#D4A373]/10 blur-xl rounded-full" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase">
              Staff Coffee Corner
            </h1>
            <p className="text-xs font-sans font-bold text-[#A68A64] uppercase tracking-widest mt-2 mb-1.5">
              ☕ SIP. LISTEN. CONNECT. 🎵
            </p>
            <p className="text-sm font-sans text-[#3D2B1F]/80 leading-relaxed max-w-[320px] mb-8">
              A private digital lounge for school facilitators to pause, share kind words, and listen to music during breaks.
            </p>

            <button
              onClick={handleLogin}
              id="google_signin_btn"
              className="w-full flex items-center justify-center gap-3 bg-[#D4A373] hover:bg-[#A68A64] active:bg-[#5A3E2B] text-white py-3.5 px-6 rounded-2xl text-sm font-sans font-bold uppercase tracking-wider cursor-pointer shadow-sm transition duration-200"
            >
              <LogIn className="w-5 h-5 shrink-0" />
              Sign in with Google
            </button>

            {loginError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-xl mt-4 font-sans font-semibold">
                {loginError}
              </p>
            )}

            <div className="mt-8 border-t border-[#E9E4DB] pt-4 text-[10px] text-[#A68A64] font-sans font-bold uppercase tracking-wider max-w-[305px] leading-relaxed">
              Secure authentication guarantees high security, preventing spam and keeping comments friendly.
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto flex flex-col gap-6"
          >
            {/* Top Welcome Header Banner component */}
            <Banner />

            {/* Bento Grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT GENERAL COLUMN (Digital sips & stats reactions) [Span 5] */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* 1. Large animatable coffee cup */}
                <CoffeeCup />

                {/* 2. Real-time community mood reactions panel */}
                <Reactions />

                {/* 3. Who is present segment */}
                <PresenceList />

              </div>

              {/* RIGHT SOCIAL COLUMN (Wall of gratitude sticky notes, shared playlist sound and notices) [Span 7] */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* 1. Syncable collaborative music jukebox */}
                <MusicBox />

                {/* 2. Interactive message wall */}
                <BoardOfGratitude />

                {/* 3. Combined Quote widget & Challenge response */}
                <DailyCorner />

                {/* 4. Birthday notices shelf panel */}
                <CelebrationCorner />

              </div>

            </div>

            {/* Aesthetic human literal credits line */}
            <footer className="mt-8 border-t border-[#E9E4DB] pt-4 text-center">
              <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#A68A64]/70">
                Staff Coffee Corner • Designed with warmth for hard-working educators
              </p>
            </footer>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
