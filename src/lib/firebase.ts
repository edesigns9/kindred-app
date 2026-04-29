import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebaseApp() {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth() {
  if (!auth) {
    const appInstance = getFirebaseApp();
    // Use a more robust check for Service Worker context
    const isServiceWorker = typeof ServiceWorkerGlobalScope !== 'undefined' && self instanceof ServiceWorkerGlobalScope;
    
    if (isServiceWorker) {
      console.log('Firebase Auth: Initializing for Service Worker');
      auth = initializeAuth(appInstance, { 
        persistence: indexedDBLocalPersistence 
      });
    } else {
      console.log('Firebase Auth: Initializing for Window');
      auth = getAuth(appInstance);
    }
  }
  return auth;
}

export function getFirebaseFirestore() {
  if (!db) {
    db = getFirestore(getFirebaseApp(), firebaseConfig.firestoreDatabaseId);
  }
  return db;
}
