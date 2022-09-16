/**
 * Project: uenrrobotics
 * File: routers
 * Created by Pennycodes on 9/12/2022.
 * Copyright uenrrobotics
 */
const express = require('express');
const { firebase } = require('../handlers/firebase');
const formHandler = require('../handlers/form');
const firebaseStore = require('firebase/firestore');
const firebaseStorage =  require('firebase-admin/storage');
const firebaseAdminAuth =  require('firebase-admin/auth');

const uploadFile = async (path, name, all = false) => {
    const storage = firebaseStorage.getStorage().bucket();
    const file = storage.file(name);
    const [{}, filedData] = await storage.upload(path, {
        gzip: true,
        destination: name,
        metadata: {
            cacheControl: 'public, max-age=31536000',
        }
    })

    let url = `https://via.placeholder.com/600x300`;

    if (filedData) {
       url = await file.getSignedUrl({
           action: 'read',
           expires: '03-09-2491'
       })
        url = url[0]
    }
    return all ? {url, filedData} : url;


}

module.exports = function (app) {
    app.use(express.json())
    app.use(express.urlencoded({ extended: false }))

    function isUserAllowed(req, res, next) {
      const  session = req.session;
        if (session.user) {
            return next();
        }
        else { res.redirect('/login'); }
    }

    app.get('/dashboard', isUserAllowed, function (req, res) {

        const db = firebaseStore.getFirestore(firebase);
        const membersRef = firebaseStore.collection(db, 'members');
        const projectsRef = firebaseStore.collection(db, 'projects');
        const contactsRef = firebaseStore.collection(db, 'contacts');
        const subscriptionsRef = firebaseStore.collection(db, 'subscriptions');
        const membershipRequestsRef = firebaseStore.collection(db, 'requests');
        const awardsRef = firebaseStore.collection(db, 'awards');

        const members = firebaseStore.getDocs(membersRef);
        const projects = firebaseStore.getDocs(projectsRef);
        const contacts = firebaseStore.getDocs(contactsRef);
        const subscriptions = firebaseStore.getDocs(subscriptionsRef);
        const membershipRequests = firebaseStore.getDocs(membershipRequestsRef);
        const awards = firebaseStore.getDocs(awardsRef);


        Promise.all([members, projects, contacts, subscriptions, membershipRequests, awards]).then((values) => {
           values = values.map((value) => value.size);

            res.locals = { title: 'Dashboard',
                user: req.session.user,
                members: values[0],
                projects: values[1],
                contacts: values[2],
                subscriptions: values[3],
                membershipRequests: values[4],
                awards: values[5]
            };
            res.render('Dashboard/index');

        }).catch((err) => {
            console.log(err);
            res.status(500).send('Internal Server Error');
        })


    });

    app.get('/members', isUserAllowed, function (req, res) {

        // fetch all members
        const db = firebaseStore.getFirestore(firebase);
        const membersRef = firebaseStore.collection(db, 'members');

            firebaseStore.getDocs(membersRef).then(snapshot => {

                const members = [];
                snapshot.forEach(doc => {
                    members.push({
                        ...doc.data(),
                        id: doc.id,
                    });
                });
                res.locals = { title: 'Members', user: req.session.user, members: members, 'message': req.flash('message'), 'error': req.flash('error') };
                res.render('Members/index');

            })
            .catch(err => {
                console.log('Error getting documents', err);
            });
    });

    app.get('/members/requests', isUserAllowed, function (req, res) {

            // fetch all membership requests
            const db = firebaseStore.getFirestore(firebase);
            const membersRef = firebaseStore.collection(db, 'requests');

                firebaseStore.getDocs(membersRef).then(snapshot => {

                    const members = [];
                    snapshot.forEach(doc => {
                        members.push({
                            ...doc.data(),
                            id: doc.id,
                        });
                    });
                    res.locals = { title: 'Members', user: req.session.user, members: members, 'message': req.flash('message'), 'error': req.flash('error') };
                    res.render('Members/requests');

                })
                .catch(err => {
                    console.log('Error getting documents', err);
                });
        });

    app.get('/members/approve/:id', isUserAllowed, function (req, res) {

            // approve membership request
            const db = firebaseStore.getFirestore(firebase);
            const membersRef = firebaseStore.collection(db, 'requests');
            const memberRef = firebaseStore.doc(membersRef, req.params.id);

            firebaseStore.getDoc(memberRef).then(doc => {
                if (!doc.exists()) {
                 req.flash('error', 'Member not found');
                } else {

                    const data = doc.data();
                    const membersRef = firebaseStore.collection(db, 'members');
                    firebaseStore.addDoc(membersRef, data).then(ref => {
                        firebaseStore.deleteDoc(memberRef).then(() => {
                            req.flash('message', 'Member approved successfully');

                        }).catch((error) => {
                            req.flash('error', 'Error approving member');
                        });
                    });
                }

            }).catch(err => {
              req.flash('error', 'Error approving member');

            });
        res.redirect('/members/requests');
        });

    app.get('/members/decline/:id', isUserAllowed, function (req, res) {

            // decline membership request
            const db = firebaseStore.getFirestore(firebase);
            const membersRef = firebaseStore.collection(db, 'requests');
            const memberRef = firebaseStore.doc(membersRef, req.params.id);

            firebaseStore.deleteDoc(memberRef).then(() => {
                req.flash('message', 'Member declined successfully');
            }).catch((error) => {
                req.flash('error', 'Error declining member');
            });

        res.redirect('/members/requests');
        });

    app.get('/projects/add', isUserAllowed, function (req, res) {
        res.locals = { title: 'Add Project', user: req.session.user,  'message': req.flash('message'), 'error': req.flash('error') };
        res.render('Projects/add');
    });

    app.get('/projects', isUserAllowed, function (req, res) {

            // fetch all projects
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
                    res.locals = { title: 'Projects', user: req.session.user, projects, 'message': req.flash('message'), 'error': req.flash('error') };
                    res.render('Projects/index');

                })
                .catch(err => {
                    console.log('Error getting documents', err);
                });
        });

    app.get('/members/add', isUserAllowed, function (req, res) {
        res.locals = { title: 'Add Member', user: req.session.user,  'message': req.flash('message'), 'error': req.flash('error') };
        res.render('Members/add');
    });

    app.get('/members/edit/:id', isUserAllowed, function (req, res) {

        const db = firebaseStore.getFirestore(firebase);
        const membersRef = firebaseStore.collection(db, 'members');
        const memberRef = firebaseStore.doc(membersRef, req.params.id);
        firebaseStore.getDoc(memberRef).then(doc => {
            if (!doc.exists()) {
               req.flash('error', 'Member not found');
                res.redirect('/members');
            } else {

                res.locals = { title: 'Edit Member', user: req.session.user, member: doc.data(), 'message': req.flash('message'), 'error': req.flash('error') };
                res.render('Members/edit');
            }
        })
    })

    app.get('/members/delete/:id', isUserAllowed, function (req, res) {

         // delete member from database then redirect to members page
        const db = firebaseStore.getFirestore(firebase);
        const membersRef = firebaseStore.collection(db, 'members');
        const memberRef = firebaseStore.doc(membersRef, req.params.id);
        firebaseStore.deleteDoc(memberRef).then(() => {
            req.flash('message', 'Member deleted successfully');
            res.redirect('/members');
        }).catch((error) => {
            req.flash('error', error.message);
            res.redirect('/members');
        });
    });

    app.post('/members/add', isUserAllowed, function (req, res) {

        const db = firebaseStore.getFirestore(firebase);
        const memberRef = firebaseStore.collection(db, 'members');
        const member =  {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            program: req.body.program,
            level: req.body.level,
            team: req.body.team,
        }
        firebaseStore.addDoc(memberRef, member).then((_docRef) => {
          req.flash('message', 'Member added successfully');
            res.redirect('/members');

        }).catch((error) => {

            req.flash('error', error.message);
            res.redirect('/members/add');
        });
    })

    app.post('/members/edit/:id', isUserAllowed, function (req, res) {

            const db = firebaseStore.getFirestore(firebase);
            const membersRef = firebaseStore.collection(db, 'members');
            const memberRef = firebaseStore.doc(membersRef, req.params.id);
            const member =  {
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                program: req.body.program,
                level: req.body.level,
                team: req.body.team,
            }
            firebaseStore.updateDoc(memberRef, member).then((_docRef) => {
            req.flash('message', 'Member updated successfully');
                res.redirect('/members');

            }).catch((error) => {

                req.flash('error', error.message);
                res.redirect('/members/edit/' + req.params.id);
            });
    });

    app.post('/projects/add', isUserAllowed, formHandler, async function (req, res) {

        const image = await uploadFile( req.body.files.file.filepath, `projects/${req.body.files.file.newFilename}.${await req.body.files.file.originalFilename.split('.').pop()}`);
            const db = firebaseStore.getFirestore(firebase);
            const projectRef = firebaseStore.collection(db, 'projects');
            const project =  {
                title: req.body.fields.title,
                categories: req.body.fields.categories,
                tags: req.body.fields.tags,
                start_date: req.body.fields.start_date,
                end_date: req.body.fields.end_date,
                summary: req.body.fields.summary,
                abstract: req.body.fields.abstract,
                statement: req.body.fields.statement,
                aims: req.body.fields.aims,
                approach: req.body.fields.approach,
                howitworks: req.body.fields.howitworks,
                techstack: req.body.fields.techstack,
                link: req.body.fields.link,
                image
            }
            firebaseStore.addDoc(projectRef, project).then((_docRef) => {
            req.flash('message', 'Project added successfully');
                res.redirect('/projects');

            }).catch((error) => {

                req.flash('error', error.message);
                res.redirect('/projects/add');
            });
        });

    app.get('/projects/edit/:id', isUserAllowed, function (req, res) {

            const db = firebaseStore.getFirestore(firebase);
            const projectsRef = firebaseStore.collection(db, 'projects');
            const projectRef = firebaseStore.doc(projectsRef, req.params.id);
            firebaseStore.getDoc(projectRef).then(doc => {
                if (!doc.exists()) {
                req.flash('error', 'Project not found');
                    res.redirect('/projects');
                } else {

                    res.locals = { title: 'Edit Project', user: req.session.user, project: doc.data(), 'message': req.flash('message'), 'error': req.flash('error') };
                    res.render('Projects/edit');
                }
            })

    });

    app.post('/projects/edit/:id', isUserAllowed, async function (req, res) {

                const db = firebaseStore.getFirestore(firebase);
                const projectsRef = firebaseStore.collection(db, 'projects');
                const projectRef = firebaseStore.doc(projectsRef, req.params.id);
                const project =  {
                    title: req.body.title,
                    categories: req.body.categories,
                    tags: req.body.tags,
                    start_date: req.body.start_date,
                    end_date: req.body.end_date,
                    summary: req.body.summary,
                    abstract: req.body.abstract,
                    statement: req.body.statement,
                    approach: req.body.approach,
                    aims: req.body.aims,
                    howitworks: req.body.howitworks,
                    techstack: req.body.techstack,
                    link: req.body.link,
                }
                firebaseStore.updateDoc(projectRef, project).then((_docRef) => {
                req.flash('message', 'Project updated successfully');
                    res.redirect('/projects');

                }).catch((error) => {

                    req.flash('error', error.message);
                    res.redirect('/projects/edit/' + req.params.id);
                });
            });

    app.get('/projects/delete/:id', isUserAllowed, function (req, res) {

            const db = firebaseStore.getFirestore(firebase);
            const projectsRef = firebaseStore.collection(db, 'projects');
            const projectRef = firebaseStore.doc(projectsRef, req.params.id);
            firebaseStore.deleteDoc(projectRef).then(() => {
                req.flash('message', 'Project deleted successfully');
                res.redirect('/projects');
            }).catch((error) => {
                req.flash('error', error.message);
                res.redirect('/projects');
            });
    });

    app.get('/awards', isUserAllowed, function (req, res) {
        const db = firebaseStore.getFirestore(firebase);
        const awardsRef = firebaseStore.collection(db, 'awards');
        firebaseStore.getDocs(awardsRef).then((snapshot) => {
            const awards = [];
            snapshot.forEach((doc) => {
                awards.push({
                    ...doc.data(),
                    id: doc.id
                });
            });
            res.locals = { title: 'Awards', user: req.session.user, awards, 'message': req.flash('message'), 'error': req.flash('error') };
            res.render('Awards/index');
        }).catch((error) => {
            req.flash('error', error.message);
            res.redirect('/awards');
        });
    });

    app.post('/awards', isUserAllowed, async function (req, res) {

            const db = firebaseStore.getFirestore(firebase);
            const awardRef = firebaseStore.collection(db, 'awards');
            const award =  {
                title: req.body.title,
                date: req.body.date,
                summary: req.body.summary,
            }
            firebaseStore.addDoc(awardRef, award).then((_docRef) => {
            req.flash('message', 'Award added successfully');
                res.redirect('/awards');

            }).catch((error) => {

                req.flash('error', error.message);
                res.redirect('/awards');
            });
        });

    app.get('/awards/delete/:id', isUserAllowed, function (req, res) {

                const db = firebaseStore.getFirestore(firebase);
                const awardsRef = firebaseStore.collection(db, 'awards');
                const awardRef = firebaseStore.doc(awardsRef, req.params.id);
                firebaseStore.deleteDoc(awardRef).then(() => {
                    req.flash('message', 'Award deleted successfully');
                    res.redirect('/awards');
                }).catch((error) => {
                    req.flash('error', error.message);
                    res.redirect('/awards');
                });
    });

    app.get('/admins', isUserAllowed, function (req, res) {
        firebaseAdminAuth
            .getAuth()
            .listUsers()
            .then((listUsersResult) => {

                res.locals = { title: 'Admins', user: req.session.user, admins: listUsersResult.users, 'message': req.flash('message'), 'error': req.flash('error') };
                res.render('Admins/index');
            })
            .catch((error) => {
                req.flash('error', error.message);
                res.locals = { title: 'Admins', user: req.session.user, admins:[], 'message': req.flash('message'), 'error': req.flash('error') };
                res.render('Admins/index');
            });
    });

    app.get('/admins/add', isUserAllowed, function (req, res) {
        res.locals = { title: 'Add Admin', user: req.session.user, 'message': req.flash('message'), 'error': req.flash('error') };
        res.render('Admins/add');
    });

    app.post('/admins/add', isUserAllowed, function (req, res) {
        firebaseAdminAuth
            .getAuth()
            .createUser({
                email: req.body.email,
                password: req.body.password,
                phoneNumber: req.body.phoneNumber,
                displayName: req.body.displayName,
                disabled: false,
                emailVerified: true,
            })
            .then((userRecord) => {
                req.flash('message', 'Admin added successfully');
                res.redirect('/admins');
            })
            .catch((error) => {
                req.flash('error', error.message);
                res.redirect('/admins/add');
            });
    });

    app.get('/admins/delete/:id', isUserAllowed, function (req, res) {
        firebaseAdminAuth
            .getAuth()
            .deleteUser(req.params.id)
            .then(() => {
                req.flash('message', 'Admin deleted successfully');
                res.redirect('/admins');
            })
            .catch((error) => {
                req.flash('error', error.message);
                res.redirect('/admins');
            });
    });

    app.get('/admins/edit/:id', isUserAllowed, function (req, res) {
        firebaseAdminAuth
            .getAuth()
            .getUser(req.params.id)
            .then((userRecord) => {
                res.locals = { title: 'Edit Admin', user: req.session.user, admin: userRecord, 'message': req.flash('message'), 'error': req.flash('error') };
                res.render('Admins/edit');
            })
            .catch((error) => {
                req.flash('error', error.message);
                res.redirect('/admins');
            });
    });

    app.post('/admins/edit/:id', isUserAllowed, function (req, res) {

        const user = {
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            displayName: req.body.displayName,
            disabled: false,
            emailVerified: true,
        }

        if (req.body.password) {
            user.password = req.body.password;
        }

        firebaseAdminAuth
            .getAuth()
            .updateUser(req.params.id, user)
            .then((userRecord) => {
                req.flash('message', 'Admin updated successfully');
                res.redirect('/admins');
            })
            .catch((error) => {
                req.flash('error', error.message);
                res.redirect('/admins/edit/' + req.params.id);
            });
    });

    app.get('/contacts', isUserAllowed, function (req, res) {
        // Get contact form messages
        const db = firebaseStore.getFirestore(firebase);
        const contactsRef = firebaseStore.collection(db, 'contacts');
        firebaseStore.getDocs(contactsRef).then((snapshot) => {
            const contacts = [];
            snapshot.forEach((doc) => {
                contacts.push({
                    ...doc.data(),
                    id: doc.id
                });
            });
            res.locals = { title: 'Contacts', user: req.session.user, contacts, 'message': req.flash('message'), 'error': req.flash('error') };
            res.render('Contacts/index');

        }).catch((error) => {
            req.flash('error', error.message);
            res.redirect('/contacts');
        });
    });

    app.get('/contacts/delete/:id', isUserAllowed, function (req, res) {
        // Delete contact form message
        const db = firebaseStore.getFirestore(firebase);
        const contactsRef = firebaseStore.collection(db, 'contacts');
        const contactRef = firebaseStore.doc(contactsRef, req.params.id);
        firebaseStore.deleteDoc(contactRef).then(() => {
            req.flash('message', 'Contact deleted successfully');
            res.redirect('/contacts');
        }).catch((error) => {
            req.flash('error', error.message);
            res.redirect('/contacts');
        });
    });

    app.get('/subscriptions', isUserAllowed, function (req, res) {
        // Get subscriptions
        const db = firebaseStore.getFirestore(firebase);
        const subscriptionsRef = firebaseStore.collection(db, 'subscriptions');
        firebaseStore.getDocs(subscriptionsRef).then((snapshot) => {
            const subscriptions = [];
            snapshot.forEach((doc) => {
                subscriptions.push({
                    ...doc.data(),
                    id: doc.id
                });
            });
            res.locals = { title: 'Subscriptions', user: req.session.user, subscriptions, 'message': req.flash('message'), 'error': req.flash('error') };
            res.render('Subscriptions/index');

        }).catch((error) => {
            req.flash('error', error.message);
            res.redirect('/subscriptions');
        });
    });

    app.get('/subscriptions/delete/:id', isUserAllowed, function (req, res) {
        // Delete subscription
        const db = firebaseStore.getFirestore(firebase);
        const subscriptionsRef = firebaseStore.collection(db, 'subscriptions');
        const subscriptionRef = firebaseStore.doc(subscriptionsRef, req.params.id);
        firebaseStore.deleteDoc(subscriptionRef).then(() => {
            req.flash('message', 'Subscription deleted successfully');
            res.redirect('/subscriptions');
        }).catch((error) => {
            req.flash('error', error.message);
            res.redirect('/subscriptions');
        });
    });

    app.get('/settings', isUserAllowed, function (req, res) {
        // Get settings
        const db = firebaseStore.getFirestore(firebase);
        const settingsRef = firebaseStore.collection(db, 'settings');
        const settingRef = firebaseStore.doc(settingsRef, "settings");
        firebaseStore.getDoc(settingRef).then((snapshot) => {
            let settings = {};
            if (snapshot.exists()) {
                settings = snapshot.data();
            }
            res.locals = { title: 'Settings', user: req.session.user, settings, 'message': req.flash('message'), 'error': req.flash('error') };
            res.render('Settings/index');

        }).catch((error) => {
            req.flash('error', error.message);
            res.redirect('/settings');
        });
    });

    app.post('/settings', isUserAllowed, function (req, res) {
        // Update settings
        const db = firebaseStore.getFirestore(firebase);
        const settingsRef = firebaseStore.collection(db, 'settings');
        const settingsDoc = firebaseStore.doc(settingsRef, "settings");
        firebaseStore.updateDoc(settingsDoc, req.body).then(() => {
            req.flash('message', 'Settings updated successfully');
            res.redirect('/settings');
        }).catch((error) => {
            req.flash('error', error.message);
            res.redirect('/settings');
        });
    });

    app.post('/upload', function (req, res) {
        res.status(200).send();
    });

    app.get('/gallery', isUserAllowed, function (req, res) {
        // Get gallery images with pagination
        const db = firebaseStore.getFirestore(firebase);
        const galleryRef = firebaseStore.collection(db, 'gallery');


        firebaseStore.getDocs(galleryRef).then((snapshot) => {
            const gallery = [];
            snapshot.forEach((doc) => {
                gallery.push({
                    ...doc.data(),
                    id: doc.id
                });
            });
            res.locals = { title: 'Gallery', user: req.session.user, gallery, 'message': req.flash('message'), 'error': req.flash('error') };
            res.render('Gallery/index');

        }).catch((error) => {
            req.flash('error', error.message);
            res.redirect('/gallery');

        });
    })

    app.post('/gallery', isUserAllowed, formHandler, async function (req, res) {
        const image = await uploadFile( req.body.files.file.filepath, `gallery/${req.body.files.file.newFilename}.${await req.body.files.file.originalFilename.split('.').pop()}`, true);
        const db = firebaseStore.getFirestore(firebase);
        const galleryRef = firebaseStore.collection(db, 'gallery');
        firebaseStore.addDoc(galleryRef, image).then(() => {
          res.status(200).send();
        }).catch((error) => {
            res.status(500).send(error);
        });
    });

    app.get('/gallery/delete/:id/gallery/:path', isUserAllowed, function (req, res) {

        const db = firebaseStore.getFirestore(firebase);
        const galleryRef = firebaseStore.collection(db, 'gallery');
        const galleryDoc = firebaseStore.doc(galleryRef, req.params.id);
        firebaseStore.deleteDoc(galleryDoc).then(() => {
            const storage = firebaseStorage.getStorage().bucket();
            storage.file(`gallery/${req.params.path}`).delete().then(() => {
               req.flash('message', 'Image deleted successfully');
                res.redirect('/gallery');
            }).catch((error) => {
                req.flash('error', error.message);
                res.redirect('/gallery');
            })
        }).catch((error) => {
            req.flash('error', error.message);
            res.redirect('/gallery');
        })
    });

}
