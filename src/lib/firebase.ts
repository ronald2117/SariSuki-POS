import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

// IMPORTANT: Replace this with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDPLXAhmI71Zl-eDMiMDypSBVqJF9IM0jo",
  authDomain: "sarisuki-pos.firebaseapp.com",
  projectId: "sarisuki-pos",
  storageBucket: "sarisuki-pos.firebasestorage.app",
  messagingSenderId: "177420897498",
  appId: "1:177420897498:web:fd564ac6c9d0975552e9e3",
  measurementId: "G-178BTMTB58"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  enableMultiTabIndexedDbPersistence(db)
    .then(() => {
      console.log("Firebase offline persistence enabled");
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn("Firebase offline persistence failed: Multiple tabs open or other issues.");
      } else if (err.code === 'unimplemented') {
        console.warn("Firebase offline persistence failed: Browser does not support all of the features required.");
      } else {
        console.error("Firebase offline persistence failed: ", err);
      }
    });
} else if (getApps().length) {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  // Fallback for server-side rendering or environments where Firebase might not be initialized client-side initially.
  // This might need adjustment based on how server components interact with Firebase.
  // For now, we assume client-side initialization is primary.
  // To avoid errors during SSR when window is not defined:
  // app = initializeApp(firebaseConfig); // This would error in SSR without checks
  // auth = getAuth(app);
  // db = getFirestore(app);
  // A better approach for SSR might involve admin SDK or deferring client-side specific init.
  // However, for this primarily client-side app, the above `if (typeof window !== 'undefined')` is key.
}

export { app, auth, db };
