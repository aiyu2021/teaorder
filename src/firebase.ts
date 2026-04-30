import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

// Verify connection
async function testConnection() {
  try {
    // Attempt to read a dummy doc to check connection
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Firebase connected successfully");
  } catch (error: any) {
    if (error.message?.includes('offline')) {
      console.error("Firebase is offline. Check your configuration.");
    } else {
      // It's fine if the doc doesn't exist, as long as it's not a connection error
      console.log("Firebase connection established");
    }
  }
}

testConnection();
