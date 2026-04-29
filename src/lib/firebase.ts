import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  serverTimestamp,
  addDoc,
  increment,
  limit
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCK7Ukv-Vnvkx1Zo7R4BvnPUXF1TZua_Wk",
  authDomain: "eskinao2.firebaseapp.com",
  projectId: "eskinao2",
  storageBucket: "eskinao2.firebasestorage.app",
  messagingSenderId: "812443002634",
  appId: "1:812443002634:web:74ad07098727f3969dbcf3"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  serverTimestamp,
  addDoc,
  increment,
  limit,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut
};
