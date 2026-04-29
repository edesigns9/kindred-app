/**
 * Kindred Service Worker Entry Point
 */
import '../lib/polyfill';
import { getFirebaseAuth, getFirebaseFirestore } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';

console.log('Kindred Background script initialized.');

let currentRoomId: string | null = null;
let isHost: boolean = false;
let unsubRoom: (() => void) | null = null;

onAuthStateChanged(getFirebaseAuth(), (user) => {
  if (user) {
    console.log('User is signed in:', user.uid);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SYNC_EVENT' && isHost && currentRoomId) {
    console.log('Received sync event from host:', message.payload);
    const { action, time } = message.payload;
    const db = getFirebaseFirestore();
    const roomRef = doc(db, 'rooms', currentRoomId);
    updateDoc(roomRef, { status: action, time, timestamp: Date.now() }).catch(console.error);
  } else if (message.type === 'SET_ROOM') {
    currentRoomId = message.payload.roomId;
    isHost = message.payload.isHost;
    console.log(`Background state updated: Room ${currentRoomId}, Host: ${isHost}`);

    if (unsubRoom) {
      unsubRoom();
      unsubRoom = null;
    }

    if (!isHost && currentRoomId) {
      const db = getFirebaseFirestore();
      const roomRef = doc(db, 'rooms', currentRoomId);
      unsubRoom = onSnapshot(roomRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          console.log('Sending sync command to content scripts:', data);
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
              chrome.tabs.sendMessage(tabs[0].id, {
                type: 'SYNC_COMMAND',
                payload: {
                  action: data.status,
                  time: data.time,
                },
              });
            }
          });
        }
      });
    }
  }
  sendResponse({ success: true });
  return true;
});

