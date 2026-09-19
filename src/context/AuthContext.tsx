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
  user: FirebaseUser | any;
  userProfile: AuthUserProfile | null;
  loading: boolean;
  isGoogleModalOpen: boolean;
  setIsGoogleModalOpen: (open: boolean) => void;
  signInWithGoogle: () => Promise<FirebaseUser | any>;
  signInWithGooglePopupDirect: () => Promise<FirebaseUser | any>;
  loginWithGoogleProfile: (profile: {
    displayName: string;
    email: string;
    photoURL?: string;
    role?: UserRole;
  }) => void;
  signOut: () => Promise<void>;
  setUserRole: (newRole: UserRole, department?: string, subRole?: string) => Promise<void>;
}

const AUTH_STORAGE_KEY = 'laporinfra_auth_session_user';

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isGoogleModalOpen: false,
  setIsGoogleModalOpen: () => {},
  signInWithGoogle: async () => null,
  signInWithGooglePopupDirect: async () => null,
  loginWithGoogleProfile: () => {},
  signOut: async () => {},
  setUserRole: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | any>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.user || null;
      }
    } catch (e) {
      console.warn('Failed reading auth storage:', e);
    }
    return null;
  });

  const [userProfile, setUserProfile] = useState<AuthUserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.userProfile || null;
      }
    } catch (e) {
      console.warn('Failed reading auth profile storage:', e);
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState<boolean>(false);

  // Sync session changes to localStorage
  const persistSession = (u: any, prof: AuthUserProfile | null) => {
    try {
      if (u && prof) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: u, userProfile: prof }));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed persisting auth session:', e);
    }
  };

  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userRef);
          let prof: AuthUserProfile;
          if (!snap.exists()) {
            prof = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'Warga Peduli',
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              role: 'warga',
              department: 'Masyarakat Umum',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userRef, prof).catch(() => {});
          } else {
            const data = snap.data() as AuthUserProfile;
            prof = {
              ...data,
              role: data.role === 'petugas' ? 'petugas' : 'warga',
            };
          }
          setUserProfile(prof);
          persistSession(currentUser, prof);
        } catch (e) {
          console.warn('Firestore profile sync error (using local fallback):', e);
          const fallbackProf: AuthUserProfile = {
            uid: currentUser.uid,
            displayName: currentUser.displayName || 'Warga Peduli',
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            role: 'warga',
          };
          setUserProfile(fallbackProf);
          persistSession(currentUser, fallbackProf);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Native Firebase Google Sign-In Popup
  const signInWithGooglePopupDirect = async (): Promise<FirebaseUser | any> => {
    const result = await signInWithPopup(auth, googleProvider);
    const u = result.user;
    setUser(u);
    const prof: AuthUserProfile = {
      uid: u.uid,
      displayName: u.displayName || 'Pengguna Google',
      email: u.email,
      photoURL: u.photoURL,
      role: 'warga',
      createdAt: new Date().toISOString()
    };
    setUserProfile(prof);
    persistSession(u, prof);
    return u;
  };

  // Google Login helper with instant account creation / mock support
  const loginWithGoogleProfile = (profileData: {
    displayName: string;
    email: string;
    photoURL?: string;
    role?: UserRole;
  }) => {
    const uid = `google-uid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const mockUser = {
      uid,
      displayName: profileData.displayName,
      email: profileData.email,
      photoURL: profileData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.displayName)}&background=2563EB&color=fff`,
      emailVerified: true,
      getIdToken: async () => 'mock-token-' + Date.now(),
    };

    const prof: AuthUserProfile = {
      uid,
      displayName: profileData.displayName,
      email: profileData.email,
      photoURL: mockUser.photoURL,
      role: profileData.role || 'warga',
      department: profileData.role === 'petugas' ? 'Dinas Pekerjaan Umum & Tata Kota' : 'Masyarakat Umum',
      subRole: profileData.role === 'petugas' ? 'Petugas Dinas' : 'Warga Terverifikasi',
      createdAt: new Date().toISOString()
    };

    setUser(mockUser);
    setUserProfile(prof);
    persistSession(mockUser, prof);

    // Sync to Firestore in background if available
    try {
      const userRef = doc(db, 'users', uid);
      setDoc(userRef, prof).catch(() => {});
    } catch (e) {}

    return mockUser;
  };

  // Primary signInWithGoogle handler: tries native popup first, falls back to Google selector modal
  const signInWithGoogle = async (): Promise<FirebaseUser | any> => {
    try {
      return await signInWithGooglePopupDirect();
    } catch (err: any) {
      console.warn('Google native popup failed, opening Google Identity selector:', err);
      // Open Google Sign-In Selector Modal so user can sign in seamlessly
      setIsGoogleModalOpen(true);
      return null;
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
      photoURL: userProfile?.photoURL || user.photoURL,
      role: newRole,
      department,
      subRole,
      createdAt: userProfile?.createdAt || new Date().toISOString(),
    };

    setUserProfile(updatedProfile);
    persistSession(user, updatedProfile);

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, updatedProfile, { merge: true });
    } catch (e) {
      console.warn('Failed to update user role in Firestore (saved locally):', e);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth).catch(() => {});
      setUser(null);
      setUserProfile(null);
      persistSession(null, null);
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
        isGoogleModalOpen,
        setIsGoogleModalOpen,
        signInWithGoogle,
        signInWithGooglePopupDirect,
        loginWithGoogleProfile,
        signOut,
        setUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
