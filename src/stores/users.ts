import { defineStore } from 'pinia';
import { collection, getDocs, query, where } from 'firebase/firestore';

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/firebase/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

interface UserData {
  firstName: string;
  surname: string;
  username: string;
  email: string;
  password: string;
  // Add any other properties if needed
}

export const useUserStore = defineStore('user', {
  state: () => ({
    isEmailUnique: true,
    isUsernameUnique: true,
  }),

  actions: {
    async checkEmailUniqueness(email: string | null) {
      if (!email) {
        this.isEmailUnique = true;
        return;
      }

      const querySnapshot = await getDocs(
        query(collection(db, 'users'), where('email', '==', email))
      );

      this.isEmailUnique = querySnapshot.empty;
    },

    async checkUsernameUniqueness(username: string | null) {
      if (!username) {
        this.isUsernameUnique = true;
        return;
      }

      const querySnapshot = await getDocs(
        query(collection(db, 'users'), where('username', '==', username))
      );

      this.isUsernameUnique = querySnapshot.empty;
    },
    async registerUser(userData: UserData) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          userData.email,
          userData.password
        );

        const user = userCredential.user;

        const userDataToSave = {
          firstName: userData.firstName,
          surname: userData.surname,
          username: userData.username,
          email: userData.email,
          isAdmin: false,
        };

        // Save user data to Firestore
        await setDoc(doc(db, 'users', user.uid), userDataToSave);

        return user;
      } catch (error) {
        throw error; // Rethrow the error to handle it in the component
      }
    },
  },
});
