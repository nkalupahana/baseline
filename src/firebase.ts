import { Auth, getAuth, signOut, initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { Capacitor } from '@capacitor/core';
import ldb from './db';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { WidgetsBridgePlugin } from 'capacitor-widgetsbridge-plugin';

/*
FIREBASE DB DEBUG
import { enableLogging } from 'firebase/database';
enableLogging(true);
*/

export const firebase = initializeApp({
    apiKey: "AIzaSyCtzcuoGrYQfj-PaXGLNTD22Ro0JecPLl4",
    authDomain: "web.getbaseline.app",
    projectId: "getbaselineapp",
    storageBucket: "getbaselineapp.appspot.com",
    messagingSenderId: "841063163864",
    appId: "1:841063163864:web:0cb24972a209fd9b5334ad",
    measurementId: "G-G0C72KF0Y1"
});

export let auth: Auth;
if (Capacitor.isNativePlatform()) {
    auth = initializeAuth(firebase, {
        persistence: indexedDBLocalPersistence
    });
} else {
    auth = getAuth();
}

export const storage = getStorage();
export const db = getDatabase();

export const signOutAndCleanUp = () => {
    console.log("SIGN OUT");
    // Clear DB
    ldb.logs.clear();
    // Remove keys from store
    localStorage.removeItem("keys");
    localStorage.removeItem("ekeys");
    localStorage.removeItem("settings");
    localStorage.removeItem("autosave");
    localStorage.removeItem("eautosave");
    localStorage.removeItem("lastShown");
    localStorage.removeItem("offline");
    localStorage.removeItem("onboarding");
    sessionStorage.removeItem("pwd");
    // Remove user-specific data from UserDefaults
    if (Capacitor.getPlatform() === "ios") {
        WidgetsBridgePlugin.removeItem({
            key: "keys",
            group: "group.app.getbaseline.baseline"
        })
        WidgetsBridgePlugin.removeItem({
            key: "refreshToken",
            group: "group.app.getbaseline.baseline"
        })
    }
    // Sign out of Firebase
    FirebaseAuthentication.signOut();
    signOut(auth);
}