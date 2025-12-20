import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAgp7O2jnHZ6rRZOVewQviAaOmj_OBpFA8",
    authDomain: "ankimath-4d06e.firebaseapp.com",
    projectId: "ankimath-4d06e",
    storageBucket: "ankimath-4d06e.firebasestorage.app",
    messagingSenderId: "884537737084",
    appId: "1:884537737084:web:9408ce69102ad733ab6ef9"
};

let app;
let db;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase initialized");
} catch (e) {
    console.error("Firebase init error:", e);
}

// 測試連線
async function testConnection() {
    try {
        // 嘗試讀取一個集合 (假設 users 存在或空)
        const querySnapshot = await getDocs(collection(db, "users"), limit(1));
        console.log("DB Connection Verified");
        return true;
    } catch (e) {
        console.error("DB Connection Failed:", e);
        return false;
    }
}

export { db, testConnection };
