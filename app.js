const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const authMW = require("./authMW");
const cookiesDuration = require("./cookiesDuration");
const app = express();
const PORT = 3000;

// hash table to maintain currently signed in users
let currentSignIn = new Map();

// Middleware to parse JSON
app.use(bodyParser.json());
// Middleware to parse cookies
app.use(cookieParser());
// middleware to handle verify if cookie is available
app.use(authMW());

// client SDK
const { initializeApp } = require("firebase/app");
const {getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged} = require('firebase/auth');
const {
    getFirestore,
    doc,
    getDoc,
    collection,
    onSnapshot
} = require('firebase/firestore');

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
const clientDB = getFirestore(firebaseApp);

// firebase admin SDK
const admin = require("firebase-admin");
const serviceAccount = require("./liu-onlinechat-firebase-adminsdk-352b1-908c85e7d3.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
const auth = admin.auth();

// fn to monitor current signed in user
// onAuthStateChanged(firebaseAuth, function(user) {
//     try {
//         if (user) {
//             // User is signed in
//             const uid = user.uid;
//             // Additional logic for when the user is signed in
//             console.log("User ID:", uid);
//         } else {
//             // User is signed out
//             console.log("No user is signed in.");
//         }
//     } catch (error) {
//         console.error("Error handling authentication state:", error);
//     }
// });

app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ PORT)
    else
        console.log("Error occurred, server can't start", error);
    }
);

app.get('/', async (req, res)=>{
    res.status(200).end();
});

// // api handles sign up
// app.post('/signup/', async (req, res)=>{
//     const {email, password} = req.body;
//     try {
//         // note: user will be log in if sign up succeeds
//         const userCredential  = await createUserWithEmailAndPassword(firebaseAuth, email, password);
//         const user = userCredential.user;
//         // Set the token in a cookie
//         res.cookie('authToken', user.stsTokenManager.accessToken, {maxAge: cookiesDuration});
//         res.status(200);
//         res.send(user);
//     } catch (e) {
//         res.status(400);
//         res.send(e);
//     }
// });

