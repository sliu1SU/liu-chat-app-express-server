const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(bodyParser.json());

// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const {getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged} = require('firebase/auth');
const {getFirestore, doc, getDoc} = require('firebase/firestore');
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
const firebaseAuth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// fn to monitor current signed in user
onAuthStateChanged(firebaseAuth, function(user) {
    try {
        if (user) {
            // User is signed in
            const uid = user.uid;
            // Additional logic for when the user is signed in
            console.log("User ID:", uid);
        } else {
            // User is signed out
            console.log("No user is signed in.");
        }
    } catch (error) {
        console.error("Error handling authentication state:", error);
    }
});

app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ PORT)
    else
        console.log("Error occurred, server can't start", error);
    }
);

app.get('/', async (req, res)=>{
    // access firebase data here
    const welcomeMsgRef = doc(db, 'weekone', 'testmessage');
    const document = await getDoc(welcomeMsgRef);
    if (!document.exists) {
        res.status(400);
        res.send("message is not found in Firebase");
    } else {
        // if doc is found, send the message to front end
        const data = document.data();
        res.status(200);
        res.send(data.message);
    }
});

// need 3 apis for authentication
// api handles sign up
app.post('/signup/', async (req, res)=>{
    const {email, password} = req.body;
    try {
        // note: user will be log in if sign up succeeds
        //console.log("trigger sign up api");
        const userCredential  = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        const user = userCredential.user;
        // Set the token in a cookie
        res.cookie('authToken', user.stsTokenManager.accessToken);
        res.status(200);
        res.send(user);
    } catch (e) {
        res.status(400);
        res.send(e);
    }
});

// api handles log in
app.post('/login/', async (req, res)=>{
    const {email, password} = req.body;
    try {
        const userCredential  = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const user = userCredential.user;
        // Set the token in a cookie
        res.cookie('authToken', user.stsTokenManager.accessToken);
        res.status(200);
        res.send(user);
    } catch (e) {
        res.status(400);
        res.send(e);
    }
});

// api handles log off
app.post('/logoff/', async (req, res)=>{
    try {
        await signOut(firebaseAuth);
        // Clear the auth_token cookie
        res.clearCookie('authToken');
        res.status(200);
        res.send("you are now logged off");
    } catch (e) {
        res.status(400);
        res.send(e);
    }
});