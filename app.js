////////////////////////////////
// Importation des librairies //
////////////////////////////////
require("dotenv").config();
const express = require("express");
const expressSession = require('express-session');
const multer = require('multer');
const path = require("path");
const app = express();
const csv = require('csv-parser');
const fs = require('fs');
const passport = require('passport');
const flash = require('express-flash')

const ensureAuthenticated = require('./middlewares/ensureAuthenticated').default;

const LdapStrategy = require('passport-ldapauth');

//////////////////////////////
// Configuration de Express //
//////////////////////////////
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set('view engine', 'ejs');

app.use(expressSession({
  secret: process.env.SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  maxAge: 86400000,
  cookie: {httpOnly: false} }
));

app.use(express.urlencoded({ extended : true }));
app.use(express.json());

app.use(flash());

///////////////////////////////
// Configuration de passport //
///////////////////////////////

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.use(passport.initialize());
app.use(passport.session());

/////////////////////////////
//  Configuration de LDAP  //
/////////////////////////////
const options = {
  server: {
    url: process.env.LDAP_HOST,
    bindDN: process.env.LDAP_BINDDN,
    bindCredentials: process.env.LDAP_PASSWORD,
    searchBase: process.env.LDAP_SEARCHBASE,
    searchFilter: process.env.LDAP_SEARCHFILTER,
    // searchAttributes: undefined, // Par défaut, tous les attributs sont récupérés
  }
};

passport.use(new LdapStrategy(options));

// Set up storage engine
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });
  
// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // Limit file size to 1MB
    fileFilter: function(req, file, cb) {
      checkFileType(file, cb);
    }
}).single('csvfile');
  
// Check file type
function checkFileType(file, cb) {
    // Allowed file extensions
    const filetypes = /csv/;
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
    if (extname) {
      return cb(null, true);
    } else {
      cb('Error: CSV Only!');
    }
};

function csv2json(file) {
  const results = {};

  fs.createReadStream(file.path)
      .pipe(csv({ headers: false }))
      .on('data', (row) => {
          const [key, value] = Object.values(row);
          otsCreate(key, value);
          results[key] = value;
      })
      .on('end', () => {
          fs.unlink(file.path, (err) => {
            if (err) {
                console.error(`Error deleting file: ${err}`);
            }
          });
          return results;
      });
};

function otsCreate(csvEmail, csvSecret) {
    fetch(`${process.env.OTS_HOST}/api/v1/share`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(process.env.OTS_USERNAME + ':' + process.env.OTS_APIKEY)}`
        },
        body: new URLSearchParams({
            secret: csvSecret,
            ttl: '3600',
            recipient: [csvEmail]
        }),
    })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
};

///////////////////////
// Routes WWW et API //
///////////////////////

// Page d'accueil
app.get("/", ensureAuthenticated, (req, res) => {
    res.render('index.ejs', {
      msg: ''
    });
});

// Page de connexion
app.get("/login", (req, res) => {
  res.render('login.ejs', {
    msg: req.flash('error')
  });
});

app.post('/login', passport.authenticate('ldapauth', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/logout', function(req, res){
  req.session.destroy(function(err) {
    req.logout(function() {
      res.redirect('/login');
    });
  });
});

// Téléverser un fichier
app.post('/upload', ensureAuthenticated, (req, res) => {
    upload(req, res, (err) => {
      if (err) {
        console.log(err);
        res.render('index', { msg: err });
      } else {
        if (req.file == undefined) {
          res.render('index', { msg: 'No file selected!' });
        } else {
          csv2json(req.file);
          res.render('index', {
            msg: 'File uploaded!'
          });
        }
      }
    });
});

///////////////////
// Autres routes //
///////////////////

// Page erreur 404
app.get('*', (req, res) => {
    res.status(404);
    res.send('404');
});

/////////////////////////////////////////////
// Écoute du serveur sur le port configuré //
/////////////////////////////////////////////
app.listen(process.env.PORT || 3000, () => console.log("Server is running on port " + process.env.PORT));