import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, setDoc, query, limit, onSnapshot } from 'firebase/firestore';
import { StaffPresence } from '../types';
import { Users, Smile, Sprout } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PresenceList() {
  const [activeStaff, setActiveStaff] = useState<StaffPresence[]>([]);
  const currentUser = auth.currentUser;

  // 1. Periodically check-in current user presence status
  useEffect(() => {
    if (!currentUser) return;

    const userPresenceRef = doc(db, 'presence', currentUser.uid);

    const performCheckIn = async () => {
      try {
        await setDoc(userPresenceRef, {
          id: currentUser.uid,
          userId: currentUser.uid,
          userName: currentUser.displayName || 'Staff Facilitator',
          userPhoto: currentUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.uid}`,
          lastActiveAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Failed to log personal room presence', err);
      }
    };

    // Initial checkin
    performCheckIn();

    // Checkin loop every 2 minutes
    const interval = setInterval(() => {
      performCheckIn();
    }, 120000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // 2. Query other checked in staff in real time
  useEffect(() => {
    const q = query(
      collection(db, 'presence'),
      limit(30)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const liveList: StaffPresence[] = [];
      const cutoffTime = Date.now() - 10 * 60 * 1000; // 10 minutes presence cutoff

      snapshot.forEach((doc) => {
        const item = doc.data() as StaffPresence;
        const lastActiveTime = new Date(item.lastActiveAt).getTime();
        
        // Filter active contributors updated recently
        if (lastActiveTime > cutoffTime) {
          liveList.push(item);
        }
      });
      setActiveStaff(liveList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'presence');
    });

    return () => unsub();
  }, []);

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E9E4DB] flex flex-col gap-3">
      <div className="flex items-center gap-2 border-b border-[#E9E4DB] pb-2.5">
        <Users className="w-4 h-4 text-[#A68A64] shrink-0" />
        <span className="text-xs uppercase tracking-widest text-[#A68A64] font-sans font-bold">Sipping right now ({activeStaff.length})</span>
      </div>

      <div className="flex flex-wrap gap-2.5 max-h-[140px] overflow-y-auto pt-1">
        <AnimatePresence>
          {activeStaff.map((staff) => (
            <motion.div
              key={staff.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex items-center gap-2 bg-[#F9F5EF] hover:bg-[#F5EFDF] rounded-full pr-3 pl-1 py-1 border border-[#E9E4DB] shadow-sm transition duration-150 relative cursor-pointer"
              title={`${staff.userName} is online`}
            >
              <div className="relative">
                <img
                  src={staff.userPhoto}
                  alt={staff.userName}
                  className="w-7 h-7 rounded-full border border-transparent shrink-0"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#FDFBF7] rounded-full animate-ping" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-[#FDFBF7] rounded-full" />
              </div>
              <span className="text-xs font-bold text-[#3D2B1F] max-w-[120px] truncate font-sans">
                {staff.userName.split(' ')[0]}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {activeStaff.length === 0 && (
          <div className="col-span-full py-4 text-center text-[10px] text-[#A68A64] font-bold uppercase tracking-wider w-full flex items-center justify-center gap-1.5">
            <Smile className="w-3.5 h-3.5 shrink-0" />
            Just you in the coffee room, ready to connect!
          </div>
        )}
      </div>
    </div>
  );
}
