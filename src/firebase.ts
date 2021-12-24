import { getAuth, signOut } from '@firebase/auth';
import { initializeApp } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence } from '@firebase/auth';
import { Capacitor } from '@capacitor/core';
import { enableLogging } from '@firebase/database';
import ldb from './db';
import { Auth } from '@firebase/auth';

enableLogging(true);
let params = {};
if (process.env.REACT_APP_FIREBASE_CONFIG) {
    params = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG);
}
// else, data will be fetched from Firebase directly

export const firebase = initializeApp(params);
export let auth: Auth;
if (Capacitor.isNativePlatform()) {
    auth = initializeAuth(firebase, {
        persistence: indexedDBLocalPersistence
    });
} else {
    auth = getAuth();
}

export const signOutAndCleanUp = () => {
    ldb.logs.clear();
    signOut(auth);
}