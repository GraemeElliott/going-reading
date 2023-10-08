import { defineStore } from 'pinia';
import { User } from 'firebase/auth'; // Import User type
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { setPersistence, browserLocalPersistence } from 'firebase/auth';

interface UserData {
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  isAdmin: boolean;
}

async function fetchUserDataFromServer() {
  try {
    const response = await fetch('/api/user'); // Replace with your API endpoint
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    userData: null as UserData | null,
  }),

  actions: {
    async initialize() {
      try {
        await setPersistence(auth, browserLocalPersistence);
        const user = auth.currentUser;
        if (!user) return;

        this.user = user;

        const docRef = doc(db, 'users', user.uid);
        const docSnapshot = await getDoc(docRef);

        if (docSnapshot.exists()) {
          const userDataFromFirestore = (docSnapshot.data() as UserData) || {};
          this.userData = userDataFromFirestore;
        }
      } catch (error) {
        console.error('Error setting session persistence:', error);
      }
    },
    async signIn(email: string, password: string) {
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        this.user = userCredential.user;
        await this.initialize();
        return true;
      } catch {
        console.error('Error signing in');
        return false;
      }
    },
    async signOut() {
      try {
        await signOut(auth); // Use the imported signOut function
        this.user = null; // Clear the user state
        this.userData = null; // Clear the user's data
        return true; // Sign-out successful
      } catch (error) {
        console.error('Error signing out:', error);
        return false; // Sign-out failed
      }
    },
    async fetchUserData() {
      const cachedUserData = localStorage.getItem('userData');

      if (cachedUserData) {
        // If cached data exists, parse and set it in the store
        this.userData = JSON.parse(cachedUserData);
      } else {
        // Fetch user data from an API or other source
        const userData = await fetchUserDataFromServer();

        // Cache the user data in localStorage
        localStorage.setItem('userData', JSON.stringify(userData));

        // Set the user data in the store
        this.userData = userData;
      }
    },
  },
});
