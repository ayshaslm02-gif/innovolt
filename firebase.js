// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBeftm-belwgVO3v_pn6nSr5VlfnBsbd8w",
  authDomain: "memorybox-ae323.firebaseapp.com",
  projectId: "memorybox-ae323",
  storageBucket: "memorybox-ae323.appspot.com",
  messagingSenderId: "750123270929",
  appId: "1:750123270929:web:0faa0f8b9468774df002b0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };