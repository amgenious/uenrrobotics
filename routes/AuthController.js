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

    app.get('/works', function (req, res) {
        const db = firebaseStore.getFirestore(firebase);
        const projectsRef = firebaseStore.collection(db, 'projects');
        firebaseStore.getDocs(projectsRef).then(snapshot => {

            const projects = [];
            snapshot.forEach(doc => {
                projects.push({
                    ...doc.data(),
                    id: doc.id,
                });
            });
            res.locals = { title: 'Projects | UENR Robotics Club', projects };
            res.render('works');

        })
            .catch((err) => {
            console.log(err);
            res.status(500).send('Internal Server Error');
        })
    });

    app.get('/works/:id', function (req, res) {
        const db = firebaseStore.getFirestore(firebase);
        const projectsRef = firebaseStore.collection(db, 'projects');
        const projectRef = firebaseStore.doc(projectsRef, req.params.id);
        firebaseStore.getDoc(projectRef).then(doc => {
            if (!doc.exists) {
                res.status(404).send('Not Found');
            } else {
                const project = doc.data();
                res.locals = { title: `${project.title} | UENR Robotics Club`, project };
                res.render('work');
            }
        })
            .catch((err) => {
            console.log(err);
            res.status(500).send('Internal Server Error');
        })
    });

    app.get('/images', function (req, res) {
        const db = firebaseStore.getFirestore(firebase);
        const galleryRef = firebaseStore.collection(db, 'gallery');
        const settingsRef = firebaseStore.collection(db, 'settings');

        const gallery = firebaseStore.getDocs(galleryRef);
        const settingRef = firebaseStore.doc(settingsRef, "settings");
        const settings = firebaseStore.getDoc(settingRef);
        Promise.all([gallery, settings]).then((values) => {
            const siteSettings = values[1].data();
            const images = [];
            values[0].forEach((doc) => {
                images.push(doc.data());
            });

            res.locals = { title: 'Gallery | UENR Robotics Club',
                gallery: images,
                settings: siteSettings
            };
            res.render('gallery');

        }).catch((err) => {
            console.log(err);
            res.status(500).send('Internal Server Error');
        })

    })


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
