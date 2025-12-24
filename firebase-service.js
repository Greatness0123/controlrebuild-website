import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    query, 
    where, 
    getDocs 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { 
    getAuth, 
    signInAnonymously, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Firebase Configuration
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
const db = getFirestore(app);
const auth = getAuth(app);

// Auto sign-in anonymously
signInAnonymously(auth).catch(console.error);

/**
 * Generate unique 12-character Entry ID
 */
function generateEntryId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Hash password (simple version - use bcrypt in production)
 */
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify Entry ID exists and get user data
 */
export async function verifyEntryID(entryId) {
    try {
        const normalized = entryId.replace(/[-\s]/g, '').toUpperCase();
        
        if (normalized.length !== 12) {
            return {
                success: false,
                message: 'Invalid Entry ID format'
            };
        }
        
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('entryId', '==', normalized));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return {
                success: false,
                message: 'Entry ID not found'
            };
        }
        
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        if (!userData.isActive) {
            return {
                success: false,
                message: 'Account has been deactivated'
            };
        }
        
        // Update last login
        await updateDoc(doc(db, 'users', userDoc.id), {
            lastLogin: new Date().toISOString(),
            lastLoginTimestamp: Date.now()
        });
        
        return {
            success: true,
            user: {
                id: userDoc.id,
                entryId: userData.entryId,
                name: userData.name,
                email: userData.email,
                plan: userData.plan,
                memberSince: userData.memberSince,
                tasksCompleted: userData.tasksCompleted || 0,
                hoursSaved: userData.hoursSaved || 0,
                successRate: userData.successRate || 0,
                passwordHash: userData.passwordHash
            }
        };
    } catch (error) {
        console.error('Entry ID verification error:', error);
        return {
            success: false,
            message: 'Verification failed. Please try again.'
        };
    }
}

/**
 * Get user by document ID
 */
export async function getUserById(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (!userDoc.exists()) {
            return {
                success: false,
                message: 'User not found'
            };
        }
        
        return {
            success: true,
            user: {
                id: userDoc.id,
                ...userDoc.data()
            }
        };
    } catch (error) {
        console.error('Get user error:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Get user by Entry ID
 */
export async function getUserByEntryId(entryId) {
    try {
        const normalized = entryId.replace(/[-\s]/g, '').toUpperCase();
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('entryId', '==', normalized));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return {
                success: false,
                message: 'User not found'
            };
        }
        
        const userDoc = querySnapshot.docs[0];
        return {
            success: true,
            user: {
                id: userDoc.id,
                ...userDoc.data()
            }
        };
    } catch (error) {
        console.error('Get user by entry ID error:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Create new user
 */
export async function createUser(userData) {
    try {
        const entryId = generateEntryId();
        const userRef = doc(collection(db, 'users'));
        
        // Hash password
        const passwordHash = await hashPassword(userData.password);
        
        await setDoc(userRef, {
            entryId: entryId,
            name: userData.name,
            email: userData.email,
            plan: userData.plan || 'Free Plan',
            memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            tasksCompleted: 0,
            hoursSaved: 0,
            successRate: 0,
            passwordHash: passwordHash,
            passwordLastChanged: new Date().toISOString(),
            isActive: true,
            createdAt: new Date().toISOString(),
            createdTimestamp: Date.now()
        });
        
        return {
            success: true,
            userId: userRef.id,
            entryId: entryId
        };
    } catch (error) {
        console.error('Create user error:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Update user data
 */
export async function updateUser(userId, updateData) {
    try {
        await updateDoc(doc(db, 'users', userId), {
            ...updateData,
            updatedAt: new Date().toISOString(),
            updatedTimestamp: Date.now()
        });
        
        return { success: true };
    } catch (error) {
        console.error('Update user error:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Change password
 */
export async function changePassword(userId, currentPassword, newPassword) {
    try {
        // Get user
        const userResult = await getUserById(userId);
        if (!userResult.success) {
            return userResult;
        }
        
        // Verify current password
        const currentHash = await hashPassword(currentPassword);
        if (currentHash !== userResult.user.passwordHash) {
            return {
                success: false,
                message: 'Current password is incorrect'
            };
        }
        
        // Hash new password
        const newHash = await hashPassword(newPassword);
        
        // Update password
        await updateDoc(doc(db, 'users', userId), {
            passwordHash: newHash,
            passwordLastChanged: new Date().toISOString()
        });
        
        return { success: true };
    } catch (error) {
        console.error('Change password error:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Authenticate user with Entry ID and password
 */
export async function authenticateUser(entryId, password) {
    try {
        const userResult = await getUserByEntryId(entryId);
        if (!userResult.success) {
            return {
                success: false,
                message: 'Invalid Entry ID or password'
            };
        }
        
        // Verify password
        const passwordHash = await hashPassword(password);
        if (passwordHash !== userResult.user.passwordHash) {
            return {
                success: false,
                message: 'Invalid Entry ID or password'
            };
        }
        
        // Update last login
        await updateDoc(doc(db, 'users', userResult.user.id), {
            lastLogin: new Date().toISOString(),
            lastLoginTimestamp: Date.now()
        });
        
        return {
            success: true,
            user: userResult.user
        };
    } catch (error) {
        console.error('Authentication error:', error);
        return {
            success: false,
            message: 'Authentication failed'
        };
    }
}

export { db, auth };
