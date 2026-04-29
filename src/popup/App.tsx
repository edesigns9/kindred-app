import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [roomId, setRoomId] = useState('');
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsub;
  }, []);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const createRoom = React.useCallback(async () => {
    if (!user) return;
    try {
      const newRoomId = crypto.randomUUID().substring(0, 6).toUpperCase();
      await setDoc(doc(db, 'rooms', newRoomId), {
        hostId: user.uid,
        status: 'pause',
        time: 0,
        createdAt: new Date().toISOString()
      });
      setCurrentRoom(newRoomId);
      setIsHost(true);
      notifyContentScript(newRoomId, true);
    } catch (e: any) {
      setError(e.message);
    }
  }, [user]);

  const joinRoom = async () => {
    if (!user || !roomId) return;
    try {
      const roomSnap = await getDoc(doc(db, 'rooms', roomId));
      if (!roomSnap.exists()) {
        setError('Room not found');
        return;
      }
      setCurrentRoom(roomId);
      setIsHost(false);
      notifyContentScript(roomId, false);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const notifyContentScript = async (roomId: string, isHost: boolean) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'SET_ROOM',
        payload: { roomId, isHost }
      }).catch(err => console.log('Background script not reachable:', err));
    }
  };

  if (!user) {
    return (
      <div className="relative h-full text-white overflow-hidden p-6 flex flex-col justify-center">
        <div className="atmosphere"></div>
        <div className="glass-card rounded-2xl p-8 flex flex-col shadow-2xl relative z-10 w-full animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-500/20">K</div>
                <div>
                    <h1 className="text-xl font-semibold leading-none mb-1">Kindred</h1>
                    <p className="text-xs text-zinc-400">v3.0.4 • Manifest V3</p>
                </div>
            </div>
          <p className="text-zinc-400 mb-8 text-sm leading-relaxed">Log in to sync your favorite streams perfectly with friends across the globe.</p>
          <button onClick={login} className="w-full bg-zinc-100 text-black hover:bg-white font-bold uppercase tracking-wider text-sm py-3 rounded-xl transition-all hover:scale-[1.02] shadow-xl">
            Authenticate
          </button>
          {error && <p className="text-red-400 mt-4 text-xs font-mono text-center">{error}</p>}
        </div>
      </div>
    );
  }

  if (currentRoom) {
    return (
      <div className="relative h-full text-white p-5 flex flex-col gap-4">
        <div className="atmosphere"></div>
        
        <nav className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20">K</div>
                <div>
                    <h1 className="text-base font-semibold leading-none mb-0.5">Kindred</h1>
                    <p className="text-[10px] text-zinc-400">Party Active</p>
                </div>
            </div>
            {isHost && (
                <div className="flex items-center gap-2 bg-black/60 px-2 py-1 rounded-md border border-white/10">
                    <div className="status-dot"></div>
                    <span className="text-[10px] font-mono uppercase tracking-wider">Host</span>
                </div>
            )}
        </nav>

        <div className="glass-card rounded-2xl flex-1 p-5 flex flex-col shadow-2xl relative z-10">
            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-4 mb-6">
                <div className="text-[10px] uppercase tracking-widest text-indigo-400 mb-2 font-bold">Room Code</div>
                <div className="flex justify-between items-center">
                    <span className="text-2xl font-mono tracking-[0.2em] font-black">{currentRoom}</span>
                    <button className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider transition-colors" onClick={() => navigator.clipboard.writeText(currentRoom)}>Copy</button>
                </div>
            </div>

            <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 bg-zinc-700 rounded-full border-2 border-indigo-500 flex items-center justify-center font-bold text-zinc-400">
                          {user.uid.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 rounded-full border-2 border-[#0a0a0c]"></div>
                    </div>
                    <div>
                        <p className="text-sm font-medium">You <span className="text-[10px] bg-indigo-600 px-1.5 py-0.5 rounded ml-2 uppercase tracking-tighter">{isHost ? 'Host' : 'Viewer'}</span></p>
                        <p className="text-xs text-zinc-500">{isHost ? 'Master Controller' : 'Synced to Host'}</p>
                    </div>
                </div>
            </div>
            
            {!isHost && (
                <div className="flex gap-2 mb-4">
                    <div className="flex-1 glass-card rounded-xl p-3 flex flex-col gap-1 text-center">
                        <span className="text-[9px] uppercase tracking-widest text-zinc-500">Protocol</span>
                        <p className="text-sm font-mono text-indigo-400">HTML5-v3</p>
                    </div>
                    <div className="flex-1 glass-card rounded-xl p-3 flex flex-col gap-1 text-center">
                        <span className="text-[9px] uppercase tracking-widest text-zinc-500">Status</span>
                        <p className="text-sm font-mono text-emerald-400">Synced</p>
                    </div>
                </div>
            )}

            <button onClick={() => { setCurrentRoom(null); setIsHost(false); }} className="w-full py-3 bg-zinc-100 text-black font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-white transition-all hover:scale-[1.02]">
                Leave Session
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full text-white p-6 flex flex-col justify-center">
        <div className="atmosphere"></div>
        <div className="glass-card rounded-2xl p-6 flex flex-col shadow-2xl relative z-10 w-full animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-500/20">K</div>
                <div>
                    <h1 className="text-xl font-semibold leading-none mb-1">Kindred</h1>
                    <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Connected • Manifest V3</p>
                </div>
            </div>

            <button onClick={createRoom} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 mb-6">
                Create Party Room
            </button>
            
            <div className="flex items-center space-x-3 mb-6 opacity-60">
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-600 to-zinc-600 flex-1"></div>
                <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">Or Join</span>
                <div className="h-px bg-gradient-to-l from-transparent via-zinc-600 to-zinc-600 flex-1"></div>
            </div>

            <div className="flex flex-col gap-3">
                <input 
                    type="text" 
                    value={roomId} 
                    onChange={e => setRoomId(e.target.value.toUpperCase())} 
                    placeholder="ENTER 6-CHAR CODE" 
                    className="w-full bg-black/40 border border-zinc-700/50 rounded-xl px-4 py-3 text-white font-mono tracking-widest text-center focus:outline-none focus:border-indigo-500 focus:bg-black/60 transition-colors uppercase placeholder:text-zinc-600"
                    maxLength={6}
                />
                <button onClick={joinRoom} className="w-full text-zinc-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white font-bold uppercase tracking-wider text-xs py-3.5 rounded-xl transition-all">
                    Join Session
                </button>
            </div>
            
            {error && <p className="text-red-400 mt-4 text-xs font-mono text-center">{error}</p>}
        </div>
    </div>
  );
}