// api handles sign up firebase admin sdk
app.post('/signup/', async (req, res)=>{
    const { email, password } = req.body; // Ensure you validate and sanitize these inputs
    try {
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
        });
        //res.cookie('authToken', userRecord.stsTokenManager.accessToken, {maxAge: cookiesDuration});
        //res.status(201).send({ uid: userRecord.uid });
        res.status(201).send(userRecord);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// // api handles log in
// app.post('/login/', async (req, res)=>{
//     const {email, password} = req.body;
//     try {
//         const userCredential  = await signInWithEmailAndPassword(firebaseAuth, email, password);
//         const user = userCredential.user;
//         // Set the token in a cookie
//         res.cookie('authToken', user.stsTokenManager.accessToken, {maxAge: cookiesDuration});
//         res.status(200);
//         res.send(user);
//     } catch (e) {
//         res.status(400);
//         res.send(e);
//     }
// });

// // api handles log in admin version
// app.post('/login/', async (req, res)=>{
//     const {uid, email, accessToken} = req.body;
//     try {
//         if (!currentSignIn.has(uid)) {
//             currentSignIn.set(uid, [email, accessToken]);
//         }
//         res.status(200).end();
//     } catch (e) {
//         res.status(400);
//         res.send(e);
//     }
// });

// api handles log in chatgpt version
app.post('/login/', async (req, res)=>{
    const authToken = req.headers.authorization?.split("Bearer ")[1];
    if (!authToken) {
        return res.status(401).send('Unauthorized');
    }
    try {
        const decodedToken = await auth.verifyIdToken(authToken);
        // Here you can create a session or return user info
        res.status(200).send(decodedToken);
    } catch (error) {
        res.status(401).send('Unauthorized');
    }
});

// // api handles log off
// app.post('/logoff/', async (req, res)=>{
//     try {
//         await signOut(firebaseAuth);
//         // Clear the auth_token cookie
//         res.clearCookie('authToken');
//         res.status(200);
//         res.send("you are now logged off");
//     } catch (e) {
//         res.status(400);
//         res.send(e);
//     }
// });

// api handles log off admin version
app.post('/logoff/', async (req, res)=>{
    const {uid} = req.body;
    try {
        currentSignIn.delete(uid);
        // Clear the auth_token cookie
        res.clearCookie('authToken');
        res.status(200).end();
    } catch (e) {
        res.status(400);
        res.send(e);
    }
});

// // api handles create a collection in firebase (chat room)
// app.post('/rooms/', async (req, res)=>{
//     //const {name, desc} = req.body;
//     try {
//         const roomsCollection = collection(db, 'Rooms');
//         const docRef = await addDoc(roomsCollection, req.body);
//         res.status(200);
//         res.send({id: docRef.id});
//     } catch (e) {
//         res.status(400);
//         res.send(e);
//     }
// });

// api handles create a collection in firebase (chat room) firebase admin sdk
app.post('/rooms/', async (req, res)=>{
    try {
        const roomsCollection = db.collection('Rooms'); // Reference the 'Rooms' collection
        const docRef = await roomsCollection.add(req.body); // Add document with provided data
        res.status(200).send({ id: docRef.id });
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

// // api handles getting all rooms
// app.get('/rooms/init', async (req, res)=>{
//     let rooms = [];
//     try {
//         const roomsCollection = collection(db, 'Rooms');  // Reference the 'Rooms' collection
//         let snapshot = await getDocs(roomsCollection);  // Fetch all documents
//         if (!snapshot.empty) {
//             snapshot = snapshot.docs; // convert to array
//             for (let i = 0; i < snapshot.length; i++) {
//                 rooms.push({
//                     id: snapshot[i].id,
//                     name: snapshot[i].data().name,
//                     description: snapshot[i].data().description
//                 });
//             }
//         }
//         res.status(200);
//         res.send(rooms);
//     } catch (e) {
//         res.status(400);
//         res.send(e);
//     }
// });

// api handles getting all rooms firebase admin sdk
app.get('/rooms/init', async (req, res)=>{
    let rooms = [];
    try {
        const roomsCollection = db.collection('Rooms'); // Reference the 'Rooms' collection
        const snapshot = await roomsCollection.get();   // Fetch all documents

        if (!snapshot.empty) {
            snapshot.forEach(doc => {
                rooms.push({
                    id: doc.id,
                    name: doc.data().name,
                    description: doc.data().description
                });
            });
        }

        res.status(200).send(rooms);
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

// api handles getting all rooms SSE firebase client sdk ONLY
app.get('/rooms/', async (req, res)=>{
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Firestore reference to the 'Rooms' collection
    const roomsCollection = collection(clientDB, 'Rooms');

    // Set up Firestore onSnapshot listener to track real-time changes in the Rooms collection
    const unsubscribe = onSnapshot(roomsCollection, (snapshot) => {
        let rooms = [];

        snapshot.forEach((doc) => {
            rooms.push({
                id: doc.id,
                name: doc.data().name,
                description: doc.data().description
            });
        });

        // Send the rooms data to the client in SSE format
        res.write(`data: ${JSON.stringify(rooms)}\n\n`);
    }, (error) => {
        // Handle Firestore errors
        res.status(500).write(`data: ${JSON.stringify({ error: 'Error fetching rooms' })}\n\n`);
    });

    // Handle client closing the connection
    req.on('close', () => {
        unsubscribe();  // Stop listening for updates when client disconnects
        res.end();
    });
});

// // api handles add documents to an existing collection (msg)
// app.post('/room/:id', async (req, res)=>{
//     const roomId = req.params.id;  // Extract the ID from the URL
//     try {
//         const msgCollection = collection(db, 'Rooms', roomId, 'Messages');
//         const docRef = await addDoc(msgCollection, req.body);
//         res.status(200);
//         res.send({id: docRef.id});
//     } catch (e) {
//         res.status(400);
//         res.send(e);
//     }
// });

// api handles add documents to an existing collection (msg) firebase admin sdk
app.post('/room/:id', async (req, res)=>{
    const roomId = req.params.id;  // Extract the ID from the URL
    try {
        const msgCollection = db.collection('Rooms').doc(roomId).collection('Messages');  // Reference the 'Messages' subcollection within the specific room
        const docRef = await msgCollection.add(req.body);  // Add a new document to 'Messages' with the data from req.body
        res.status(200).send({ id: docRef.id });
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

// api handles getting all msgs from a room firebase admin sdk
app.get('/room/:id/init', async (req, res)=>{
    const roomId = req.params.id;  // Extract the ID from the URL
    let messages = [];
    try {
        const msgCollection = db.collection('Rooms').doc(roomId).collection('Messages'); // Reference the 'Rooms' collection
        const snapshot = await msgCollection.get();   // Fetch all documents

        if (!snapshot.empty) {
            snapshot.forEach(doc => {
                messages.push({
                    id: doc.id,
                    content: doc.data().content,
                    time: doc.data().time,
                    sender: doc.data().sender
                });
            });
        }

        res.status(200).send(messages);
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

// api handles getting all msgs from a room server-sent-event
app.get('/room/:id', async (req, res) => {
    const roomId = req.params.id;  // Extract the ID from the URL

    // Firestore reference to the 'Messages' collection inside the specified 'Rooms' document
    const msgCollection = collection(clientDB, 'Rooms', roomId, 'Messages');

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Set up Firestore onSnapshot listener to track real-time changes in the Messages collection
    const unsubscribe = onSnapshot(msgCollection, (snapshot) => {
        let result = [];

        snapshot.forEach((doc) => {
            result.push({
                id: doc.id,
                content: doc.data().content,
                time: doc.data().time,
                sender: doc.data().sender
            });
        });

        // Send the messages data to the client in SSE format
        res.write(`data: ${JSON.stringify(result)}\n\n`);
    }, (error) => {
        // Handle Firestore errors
        res.status(500).write(`data: ${JSON.stringify({ error: 'Error fetching messages' })}\n\n`);
    });

    // Handle client closing the connection
    req.on('close', () => {
        unsubscribe();  // Stop listening for updates when client disconnects
        res.end();
    });
});

// api to get the current user if there is any
app.get('/user', async (req, res)=>{
    try {
        const curUser = firebaseAuth.currentUser;
        if (curUser) {
            res.status(200);
            res.send(curUser);
        } else {
            // no one is signed in
            res.status(200);
            res.send();
        }
    } catch (e) {
        res.status(400);
        res.send(e);
    }
});