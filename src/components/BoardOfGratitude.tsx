import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, limit, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { GratitudeMessage } from '../types';
import { Pin, Send, Trash2, Heart, MessageSquare, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playPostSound, playReactionSound, playSipSound } from '../lib/audio';

// Cozy sticky notes color definitions
const STICKY_COLORS = [
  { name: 'Warm Peach', bg: 'bg-[#FFEDD5] text-orange-950 hover:opacity-95', borderLine: 'border-l-4 border-orange-400', badge: 'bg-orange-400' },
  { name: 'Cream Honey', bg: 'bg-[#FEF9C3] text-yellow-950 hover:opacity-95', borderLine: 'border-l-4 border-yellow-400', badge: 'bg-yellow-400' },
  { name: 'Mint Latte', bg: 'bg-[#ECFCCB] text-green-950 hover:opacity-95', borderLine: 'border-l-4 border-green-400', badge: 'bg-green-400' },
  { name: 'Rose Petal', bg: 'bg-[#FCE7F3] text-pink-950 hover:opacity-95', borderLine: 'border-l-4 border-pink-400', badge: 'bg-pink-400' },
  { name: 'Banana Frost', bg: 'bg-[#FEF3C7] text-amber-950 hover:opacity-95', borderLine: 'border-l-4 border-amber-400', badge: 'bg-amber-400' },
];

