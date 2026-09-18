import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  FirebaseUser,
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from '../lib/firebase';
import { AuthUserProfile, UserRole } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: AuthUserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<FirebaseUser | null>;
  signOut: () => Promise<void>;
  setUserRole: (newRole: UserRole, department?: string, subRole?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signInWithGoogle: async () => null,
  signOut: async () => {},
  setUserRole: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<AuthUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            const newProf: AuthUserProfile = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'Warga Peduli',
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              role: 'warga',
              department: 'Masyarakat Umum',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userRef, newProf);
            setUserProfile(newProf);
          } else {
            const data = snap.data() as AuthUserProfile;
            setUserProfile({
              ...data,
              role: data.role === 'petugas' ? 'petugas' : 'warga',
            });
          }
        } catch (e) {
          console.warn('Firestore profile sync error:', e);
          setUserProfile({
            uid: currentUser.uid,
            displayName: currentUser.displayName || 'Warga Peduli',
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            role: 'warga',
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      throw err;
    }
  };

  const setUserRole = async (
    newRole: UserRole,
    department = newRole === 'petugas' ? 'Dinas Pekerjaan Umum & Tata Kota' : 'Masyarakat Umum',
    subRole = newRole === 'petugas' ? 'Petugas Dinas' : 'Warga Terverifikasi'
  ): Promise<void> => {
    if (!user) return;
    const updatedProfile: AuthUserProfile = {
      uid: user.uid,
      displayName: userProfile?.displayName || user.displayName || 'Pengguna',
      email: user.email,
      photoURL: user.photoURL,
      role: newRole,
      department,
      subRole,
      createdAt: userProfile?.createdAt || new Date().toISOString(),
    };

    setUserProfile(updatedProfile);

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, updatedProfile, { merge: true });
    } catch (e) {
      console.warn('Failed to update user role in Firestore:', e);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Sign Out Error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signInWithGoogle,
        signOut,
        setUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
