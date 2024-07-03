import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCiBhZWkkmOs2E2-old7sDZ_IX6aL3v1S4",
  authDomain: "pussy-kobe.firebaseapp.com",
  databaseURL: "https://pussy-kobe-default-rtdb.firebaseio.com",
  projectId: "pussy-kobe",
  storageBucket: "pussy-kobe.appspot.com",
  messagingSenderId: "92486714869",
  appId: "1:92486714869:android:b84d3880eaa9123a0a8cbc"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage };
