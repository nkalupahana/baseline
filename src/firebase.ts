import { getAuth, signOut } from '@firebase/auth';
import { initializeApp } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence } from '@firebase/auth';
import { Capacitor } from '@capacitor/core';
import { enableLogging } from '@firebase/database';
import ldb from './db';
import { Auth } from '@firebase/auth';
import { getStorage } from '@firebase/storage';

enableLogging(true);
export const firebase = initializeApp({
    "apiKey": "AIzaSyAlYsMV0bXEum2jytDPKe4uD17g8do4WaQ", 
    "authDomain": "moody-ionic.firebaseapp.com", 
    "projectId": "moody-ionic", 
    "storageBucket": "moody-ionic.appspot.com", 
    "messagingSenderId": "257064314002", 
    "appId": "1:257064314002:web:bf10991ebeb4d6df18724b"
});

export let auth: Auth;
if (Capacitor.isNativePlatform()) {
    auth = initializeAuth(firebase, {
        persistence: indexedDBLocalPersistence
    });
} else {
    auth = getAuth();
}

export let storage = getStorage();

export const signOutAndCleanUp = () => {
    ldb.logs.clear();
    signOut(auth);
}