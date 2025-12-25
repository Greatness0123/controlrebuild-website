// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Your Firebase Configuration - REPLACE WITH YOUR ACTUAL CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDSdp2kTxfS1YYxneulH7JeobGbHOdsjgc",
  authDomain: "control-rebuild.firebaseapp.com",
  projectId: "control-rebuild",
  storageBucket: "control-rebuild.firebasestorage.app",
  messagingSenderId: "978116999118",
  appId: "1:978116999118:web:924c440301d9d30adcdd9f",
  measurementId: "G-NLFSE2CG06"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// User authentication and management functions
export async function signUpUser(email, password, userData) {
    try {
        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;

        // Save user data to Firestore
        await setDoc(doc(db, "users", userId), {
            id: userId,
            email: email,
            ...userData,
            createdAt: new Date(),
            isActive: true
        });

        console.log("User created successfully:", userId);
        return {
            success: true,
            userId: userId,
            user: userCredential.user
        };
    } catch (error) {
        console.error("Signup error:", error);
        return {
            success: false,
            message: error.message
        };
    }
}

export async function signInUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;

        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, "users", userId));
        
        if (userDoc.exists()) {
            return {
                success: true,
                user: userDoc.data()
            };
        } else {
            return {
                success: false,
                message: "User data not found"
            };
        }
    } catch (error) {
        console.error("Login error:", error);
        return {
            success: false,
            message: error.message
        };
    }
}

export async function signOutUser() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error("Logout error:", error);
        return { success: false, message: error.message };
    }
}

export async function getUserById(userId) {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            return {
                success: true,
                user: userDoc.data()
            };
        } else {
            return {
                success: false,
                message: "User not found"
            };
        }
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

export async function getUserByEmail(email) {
    try {
        const q = query(collection(db, "users"), where("email", "==", email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            return {
                success: true,
                user: querySnapshot.docs[0].data()
            };
        } else {
            return {
                success: false,
                message: "User not found"
            };
        }
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

export async function updateUser(userId, updateData) {
    try {
        await updateDoc(doc(db, "users", userId), {
            ...updateData,
            updatedAt: new Date()
        });
        
        return { success: true };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

export function generateUserId() {
    // Generate a 12-digit ID with numbers only
    let result = '';
    for (let i = 0; i < 12; i++) {
        result += Math.floor(Math.random() * 10);
    }
    return result;
}

export { auth, db };