export default function BoardOfGratitude() {
  const [messages, setMessages] = useState<GratitudeMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [selectedColor, setSelectedColor] = useState(STICKY_COLORS[0]);
  const [errorText, setErrorText] = useState('');
  const currentUser = auth.currentUser;

  useEffect(() => {
    // Listen to incoming sticky notes in real time, ordering by createdAt descending
    const q = query(
      collection(db, 'gratitude_messages'),
      orderBy('createdAt', 'desc'),
      limit(24)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs: GratitudeMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as GratitudeMessage);
      });
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'gratitude_messages');
    });

    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!messageText.trim()) {
      setErrorText("Say something supportive before sticking your card!");
      return;
    }

    if (messageText.trim().length > 300) {
      setErrorText("Keep notes sweet! Maximum 300 characters.");
      return;
    }

    if (!currentUser) return;

    try {
      const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const payload = {
        id: msgId,
        userId: currentUser.uid,
        authorName: currentUser.displayName || 'Supportive Facilitator',
        authorPhoto: currentUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.uid}`,
        content: messageText.trim(),
        color: selectedColor.name,
        createdAt: new Date().toISOString()
      };

      // Play soft tape stick chime sounds
      playPostSound();

      await addDoc(collection(db, 'gratitude_messages'), payload);
      setMessageText('');
    } catch (err) {
      console.error(err);
      setErrorText('Could not post gratitude note. Please try again!');
    }
  };

  const handleDelete = async (docId: string, authorId: string) => {
    if (authorId !== currentUser?.uid) return;
    try {
      playReactionSound();
      await deleteDoc(doc(db, 'gratitude_messages', docId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-[#F5EFDF] rounded-3xl p-6 shadow-inner relative overflow-hidden border border-[#E9E4DB] flex flex-col gap-6">
      {/* Dynamic Radial Background Dot Mesh */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#5A3E2B 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>

      <div className="flex items-center gap-2.5 border-b border-[#5A3E2B]/10 pb-3 relative z-10">
        <Pin className="w-5 h-5 text-[#A68A64] shrink-0" />
        <div>
          <h2 className="text-sm font-sans uppercase tracking-widest text-[#A68A64] font-bold">Wall of Gratitude</h2>
          <p className="text-[#3D2B1F]/70 text-xs italic font-serif">Pin custom sweet notes to thank your peer facilitators</p>
        </div>
      </div>

      {/* Sticky input builder */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#E9E4DB] p-4 rounded-2xl shadow-sm flex flex-col gap-3 relative z-10 font-sans">
        <div className="text-xs font-bold uppercase tracking-widest text-[#A68A64] flex justify-between items-center">
          <span>Draft your gratitude card</span>
          <span className={`text-[10px] font-mono ${messageText.length > 280 ? 'text-red-500' : 'opacity-70'}`}>
            {messageText.length}/300
          </span>
        </div>

        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="E.g., Thank you for holding down class block four, you saved my sanity! ☕ Or: Loved today's pep talk during homeroom!"
          rows={3}
          className="w-full bg-[#FDFBF7] text-sm border border-[#E9E4DB] rounded-xl px-3 py-2 text-[#3D2B1F] placeholder-[#A68A64]/50 focus:outline-none focus:ring-1 focus:ring-[#D4A373] font-serif"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Select Note Color */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#A68A64] mr-1">Note Tone:</span>
            <div className="flex gap-1.5">
              {STICKY_COLORS.map((col) => (
                <button
                  key={col.name}
                  type="button"
                  onClick={() => { playSipSound(); setSelectedColor(col); }}
                  className={`w-6 h-6 rounded-full border transition duration-150 relative cursor-pointer flex items-center justify-center ${col.badge} ${
                    selectedColor.name === col.name ? 'border-[#5A3E2B] scale-110 shadow-sm' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  title={col.name}
                >
                  {selectedColor.name === col.name && (
                    <div className="w-1.5 h-1.5 bg-[#5A3E2B] rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            id="pin_note_btn"
            className="flex items-center gap-1.5 px-4 py-1 bg-[#5A3E2B] hover:bg-[#A68A64] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Pin Note
          </button>
        </div>

        {errorText && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2.5 mt-1 font-sans">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorText}</span>
          </div>
        )}
      </form>

      {/* Board Listing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-1 mt-2 relative z-10 select-none">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, idx) => {
            const toneData = STICKY_COLORS.find(c => c.name === msg.color) || STICKY_COLORS[0];
            const rotationDegrees = ((idx % 3) - 1) * 1.5; // Slight cozy tilt degrees

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0, rotate: rotationDegrees }}
                exit={{ opacity: 0, scale: 0.85, y: -20, rotate: 0 }}
                layout
                className={`p-4 rounded-xl shadow-md border border-[#E9E4DB]/40 flex flex-col justify-between min-h-[140px] transform hover:scale-[1.03] hover:-translate-y-1 hover:shadow-lg transition duration-200 relative ${toneData.bg} ${toneData.borderLine}`}
              >
                {/* Decorative Pin header on the card */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-2.5 h-2.5 bg-[#5A3E2B] rounded-full border border-white shadow" />
                </div>

                {/* Main Card Content */}
                <div className="mb-4">
                  <p className="text-sm font-serif leading-relaxed italic text-[#3D2B1F] whitespace-pre-wrap select-text">
                    "{msg.content}"
                  </p>
                </div>

                {/* Colleague Profile metadata */}
                <div className="flex items-center justify-between border-t border-[#3D2B1F]/10 pt-2.5 mt-auto">
                  <div className="flex items-center gap-2">
                    <img
                      src={msg.authorPhoto || `https://api.dicebear.com/7.x/adventurer/svg?seed=${msg.userId}`}
                      alt={msg.authorName}
                      className="w-6 h-6 rounded-full border border-[#E9E4DB]/30 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[10px] font-sans uppercase font-bold tracking-wider opacity-75 text-[#3D2B1F] truncate max-w-[80px]">
                      {msg.authorName.split(' ')[0]}
                    </span>
                  </div>

                  {currentUser?.uid === msg.userId && (
                    <button
                      id={`delete_note_btn_${msg.id}`}
                      onClick={() => handleDelete(msg.id, msg.userId)}
                      className="p-1 hover:bg-[#5A3E2B]/10 rounded-lg text-[#5A3E2B] transition duration-150 cursor-pointer"
                      title="Remove sticky note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {messages.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-[#E9E4DB]/60 flex flex-col items-center justify-center gap-2">
            <MessageSquare className="w-7 h-7 text-[#A68A64]/40" />
            <p className="text-xs text-[#A68A64] font-serif italic">
              The gratitude wall is silent. Pin the first positive message!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
