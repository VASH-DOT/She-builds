import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { playReactionSound } from '../lib/audio';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

const REACTION_TYPES = [
  { id: 'energized', emoji: '☕', label: 'Energized', color: 'hover:bg-amber-100 text-amber-900 border-amber-200' },
  { id: 'appreciated', emoji: '❤️', label: 'Appreciated', color: 'hover:bg-rose-100 text-rose-900 border-rose-200' },
  { id: 'inspired', emoji: '🌟', label: 'Inspired', color: 'hover:bg-yellow-100 text-yellow-950 border-yellow-200' },
  { id: 'supported', emoji: '🤗', label: 'Supported', color: 'hover:bg-emerald-100 text-emerald-950 border-emerald-200' },
];

export default function Reactions() {
  const [counts, setCounts] = useState<Record<string, number>>({
    energized: 0,
    appreciated: 0,
    inspired: 0,
    supported: 0,
  });
  const [popEmoji, setPopEmoji] = useState<{ id: string; emoji: string; x: number; y: number } | null>(null);

  useEffect(() => {
    // Listen to real-time updates for reaction documents
    const unsubs = REACTION_TYPES.map((reaction) => {
      return onSnapshot(doc(db, 'reactions', reaction.id), (snapshot) => {
        if (snapshot.exists()) {
          setCounts((prev) => ({
            ...prev,
            [reaction.id]: snapshot.data().count || 0,
          }));
        } else {
          // Document does not exist yet. Initialize it lazily (handled silently)
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `reactions/${reaction.id}`);
      });
    });

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  const handleReact = async (id: string, emoji: string, e: React.MouseEvent<HTMLButtonElement>) => {
    // Trigger audio tone chime immediately
    playReactionSound();

    // Spawn floating emoji indicator
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = -10;
    const popId = `${id}_${Date.now()}`;
    setPopEmoji({ id: popId, emoji, x, y });

    const currentCount = counts[id] || 0;
    try {
      // Create or update the count in Firestore
      await setDoc(doc(db, 'reactions', id), {
        id,
        count: currentCount + 1,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to update reaction counts', err);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E9E4DB] flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#E9E4DB] pb-3">
        <span className="text-xs uppercase tracking-widest text-[#A68A64] font-sans font-bold">Colleague Room Vibes</span>
        <span className="text-[10px] font-sans uppercase font-bold tracking-wider text-[#A68A64]/70">Tap to react</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative">
        {REACTION_TYPES.map((reaction) => (
          <button
            key={reaction.id}
            id={`react_btn_${reaction.id}`}
            onClick={(e) => handleReact(reaction.id, reaction.emoji, e)}
            className="flex flex-col items-center justify-center p-3 bg-[#FDFBF7] border border-[#E9E4DB] rounded-2xl shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer relative overflow-visible"
          >
            <motion.span 
              whileTap={{ scale: 1.4 }}
              className="text-2xl mb-1 filter drop-shadow"
            >
              {reaction.emoji}
            </motion.span>
            
            <span className="text-xs font-sans mt-0.5 text-[#3D2B1F] font-bold leading-none">
              {reaction.label}
            </span>

            <span className="text-[10px] font-mono bg-[#F9F5EF] border border-[#E9E4DB]/80 text-[#5A3E2B] px-1.5 py-0.5 rounded-full font-bold mt-1.5 min-w-[24px] text-center">
              {counts[reaction.id] || 0}
            </span>
          </button>
        ))}

        {/* Floating Pops */}
        <AnimatePresence>
          {popEmoji && (
            <motion.div
              key={popEmoji.id}
              initial={{ opacity: 1, scale: 0.8, y: popEmoji.y }}
              animate={{ opacity: 0, scale: 2.2, y: popEmoji.y - 120, x: popEmoji.x + (Math.random() * 40 - 20) }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              onAnimationComplete={() => setPopEmoji(null)}
              className="absolute pointer-events-none text-2xl z-45"
            >
              {popEmoji.emoji}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
