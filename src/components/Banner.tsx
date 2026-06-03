import React, { useState, useEffect } from 'react';
import { auth, signOut } from '../lib/firebase';
import { audioControl } from '../lib/audio';
import { Volume2, VolumeX, LogOut, Coffee, Music, Heart } from 'lucide-react';
import { motion } from 'motion/react';

export default function Banner() {
  const [isMuted, setIsMuted] = useState(audioControl.getMuted());
  const user = auth.currentUser;

  const toggleMute = () => {
    const nextMute = !isMuted;
    audioControl.setMuted(nextMute);
    setIsMuted(nextMute);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#5A3E2B] text-[#FDFBF7] rounded-3xl p-5 border-2 border-[#D4A373]/30 flex flex-col md:flex-row items-center justify-between gap-4 mb-6 font-serif shadow-md"
    >
      <div className="flex items-center gap-4 text-center md:text-left">
        <div className="bg-[#D4A373] border-2 border-[#5A3E2B] p-3 rounded-full text-[#5A3E2B] shadow-md flex items-center justify-center">
          <span className="text-2xl select-none">☕</span>
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase">
            steepd – Sip, Listen, Connect ☕🎵
          </h1>
          <p className="text-xs md:text-sm text-[#FDFBF7]/80 font-sans mt-1">
            Where school facilitators pause, connect, and enjoy a warm moment together.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Toggle Sound Mute Button */}
        <button
          onClick={toggleMute}
          id="toggle_sound_btn"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-sans font-semibold tracking-wide uppercase transition duration-200 cursor-pointer shadow-sm ${
            isMuted 
              ? 'bg-[#5A3E2B]/50 text-red-100 border-red-800/40 hover:bg-[#5A3E2B]/70' 
              : 'bg-[#D4A373] text-white border-transparent hover:bg-[#A68A64]'
          }`}
          title={isMuted ? "Unmute cheerful sounds" : "Mute cheerful sounds"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-200" /> : <Volume2 className="w-4 h-4 text-white" />}
          <span>{isMuted ? 'Muted' : 'Sounds On'}</span>
        </button>

        {user && (
          <div className="flex items-center gap-3 bg-[#FDFBF7]/10 border border-[#FDFBF7]/20 rounded-2xl p-1.5 pr-3 pl-2 shadow-inner">
            <img 
              src={user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`} 
              alt={user.displayName || 'Staff avatar'} 
              className="w-8 h-8 rounded-full border border-[#D4A373]"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col text-left font-sans">
              <span className="text-xs font-bold text-[#FDFBF7] max-w-[120px] truncate">
                {user.displayName || 'Staff Member'}
              </span>
              <span className="text-[10px] text-[#FDFBF7]/60 leading-none">Facilitator</span>
            </div>

            <button
              id="logout_btn"
              onClick={handleLogout}
              className="ml-2 hover:bg-[#FDFBF7]/15 hover:text-white p-1 rounded-md text-[#FDFBF7]/80 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.header>
  );
}
