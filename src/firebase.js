import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, GoogleAuthProvider, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase web configuration is intentionally public. It identifies this web app;
// Firebase Authentication rules and authorized domains enforce access.
const firebaseConfig = {
  apiKey: 'AIzaSyDIltik-o9yMxTXcZi3UqwjJCTMYf-bX2Y',
  authDomain: 'aghar-updates.firebaseapp.com',
  projectId: 'aghar-updates',
  storageBucket: 'aghar-updates.firebasestorage.app',
  messagingSenderId: '394531274111',
  appId: '1:394531274111:web:045e81b87f4b95aed96e4a',
  measurementId: 'G-GXXZL6T51E',
};

const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
export const firestoreDb = getFirestore(firebaseApp);

// Firebase restores the Google session on the same browser/device after a refresh.
setPersistence(firebaseAuth, browserLocalPersistence).catch(() => {});
