/**
 * Project: uenrrobotics
 * File: AuthController
 * Created by Pennycodes on 9/11/2022.
 * Copyright uenrrobotics
 */
const express = require('express');
const firebaseAuth = require('firebase/auth');
const { auth, firebase } = require('../handlers/firebase');
const firebaseStore = require('firebase/firestore');

module.exports = function (app) {
    app.use(express.json())
    app.use(express.urlencoded({ extended: false }))

    app.get('/', function (req, res) {
        const db = firebaseStore.getFirestore(firebase);
        const membersRef = firebaseStore.collection(db, 'members');
        const projectsRef = firebaseStore.collection(db, 'projects');
        const awardsRef = firebaseStore.collection(db, 'awards');
        const settingsRef = firebaseStore.collection(db, 'settings');

        const members = firebaseStore.getDocs(membersRef);
        const projects = firebaseStore.getDocs(projectsRef);
        const awards = firebaseStore.getDocs(awardsRef);
        const settingRef = firebaseStore.doc(settingsRef, "settings");
        const settings = firebaseStore.getDoc(settingRef);
        Promise.all([members, projects, awards, settings]).then((values) => {

            const siteSettings = values[3].data();
            values = values.map((value) => value.size);

            res.locals = { title: 'Home',
                members: values[0],
                projects: values[1],
                awards: values[2],
                settings: siteSettings
            };
            res.render('index');

        }).catch((err) => {
            console.log(err);
            res.status(500).send('Internal Server Error');
        })

    });


    app.get('/login', function (req, res) {
        res.render('Auth/auth-login', { 'message': req.flash('message'), 'error': req.flash('error') });
    });

    app.post('/login', function (req, res) {

        const email = req.body.email;
        const password = req.body.password;

        firebaseAuth.signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in
                const user = userCredential.user;
                const session = req.session;
                session.user = user;
                // ...
                res.redirect('/dashboard');
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                req.flash('error', errorMessage);
                res.redirect('/login');
            })
    });

    app.get('/forgot-password', function (req, res) {
        res.render('Auth/auth-forgot-password', { 'message': req.flash('message'), 'error': req.flash('error') });
    });

    app.post('/forgot-password', function (req, res) {
        const email = req.body.email;
        firebaseAuth.sendPasswordResetEmail(auth, email)
            .then(() => {
                // Password reset email sent!
                // ..
                req.flash('message', 'Password reset email sent!');
                res.redirect('/forgot-password');
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                req.flash('error', errorMessage);
                res.redirect('/forgot-password');
            });
    });

    app.get('/logout', function (req, res) {


        firebaseAuth.signOut(auth).then(() => {
            // Sign-out successful.
            req.session.destroy();
            res.redirect('/login');
        }).catch((error) => {
            // An error happened.
            res.redirect('/login');
        });

    });


};
