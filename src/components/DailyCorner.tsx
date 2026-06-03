import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { ChallengeReply } from '../types';
import { playPostSound, playReactionSound } from '../lib/audio';
import { Quote, Sparkles, BookOpen, Send, Trash2, MessagesSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Synchronized curators indexable by day
const DAILY_QUOTES = [
  { text: "The art of teaching is the art of assisting discovery.", author: "Mark Van Doren" },
  { text: "No one is useless in this world who lightens the burdens of another.", author: "Charles Dickens" },
  { text: "Kindness is a passport that opens doors and fashions friends.", author: "Anonymous" },
  { text: "Alone we can do so little; together we can do so much.", author: "Helen Keller" },
  { text: "To teach is to learn twice over.", author: "Joseph Joubert" },
  { text: "Great things are done by a series of small things brought together.", author: "Vincent Van Gogh" },
  { text: "Every child deserves a champion: an adult who will never give up on them.", author: "Rita Pierson" },
];

const DAILY_CHALLENGES = [
  { id: 'success_story', title: "Daily break prompt", prompt: "Share one heartwarming student success story from this month." },
  { id: 'favorite_moment', title: "Weekly highlights", prompt: "What has been your absolute favorite classroom moment this week?" },
  { id: 'team_shoutout', title: "Teacher appreciation", prompt: "Give a quick shoutout to a fellow staff member who helped you recently." },
  { id: 'morning_routine', title: "Facilitators habits", prompt: "What is your secret morning routine trick to stay energetic?" },
  { id: 'funny_quote', title: "Classroom humor", prompt: "Share a funny, innocent thing a student said that made you laugh." },
];

export default function DailyCorner() {
  const [replies, setReplies] = useState<ChallengeReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const currentUser = auth.currentUser;

  // Deriving synchronized date index
  const today = new Date();
  const index = (today.getFullYear() + today.getMonth() + today.getDate()) % DAILY_QUOTES.length;
  const quote = DAILY_QUOTES[index];
  const challenge = DAILY_CHALLENGES[index % DAILY_CHALLENGES.length];

  useEffect(() => {
    // Listen to challenge answers for current challenge ID
    const q = query(
      collection(db, 'challenge_replies'),
      orderBy('createdAt', 'desc'),
      limit(15)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const activeReplies: ChallengeReply[] = [];
      snapshot.forEach((doc) => {
        const reply = { id: doc.id, ...doc.data() } as ChallengeReply;
        if (reply.challengeId === challenge.id) {
          activeReplies.push(reply);
        }
      });
      setReplies(activeReplies);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'challenge_replies');
    });

    return () => unsub();
  }, [challenge.id]);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUser) return;

    try {
      const payload = {
        id: `reply_${Date.now()}`,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Staff Colleague',
        userPhoto: currentUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.uid}`,
        content: replyText.trim(),
        challengeId: challenge.id,
        createdAt: new Date().toISOString()
      };

      playPostSound();
      await addDoc(collection(db, 'challenge_replies'), payload);
      setReplyText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReply = async (docId: string, authorId: string) => {
    if (authorId !== currentUser?.uid) return;
    try {
      playReactionSound();
      await deleteDoc(doc(db, 'challenge_replies', docId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-5 text-left">
      {/* Daily Quote Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-5 rounded-3xl border border-[#E9E4DB] shadow-sm flex items-start gap-4 font-serif"
      >
        <div className="bg-[#5A3E2B] text-[#FDFBF7] p-2.5 rounded-2xl shrink-0 mt-0.5 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-[#FDFBF7]" />
        </div>
        <div>
          <span className="text-[10px] font-sans tracking-widest uppercase font-bold text-[#A68A64] block mb-1">
            Quote of the Day
          </span>
          <p className="text-sm italic text-[#3D2B1F] font-medium leading-relaxed">
            "{quote.text}"
          </p>
          <span className="text-xs text-[#A68A64] font-bold block mt-1.5">
            — {quote.author}
          </span>
        </div>
      </motion.div>

      {/* Coffee Break Challenge */}
      <div className="bg-[#F9F5EF] border border-[#E9E4DB] rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3 select-none">
          <Sparkles className="w-5 h-5 text-[#A68A64] animate-pulse" />
          <h3 className="text-xs uppercase tracking-widest text-[#A68A64] font-sans font-bold">
            Break Challenge
          </h3>
        </div>

        <div className="bg-[#5A3E2B] text-[#FDFBF7] rounded-2xl p-4 mb-4 shadow border border-transparent font-serif">
          <p className="text-base italic leading-relaxed">
            "{challenge.prompt}"
          </p>
        </div>

        {/* Submit reply */}
        <form onSubmit={handleSubmitReply} className="flex gap-2 mb-4 font-sans">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Share your short break story..."
            maxLength={180}
            className="flex-1 bg-white text-xs border border-[#E9E4DB] rounded-xl px-3.5 py-2 text-[#3D2B1F] placeholder-[#A68A64]/50 focus:outline-none focus:ring-1 focus:ring-[#D4A373] font-serif"
          />
          <button
            type="submit"
            id="challenge_reply_submit"
            className="bg-[#D4A373] hover:bg-[#A68A64] text-white p-2.5 rounded-xl transition cursor-pointer shrink-0"
            title="Post story response"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Challenge Replies */}
        <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
          <AnimatePresence mode="popLayout">
            {replies.map((rep) => (
              <motion.div
                key={rep.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-start justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E9E4DB]/60 shadow-sm"
              >
                <div className="flex gap-2.5 items-start text-left font-sans">
                  <img
                    src={rep.userPhoto}
                    alt={rep.userName}
                    className="w-7 h-7 rounded-full border border-transparent"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="text-[10px] font-bold text-[#A68A64] uppercase tracking-wider">
                      {rep.userName}
                    </div>
                    <p className="text-xs text-[#3D2B1F] font-serif italic mt-0.5">
                      {rep.content}
                    </p>
                  </div>
                </div>

                {currentUser?.uid === rep.userId && (
                  <button
                    onClick={() => handleDeleteReply(rep.id, rep.userId)}
                    className="text-[#A68A64] hover:text-red-700 p-0.5 rounded cursor-pointer transition shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {replies.length === 0 && (
            <div className="text-center py-6 text-[#A68A64]/70 font-serif italic text-xs flex flex-col items-center gap-1.5">
              <MessagesSquare className="w-5 h-5 opacity-40 shrink-0" />
              Be the first to share your break story!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
