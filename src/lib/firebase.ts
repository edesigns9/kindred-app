import { initializeApp } from 'firebase/app';
import { getAuth, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services with environment check
export const auth = typeof window !== 'undefined'
  ? getAuth(app)
  : initializeAuth(app, { persistence: indexedDBLocalPersistence });

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
