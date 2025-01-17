////////////////////////////////
// Importation des librairies //
////////////////////////////////
require("dotenv").config();
const express = require("express");
const multer = require('multer');
const path = require("path");
const app = express();
const csv = require('csv-parser');
const fs = require('fs');

//////////////////////////////
// Configuration de Express //
//////////////////////////////
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set('view engine', 'ejs');

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
    // Check mime type
    const mimetype = filetypes.test(file.mimetype);
  
    if (mimetype && extname) {
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
          return results;
      });
};

async function otsCreate(csvEmail, csvSecret) {
    fetch(`${process.env.OTS_HOST}/api/v1/share`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            secret: csvSecret,
            ttl: '3600',
            //recipient: [csvEmail]
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
app.get("/", async (req, res) => {
    res.render('index.ejs', {
      msg: ''
    });
});

// Téléverser un fichier
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
      if (err) {
        console.log(err);
        res.render('index', { msg: err });
      } else {
        if (req.file == undefined) {
          res.render('index', { msg: 'No file selected!' });
        } else {
          csv2json(req.file)
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
app.listen(process.env.PORT, () => console.log("Server is running on port " + process.env.PORT));