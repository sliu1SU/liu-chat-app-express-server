const express = require('express');

const app = express();
const PORT = 3000;

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth, onAuthStateChanged} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAACEG-fZZ7x8kEma7yj6wq4DnLNLfMLJ8",
    authDomain: "liu-onlinechat.firebaseapp.com",
    projectId: "liu-onlinechat",
    storageBucket: "liu-onlinechat.appspot.com",
    messagingSenderId: "679673496955",
    appId: "1:679673496955:web:f36f41e60ff3ad543ea9de",
    measurementId: "G-LGHSJVWLFP"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
//const analytics = getAnalytics(firebaseApp);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ PORT)
    else
        console.log("Error occurred, server can't start", error);
    }
);

app.get('/', async (req, res)=>{
    // access firebase data here
    const welcomeMsgRef = db.collection('weekone').doc('testmessage');
    const doc = await welcomeMsgRef.get();
    if (!doc.exists) {
        res.status(400);
        res.send("message is not found in Firebase");
    } else {
        const data = doc.data();
        res.status(200);
        res.send(data.message);
    }
});

// need 3 apis for authentication



