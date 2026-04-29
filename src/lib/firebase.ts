import { initializeApp } from 'firebase/app';
import { getAuth, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services with environment check
// We check for ServiceWorkerGlobalScope to be sure we are in the background worker
const isServiceWorker = typeof self !== 'undefined' && 'ServiceWorkerGlobalScope' in self;

export const auth = !isServiceWorker
  ? getAuth(app)
  : initializeAuth(app, { persistence: indexedDBLocalPersistence });

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
