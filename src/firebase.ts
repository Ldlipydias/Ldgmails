import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, onSnapshot, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

// Import config file statically (Vite handles this)
import firebaseConfigFromFile from '../firebase-applet-config.json';

// Use environment variables if available (for Netlify), otherwise use the config file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigFromFile.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigFromFile.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigFromFile.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigFromFile.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfigFromFile.firestoreDatabaseId
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  Timestamp
};
export type { FirebaseUser };
