import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playSipSound } from '../lib/audio';
import { Coffee, Sparkles } from 'lucide-react';

const MESSAGES = [
  "Take a mindful sip ☕",
  "You deserve this break!",
  "Thank you for shaping young minds.",
  "Your patience is absolute magic. ✨",
  "A nice warm cup for a wonderful educator!",
  "School is brighter because of you. 🌟",
  "Deep breath in, deep breath out... sip!",
  "Loved today's energy! Keep rising.",
  "Awesome job helping colleagues out today! 🤗",
  "Your smiles have a ripple effect on students."
];

export default function CoffeeCup() {
  const [activeMessage, setActiveMessage] = useState(MESSAGES[0]);
  const [isSipping, setIsSipping] = useState(false);
  const [sipCounter, setSipCounter] = useState(0);

  const handleSip = () => {
    if (isSipping) return;
    
    // Play our cheerful synthesized sip bubble sound
    playSipSound();
    
    // Trigger animations and cycle message
    setIsSipping(true);
    const randomIndex = Math.floor(Math.random() * MESSAGES.length);
    setActiveMessage(MESSAGES[randomIndex]);
    setSipCounter((prev) => prev + 1);

    setTimeout(() => {
      setIsSipping(false);
    }, 800); // Animation duration
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#E9E4DB] shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden h-[410px]">
      
      {/* Decorative Warm Backlighting */}
      <div className="absolute w-44 h-44 rounded-full bg-[#D4A373]/10 blur-3xl -z-10 pointer-events-none" />

      {/* Decorative Floating Steaming Lines */}
      <div className="flex gap-2.5 mb-3 pointer-events-none h-14" style={{ transform: 'translateY(12px)' }}>
        {[0, 1, 2].map((idx) => (
          <motion.div
            key={idx}
            className="w-1 bg-[#D4A373]/40 rounded-full"
            style={{ width: '4px' }}
            animate={{
              y: [0, -32, 0],
              height: [20, 45, 20],
              opacity: [0.2, 0.9, 0.2],
              scaleX: [1, 1.6, 1],
            }}
            transition={{
              duration: 2.8 + idx * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: idx * 0.5,
            }}
          />
        ))}
      </div>

      {/* Main Coffee Cup Interactive Container */}
      <div className="relative cursor-pointer select-none py-4" onClick={handleSip} id="main_coffee_cup">
        <motion.div
          animate={
            isSipping 
              ? { scale: [1, 0.85, 1.05, 1], rotate: [0, -8, 5, 0] } 
              : { y: [0, -4, 0] }
          }
          transition={
            isSipping 
              ? { duration: 0.8, ease: "easeInOut" } 
              : { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }
          className="relative filter drop-shadow-xl"
        >
          {/* Stylized SVG Cup */}
          <svg
            width="170"
            height="115"
            viewBox="0 0 170 115"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-[#5A3E2B] transition"
          >
            {/* Cup Handle */}
            <path
              d="M130 35C152 35 158 55 155 70C152 82 132 85 130 85"
              stroke="#5A3E2B"
              strokeWidth="11"
              strokeLinecap="round"
            />
            {/* Main Cup Body */}
            <path
              d="M20 20C20 20 24 95 38 102C52 109 110 109 122 102C134 95 138 20 138 20"
              fill="#D4A373" // Sandy/Golden warm body
              stroke="#5A3E2B" // Deep brown outline
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Cozy Ribbon Wrap (Gold) */}
            <path
              d="M23.5 50C23.5 50 45 56 79 56C113 56 134.5 50 134.5 50V68C134.5 68 113 74 79 74C45 74 23.5 68 23.5 68V50Z"
              fill="#A68A64"
              stroke="#5A3E2B"
              strokeWidth="4"
            />
            {/* Warm Coffee Foam Layer inside Rim */}
            <ellipse cx="79" cy="20" rx="55" ry="9" fill="#FDFBF7" stroke="#5A3E2B" strokeWidth="4" />
            <ellipse cx="79" cy="20" rx="43" ry="5.5" fill="#D4A373" />
          </svg>

          {/* Sparkles on Click */}
          <AnimatePresence>
            {isSipping && (
              <>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 1, y: -40 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute top-0 left-4 text-amber-500"
                >
                  <Sparkles className="w-5 h-5 fill-current" />
                </motion.div>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.3, opacity: 1, x: 50, y: -20 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute top-4 left-10 text-[#D4A373]"
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Small Shadow Pool below the cup */}
        <div className="w-24 h-2 bg-[#5A3E2B]/10 rounded-full mx-auto blur-sm mt-1 filter translate-x-[-12px]" />
      </div>

      {/* Sips Counter */}
      <div className="mt-2 text-xs font-sans font-semibold bg-[#F9F5EF] text-[#5A3E2B] px-3 py-1 rounded-full border border-[#E9E4DB] shadow-inner flex items-center gap-1.5 select-none">
        <span className="text-sm">☕</span>
        Sips completed: <span className="text-[#D4A373] text-sm font-bold">{sipCounter}</span>
      </div>

      {/* Dynamic Cheerful Quote Prompt Banner */}
      <div className="mt-5 h-[72px] flex items-center justify-center max-w-[320px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMessage}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="text-[#5A3E2B] font-serif font-medium italic text-sm md:text-base leading-relaxed bg-[#F9F5EF]/80 border border-[#E9E4DB] shadow-sm rounded-2xl px-4 py-3"
          >
            {activeMessage}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-[10px] text-[#A68A64] font-sans font-bold uppercase tracking-widest mt-1.5 pointer-events-none">
        Click the cup to sip together
      </p>
    </div>
  );
}
