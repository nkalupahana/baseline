import { getAuth, signOut } from '@firebase/auth';
import { initializeApp } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence } from '@firebase/auth';
import { Capacitor } from '@capacitor/core';
import ldb from './db';
import { Auth } from '@firebase/auth';
import { getStorage } from '@firebase/storage';
import { getDatabase } from 'firebase/database';
import { LocalNotifications } from '@moody-app/capacitor-local-notifications';
import { FirebaseAuthentication } from '@moody-app/capacitor-firebase-authentication';
import { FCM } from '@capacitor-community/fcm';

/*
FIREBASE DB DEBUG
import { enableLogging } from '@firebase/database';
enableLogging(true);
*/

export const firebase = initializeApp({
    apiKey: "AIzaSyCtzcuoGrYQfj-PaXGLNTD22Ro0JecPLl4",
    authDomain: "getbaselineapp.firebaseapp.com",
    projectId: "getbaselineapp",
    storageBucket: "getbaselineapp.appspot.com",
    messagingSenderId: "841063163864",
    appId: "1:841063163864:web:0cb24972a209fd9b5334ad"
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
    console.log("SIGN OUT");
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
    // Remove FCM topic subscription
    if (Capacitor.getPlatform() !== "web") FCM.unsubscribeFrom({ topic: "all" });
    // Remove keys from store
    localStorage.removeItem("keys");
    localStorage.removeItem("ekeys");
    localStorage.removeItem("settings");
    sessionStorage.removeItem("pwd");
    // Sign out of Firebase
    FirebaseAuthentication.signOut();
    signOut(auth);
}