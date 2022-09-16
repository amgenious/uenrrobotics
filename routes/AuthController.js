/**
 * Project: uenrrobotics
 * File: AuthController
 * Created by Pennycodes on 9/11/2022.
 * Copyright uenrrobotics
 */
const express = require('express');
const firebaseAuth = require('firebase/auth');
const { auth } = require('../handlers/firebase');

module.exports = function (app) {
    app.use(express.json())
    app.use(express.urlencoded({ extended: false }))

    app.get('/', function (req, res) {
        res.locals = { title: 'Home' };
        res.render('index');
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
