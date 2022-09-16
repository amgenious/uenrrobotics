/**
 * Project: uenrrobotics
 * File: firebase
 * Created by Pennycodes on 9/12/2022.
 * Copyright uenrrobotics
 */

const firebaseApp = require('firebase/app');
const firebaseAuth = require('firebase/auth');
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSENGER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const firebase = firebaseApp.initializeApp(firebaseConfig);
const auth = firebaseAuth.getAuth(firebase);

module.exports = {
    firebase,
    auth
}
