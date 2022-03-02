import { getAuth, signOut } from '@firebase/auth';
import { initializeApp } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence } from '@firebase/auth';
import { Capacitor } from '@capacitor/core';
import ldb from './db';
import { Auth } from '@firebase/auth';
import { getStorage } from '@firebase/storage';
import { getDatabase } from 'firebase/database';
import { LocalNotifications } from '@moody-app/capacitor-local-notifications';

/*
FIREBASE DB DEBUG
import { enableLogging } from '@firebase/database';
enableLogging(true);
*/

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
export let db = getDatabase();

export const signOutAndCleanUp = () => {
    // Clear DB
    ldb.logs.clear();
    // Remove local notifications
    LocalNotifications.getPending().then(({ notifications }) => {
        let toCancel = [];
        for (let notification of notifications) {
            toCancel.push({ id: notification.id });
        }

        if (toCancel.length > 0) {
            LocalNotifications.cancel({
                notifications: toCancel
            });
        }
    });
    // Sign out of Firebase
    signOut(auth);
}