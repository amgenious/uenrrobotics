const express = require('express');
const path = require('path');
const validator = require('express-validator');
const session = require('express-session');
const flash = require('connect-flash');
const dotenv = require('dotenv');
dotenv.config();

const firebase = require('firebase-admin');
const FirebaseStore = require('connect-session-firebase')(session);
// import routes
const AuthController = require('./routes/AuthController');
const PageRouter = require('./routes/routers');

const serviceAccount = require(`./${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
const adminApp = firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET

})


const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(flash());


app.use(session({
  store: new FirebaseStore({
    database: adminApp.database()
  }),
  name: '__session',
  secret: 'developer@pennycodes@uenrrobotics',
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: 86400000,
    secure: false,
    httpOnly: false }
}));

const cacheTime = 86400000 * 30

// app.use(express.static(path.join(__dirname, 'public'),  {
//   maxAge: cacheTime
// }));

app.use('/public', express.static(path.join(__dirname, 'public'),  {
  maxAge: cacheTime
}));

app.get('/layouts/', function (req, res) {
  res.render('view');
});

AuthController(app);

// view engine setup
const expressLayouts = require('express-ejs-layouts');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);


PageRouter(app);



app.get('/', function (req, res) {
  res.redirect('/');
});

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})

module.exports = app;
