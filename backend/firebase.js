const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBP4aCuTWTrzmwEfSBrJO3v7Wwl9IKZiW8",
  authDomain: "sohozkaj-db.firebaseapp.com",
  projectId: "sohozkaj-db",
  storageBucket: "sohozkaj-db.firebasestorage.app",
  messagingSenderId: "664339778822",
  appId: "1:664339778822:web:e6cdf50a427fce962d2287",
  measurementId: "G-Y62R472CHB",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = { db };
