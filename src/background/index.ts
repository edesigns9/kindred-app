// Polyfill for libraries that expect 'window' to exist (even if not used)
if (typeof window === 'undefined') {
  (globalThis as any).window = globalThis;
}

import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';

console.log('Background script initialized. Kindred Sync Active.');

let currentRoomId: string | null = null;
let isHost: boolean = false;
let unsubRoom: (() => void) | null = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User is signed in:', user.uid);
  } else {
    console.log('User is signed out');
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SYNC_EVENT' && isHost && currentRoomId) {
    console.log('Received sync event from host:', message.payload);
    const { action, time } = message.payload;
    const roomRef = doc(db, 'rooms', currentRoomId);
    updateDoc(roomRef, { status: action, time, timestamp: Date.now() }).catch(console.error);
  } else if (message.type === 'SET_ROOM') {
    const { roomId, isHost: newIsHost } = message.payload;
    currentRoomId = roomId;
    isHost = newIsHost;
    
    if (unsubRoom) {
      unsubRoom();
      unsubRoom = null;
    }

    if (!isHost && currentRoomId) {
      const roomRef = doc(db, 'rooms', currentRoomId);
      unsubRoom = onSnapshot(roomRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (sender.tab?.id) {
            chrome.tabs.sendMessage(sender.tab.id, {
              type: 'REMOTE_COMMAND',
              payload: { action: data.status, time: data.time }
            }).catch(() => {});
          } else {
            // Need to query active tabs to send the remote command
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                  type: 'REMOTE_COMMAND',
                  payload: { action: data.status, time: data.time }
                }).catch(() => {});
              }
            });
          }
        }
      });
    }
    
    // Also notify the active tab's content script to be aware of the state
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, message).catch(() => {});
        }
    });
  }
});
