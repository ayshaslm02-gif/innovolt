import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

/* ==============================
   FIREBASE CONFIG
============================== */

const firebaseConfig = {
  apiKey: "AIzaSyBeftm-belwgVO3v_pn6nSr5VlfnBsbd8w",
  authDomain: "memorybox-ae323.firebaseapp.com",
  projectId: "memorybox-ae323",
  storageBucket: "memorybox-ae323.appspot.com",
  messagingSenderId: "750123270929",
  appId: "1:750123270929:web:0faa0f8b9468774df002b0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ==============================
   LOGIN SYSTEM
============================== */

window.signUp = async function () {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  await addDoc(collection(db, "users"), { username, password });
  alert("Account Created 💕");
};

window.login = async function () {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const q = query(
    collection(db, "users"),
    where("username", "==", username),
    where("password", "==", password)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    alert("Invalid Login ❌");
  } else {
    localStorage.setItem("currentUser", username);
    window.location.href = "dashboard.html";
  }
};

window.logout = function () {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
};

/* ==============================
   DASHBOARD LOAD
============================== */

window.loadMemories = async function () {

  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser) {
    window.location.href = "index.html";
    return;
  }

  const q = query(
    collection(db, "memories"),
    where("owner", "==", currentUser)
  );

  const snapshot = await getDocs(q);
  const container = document.getElementById("memories");

  if (!container) return;

  container.innerHTML = "";

  snapshot.forEach(docSnap => {
    container.innerHTML += `
      <div class="memory-card">
        <h3 onclick="openMemory('${docSnap.id}')">
          ${docSnap.data().title}
        </h3>
        <button onclick="editMemory('${docSnap.id}')">Edit ✏</button>
      </div>
    `;
  });
};

window.openMemory = function (id) {
  window.location.href = "memory.html?id=" + id;
};

window.editMemory = function (id) {
  window.location.href = "add.html?id=" + id;
};

/* ==============================
   ADD ENTRY BLOCK (MULTIPLE)
============================== */

window.addEntry = function () {

  const container = document.getElementById("entriesContainer");

  const entryDiv = document.createElement("div");
  entryDiv.className = "entry-block";

  entryDiv.innerHTML = `
    <textarea placeholder="Write your message..." class="entry-message"></textarea>
    <input type="file" class="entry-image">
  `;

  container.appendChild(entryDiv);
};
window.loadEditMemory = async function () {

  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");

  if (!editId) return;

  const docRef = doc(db, "memories", editId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById("title").value = data.title;
  document.getElementById("unlockDate").value = data.unlockDate;
  document.getElementById("secretPassword").value = data.secretPassword || "";

  const container = document.getElementById("entriesContainer");
  container.innerHTML = "";

  data.entries.forEach(entry => {

    const entryDiv = document.createElement("div");
    entryDiv.className = "entry-block";
    entryDiv.setAttribute("data-old-image", entry.imageURL || "");

    entryDiv.innerHTML = `
      <textarea class="entry-message">${entry.message}</textarea>
      <input type="file" class="entry-image">
      ${entry.imageURL ? `<img src="${entry.imageURL}" style="max-width:120px; margin-top:10px;">` : ""}
    `;

    container.appendChild(entryDiv);
  });

  document.querySelector("button[onclick='saveMemory()']").innerText = "Update Memory 💖";
};

/* ==============================
   CLOUDINARY UPLOAD
============================== */

async function uploadToCloudinary(file) {

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "memoryboxupload");

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/drg9sm4fq/image/upload",
    {
      method: "POST",
      body: formData
    }
  );

  const data = await response.json();
  console.log("Cloudinary Response:", data);

  if (!response.ok) {
    alert("Image upload failed ❌");
    return null;
  }

  return data.secure_url;
}

/* ==============================
   SAVE MEMORY (MULTIPLE ENTRIES)
============================== */

window.saveMemory = async function () {

  const title = document.getElementById("title").value;
  const unlockDate = document.getElementById("unlockDate").value;
  const secretPassword = document.getElementById("secretPassword").value;
  const currentUser = localStorage.getItem("currentUser");

  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");

  const entryBlocks = document.querySelectorAll(".entry-block");

  let entries = [];

  for (let block of entryBlocks) {

    const message = block.querySelector(".entry-message").value;
    const file = block.querySelector(".entry-image").files[0];

    let imageURL = block.getAttribute("data-old-image") || null;

    if (file) {
      imageURL = await uploadToCloudinary(file);
    }

    entries.push({
      message,
      imageURL
    });
  }

  if (editId) {

    const docRef = doc(db, "memories", editId);

    await updateDoc(docRef, {
      title,
      unlockDate,
      secretPassword: secretPassword || null,
      owner: currentUser,
      entries
    });

    alert("Memory Updated 💖");

  } else {

    await addDoc(collection(db, "memories"), {
      title,
      unlockDate,
      secretPassword: secretPassword || null,
      owner: currentUser,
      entries
    });

    alert("Memory Created 💖");
  }

  window.location.href = "dashboard.html";
};
/* ==============================
   LOAD SINGLE MEMORY
============================== */

window.loadSingleMemory = async function () {

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) return;

  const docRef = doc(db, "memories", id);
  const snap = await getDoc(docRef);

  if (!snap.exists()) return;

  const data = snap.data();

  if (data.secretPassword) {
    const entered = prompt("Enter Secret Password 🔐");
    if (entered !== data.secretPassword) {
      alert("Wrong Password ❌");
      window.location.href = "dashboard.html";
      return;
    }
  }

  document.getElementById("title").innerText = data.title;

  const container = document.getElementById("content");
  container.innerHTML = "";

  data.entries.forEach(entry => {

    container.innerHTML += `
      <div style="margin-bottom:25px;">
        ${entry.imageURL ? `<img src="${entry.imageURL}" style="max-width:100%; border-radius:15px;">` : ""}
        <p style="margin-top:10px;">${entry.message}</p>
      </div>
    `;
  });
};