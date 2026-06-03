import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { SharedSong } from '../types';
import { Play, Plus, Music, Disc, AlertCircle, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playReactionSound } from '../lib/audio';

function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function MusicBox() {
  const [currentSong, setCurrentSong] = useState<SharedSong | null>(null);
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to current song document in real time
    const unsub = onSnapshot(doc(db, 'songs', 'current'), (snapshot) => {
      if (snapshot.exists()) {
        setCurrentSong(snapshot.data() as SharedSong);
      } else {
        setCurrentSong(null);
      }
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'songs/current');
    });

    return () => unsub();
  }, []);

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!youtubeUrl.trim() || !songTitle.trim()) {
      setErrorText('Please fill out both the song title and link!');
      return;
    }

    const videoId = getYouTubeId(youtubeUrl);
    if (!videoId) {
      setErrorText('Invalid YouTube URL! Use a valid watch or share link.');
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    try {
      const newSong: SharedSong = {
        id: 'current',
        youtubeUrl: youtubeUrl.trim(),
        youtubeId: videoId,
        title: songTitle.trim(),
        addedByName: user.displayName || 'Staff Member',
        addedByPhoto: user.photoURL || undefined,
        addedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'songs', 'current'), newSong);
      
      // Play post click chime tone
      playReactionSound();
      
      // Clean up fields
      setYoutubeUrl('');
      setSongTitle('');
      setIsOpenForm(false);
    } catch (err) {
      console.error(err);
      setErrorText('Failed to sync song together.');
    }
  };

  return (
    <div className="bg-white text-[#3D2B1F] rounded-3xl p-6 border border-[#E9E4DB] shadow-sm flex flex-col justify-between min-h-[410px]">
      
      {/* Jukebox Title */}
      <div className="flex items-center justify-between border-b border-[#E9E4DB] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Disc className="w-5 h-5 animate-spin text-[#D4A373]" style={{ animationDuration: '6s' }} />
          <h2 className="text-xs uppercase tracking-widest text-[#A68A64] font-sans font-bold">Coffeehouse Tunes ☕🎵</h2>
        </div>
        <button
          onClick={() => { playReactionSound(); setIsOpenForm(!isOpenForm); }}
          id="toggle_song_form_btn"
          className="flex items-center gap-1.5 px-3 py-1 bg-[#D4A373] hover:bg-[#A68A64] active:bg-[#5A3E2B] text-white rounded-xl text-xs font-sans font-semibold transition cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Queue Song
        </button>
      </div>

      {isOpenForm ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#F9F5EF] border border-[#E9E4DB] p-4 rounded-2xl flex flex-col gap-3 font-sans text-left"
        >
          <div className="text-xs text-[#A68A64] font-semibold uppercase tracking-wider">
            Share active YouTube link
          </div>
          <form onSubmit={handleAddSong} className="flex flex-col gap-2.5">
            <div>
              <label className="text-[10px] text-[#A68A64] font-sans font-bold uppercase tracking-wider block mb-1">Song Title</label>
              <input
                type="text"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder="E.g., Chill lofi beats"
                className="w-full bg-white text-xs border border-[#E9E4DB] rounded-xl px-3 py-2 text-[#3D2B1F] placeholder-[#A68A64]/50 focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#A68A64] font-sans font-bold uppercase tracking-wider block mb-1">YouTube Video Link</label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-white text-xs border border-[#E9E4DB] rounded-xl px-3 py-2 text-[#3D2B1F] placeholder-[#A68A64]/50 focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
              />
            </div>

            {errorText && (
              <div className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 rounded-xl p-2 text-xs font-sans">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorText}</span>
              </div>
            )}

            <div className="flex gap-2 justify-end mt-2">
              <button
                type="button"
                onClick={() => setIsOpenForm(false)}
                className="px-3 py-1.5 border border-[#E9E4DB] text-[#5A3E2B] hover:bg-[#F5EFDF] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit_song_btn"
                className="px-4 py-1.5 bg-[#D4A373] hover:bg-[#A68A64] rounded-xl text-xs font-semibold text-white transition cursor-pointer"
              >
                Sync Jukebox
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 my-4 gap-6">
          {isLoading ? (
            <div className="text-[#A68A64] text-xs font-sans font-bold uppercase tracking-wider">Connecting with digital Jukebox...</div>
          ) : currentSong ? (
            <div className="flex flex-col items-center text-center w-full">
              {/* Rotating Vinyl Disc Record Player */}
              <div className="relative">
                {/* Turntable needle head / arm */}
                <motion.div
                  className="absolute top-[-26px] right-[-15px] z-20 origin-top"
                  initial={{ rotate: -25 }}
                  animate={{ rotate: 10 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{ transformOrigin: '20% 10%' }}
                >
                  <svg width="45" height="75" viewBox="0 0 45 75" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="8" y1="5" x2="25" y2="55" stroke="#A68A64" strokeWidth="4.5" strokeLinecap="round" />
                    <line x1="25" y1="55" x2="33" y2="72" stroke="#5A3E2B" strokeWidth="6" strokeLinecap="round" />
                    <circle cx="8" cy="5" r="7" fill="#5A3E2B" />
                  </svg>
                </motion.div>

                {/* Rotating Vinyl Disc */}
                <motion.div 
                  className="w-36 h-36 md:w-40 md:h-40 rounded-full bg-[#1A1A1A] border-4 border-[#5A3E2B] shadow-lg flex items-center justify-center relative overflow-hidden"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  {/* Etchings */}
                  <div className="absolute inset-4 rounded-full border border-gray-800" />
                  <div className="absolute inset-8 rounded-full border border-gray-800/80" />
                  <div className="absolute inset-12 rounded-full border border-gray-900" />
                  
                  {/* Centered Album Label */}
                  <div className="w-12 h-12 rounded-full bg-[#D4A373] border border-[#5A3E2B] flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-[#FDFBF7]" />
                  </div>
                </motion.div>
                
                {/* Spin Indicator */}
                <div className="absolute bottom-2 -right-1 bg-[#F9F5EF] text-[9px] font-sans tracking-widest font-bold uppercase border border-[#E9E4DB] px-1.5 py-0.5 rounded-lg shadow-sm">
                  33 RPM
                </div>
              </div>

              {/* Jukebox details */}
              <div className="mt-4 w-full">
                <div className="text-sm font-serif font-bold max-w-xs mx-auto truncate text-[#5A3E2B] flex items-center justify-center gap-1.5">
                  <Music className="w-4 h-4 text-[#D4A373] animate-bounce shrink-0" />
                  {currentSong.title}
                </div>
                
                <div className="text-[10px] text-[#A68A64] mt-1 font-sans font-bold uppercase tracking-widest">
                  Queued by <span className="text-[#3D2B1F]">{currentSong.addedByName}</span>
                </div>

                {/* Active YouTube Embed Player (Small sound box interface) */}
                <div className="mt-4 max-w-md mx-auto aspect-video rounded-2xl overflow-hidden border border-[#E9E4DB] shadow-md bg-black">
                  <iframe
                    id="youtube-player"
                    src={`https://www.youtube.com/embed/${currentSong.youtubeId}?autoplay=1`}
                    title={currentSong.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 flex flex-col items-center justify-center gap-3">
              <div className="p-4 bg-[#F9F5EF] rounded-full border border-[#E9E4DB]">
                <Music className="w-8 h-8 text-[#A68A64]" />
              </div>
              <p className="text-xs text-[#A68A64] font-medium font-serif italic">
                Silence is golden... but shared tracks are sweeter!
              </p>
              <button
                onClick={() => setIsOpenForm(true)}
                className="px-3.5 py-1.5 text-xs bg-[#D4A373] hover:bg-[#A68A64] text-white font-semibold rounded-xl shadow cursor-pointer transition duration-150"
              >
                Select background song
              </button>
            </div>
          )}
        </div>
      )}

      {/* Shared Jukebox Tip */}
      <div className="text-[10px] text-[#A68A64] font-sans font-bold uppercase tracking-widest border-t border-[#E9E4DB] pt-3 text-center">
        Syncs in real-time across staff browsers
      </div>
    </div>
  );
}
