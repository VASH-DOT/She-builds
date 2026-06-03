import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { StaffMilestone } from '../types';
import { playPostSound, playReactionSound } from '../lib/audio';
import { Cake, Trophy, Star, Plus, Trash2, CalendarCheck, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CelebrationCorner() {
  const [milestones, setMilestones] = useState<StaffMilestone[]>([]);
  const [title, setTitle] = useState('');
  const [dateText, setDateText] = useState('');
  const [type, setType] = useState<'birthday' | 'achievement' | 'milestone'>('birthday');
  const [isOpenForm, setIsOpenForm] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    // Listen to real-time celebration items, ordering recently posted first
    const q = query(
      collection(db, 'milestones'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list: StaffMilestone[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as StaffMilestone);
      });
      setMilestones(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'milestones');
    });

    return () => unsub();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('You must be signed in to broadcast a celebration!');
      return;
    }
    if (!title.trim() || !dateText.trim()) return;

    try {
      const payload = {
        id: `ms_${Date.now()}`,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Staff Colleague',
        title: title.trim(),
        type,
        dateText: dateText.trim(),
        createdAt: new Date().toISOString()
      };

      playPostSound();
      await addDoc(collection(db, 'milestones'), payload);
      
      setTitle('');
      setDateText('');
      setIsOpenForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (docId: string, authorId: string) => {
    if (authorId !== currentUser?.uid) return;
    try {
      playReactionSound();
      await deleteDoc(doc(db, 'milestones', docId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E9E4DB] flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between border-b border-[#E9E4DB] pb-3">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-[#A68A64] shrink-0" />
          <span className="text-xs uppercase tracking-widest text-[#A68A64] font-sans font-bold">Celebrations</span>
        </div>
        <button
          onClick={() => { playReactionSound(); setIsOpenForm(!isOpenForm); }}
          id="toggle_celebrate_form"
          className="text-[10px] font-sans uppercase font-bold tracking-wider text-[#A68A64] flex items-center gap-1 border border-[#E9E4DB] hover:border-[#A68A64] px-2.5 py-1 rounded-xl cursor-pointer transition duration-150"
        >
          <Plus className="w-3 h-3" />
          Announce
        </button>
      </div>

      {isOpenForm && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#F9F5EF] p-4 rounded-2xl border border-[#E9E4DB] flex flex-col gap-2.5"
        >
          <form onSubmit={handlePost} className="flex flex-col gap-2.5">
            <div>
              <label className="text-[9px] font-sans font-bold text-[#A68A64] uppercase block mb-1">What are we celebrating?</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Dave's 10th school anniversary!"
                maxLength={60}
                className="w-full bg-white text-xs border border-[#E9E4DB] rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#D4A373] text-[#3D2B1F]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-sans font-bold text-[#A68A64] uppercase block mb-1">When is it?</label>
                <input
                  type="text"
                  value={dateText}
                  onChange={(e) => setDateText(e.target.value)}
                  placeholder="E.g., June 15 or Today"
                  maxLength={20}
                  className="w-full bg-white text-xs border border-[#E9E4DB] rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#D4A373] text-[#3D2B1F]"
                />
              </div>
              <div>
                <label className="text-[9px] font-sans font-bold text-[#A68A64] uppercase block mb-1">Event Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-white text-xs border border-[#E9E4DB] rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#D4A373] text-[#3D2B1F] cursor-pointer"
                >
                  <option value="birthday">🎂 Birthday</option>
                  <option value="achievement">🏆 Achievement</option>
                  <option value="milestone">🌟 Milestone</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => setIsOpenForm(false)}
                className="px-2 py-1 text-[10px] text-[#5A3E2B] font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit_milestone_btn"
                className="px-3.5 py-1 bg-[#D4A373] text-white hover:bg-[#A68A64] rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-sm transition"
              >
                Broadcast
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Celebration items list */}
      <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {milestones.map((ms) => {
            const isBirthday = ms.type === 'birthday';
            const isAchievement = ms.type === 'achievement';

            return (
              <motion.div
                key={ms.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#FDFBF7] hover:bg-[#F9F5EF] border border-[#E9E4DB]/60 transition text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${
                    isBirthday ? 'bg-pink-100/70 text-pink-700' : isAchievement ? 'bg-amber-100/70 text-amber-700' : 'bg-[#E9EDC9] text-[#5A3E2B]'
                  }`}>
                    {isBirthday ? <Cake className="w-4 h-4" /> : isAchievement ? <Trophy className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold font-sans text-[#3D2B1F]">
                      {ms.title}
                    </div>
                    <div className="text-[10px] text-[#A68A64] flex items-center gap-1.5 leading-none mt-1 select-none">
                      <span className="font-bold text-[#3D2B1F]">{ms.dateText}</span>
                      <span>•</span>
                      <span>By {ms.userName.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>

                {currentUser?.uid === ms.userId && (
                  <button
                    onClick={() => handleDelete(ms.id, ms.userId)}
                    className="text-[#A68A64] hover:text-red-700 p-1 rounded transition shrink-0 cursor-pointer"
                    title="Delete milestone announcement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {milestones.length === 0 && (
          <div className="text-center py-6 text-[#A68A64] italic font-serif text-xs flex flex-col items-center gap-1.5">
            <Megaphone className="w-5 h-5 opacity-40 shrink-0" />
            No highlights announced yet.
          </div>
        )}
      </div>
    </div>
  );
}
