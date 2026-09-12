import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBP4aCuTWTrzmwEfSBrJO3v7Wwl9IKZiW8",
  authDomain: "sohojkaj-db.firebaseapp.com",
  projectId: "sohojkaj-db",
  storageBucket: "sohojkaj-db.firebasestorage.app",
  messagingSenderId: "664339778822",
  appId: "1:664339778822:web:e6cdf50a427fce962d2287",
  measurementId: "G-Y62R472CHB",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// ফায়ারস্টোর যাতে নেটওয়ার্ক রিকোয়েস্টে আটকে না থাকে তার জন্য ক্যাশ কনফিগারেশনসহ ইনিশিয়ালাইজ করা হলো
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
