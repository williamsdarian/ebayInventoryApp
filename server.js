const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const IP_ADDRESS = 'localhost'; // Change this to your desired IP address
app.use('/pages', express.static(__dirname + "/pages"));


//this will give the files a readable date
const currentDate = new Date();
const formattedDate = currentDate.toISOString().replace(/:/g, '-');
const formattedTime = `${currentDate.getHours()}-${currentDate.getMinutes()}-${currentDate.getSeconds()}`;
var uploadNum = 0;
var imgNum = 0;


// Set up multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images/');
  },
    filename: function (req, file, cb) {
        // Get the item name from the form
        const itemName = req.body.itemName;
        // Extract the file extension
        const ext = path.extname(file.originalname);
        // Construct the filename with the item name
        const filename = `upload_${uploadNum}_#${imgNum}${ext}`;
        cb(null, filename);
        imgNum++;
  }
});

const upload = multer({
    storage: storage, fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
            cb(null, true);
        } else {
            cb(null, false);
            const err = new Error('Only .png, .jpg and .jpeg format allowed!')
            err.name = 'ExtensionError'
            return cb(err);
        }
    },
});

// Register Middlewares/Headers
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/pages/index.html');
    console.log("path: " + __dirname + 'pages/index.html');
});

app.get('/error', (req, res) => {
    res.sendFile(__dirname + '/pages/error.html');
    console.log("path: " + __dirname + 'pages/error.html' + '  UHHHH OHHHH!!!!');
});

app.get('/success', (req, res) => {
    res.redirect(req.baseUrl + '/pages/success.html');
    console.log("path: " + __dirname + 'pages/success.html');
});

app.get('/assets/js/main.js', function (req, res) {
    res.set('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'pages/assets/js/main.js'));
    console.log("main.js was requested");
});

app.get('/assets/css/fontawesome-all.min.css', function (req, res) {
    res.set('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'pages/assets/css/fontawesome-all.min.css'));
    console.log("fontawesome-all.min.css was requested");
});

app.get('/assets/css/main.css', function (req, res) {
    res.set('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'pages/assets/css/main.css'));
    console.log("main.css was requested");
});

app.get('/webImages/bg01.jpg', function (req, res) {
    res.sendFile(path.join(__dirname, 'pages/webImages/bg01.jpg'))
    console.log("bg01.jpg was requested");
});

app.get('/webImages/bg02.jpg', function (req, res) {
    res.sendFile(path.join(__dirname, 'pages/webImages/bg02.jpg'))
    console.log("bg02.jpg was requested");
});

app.get('/webImages/bg03.jpg', function (req, res) {
    res.sendFile(path.join(__dirname, 'pages/webImages/bg03.jpg'))
    console.log("bg03.jpg was requested");
});

app.get('/webImages/greenCheckMark.jpg', function (req, res) {
    res.sendFile(path.join(__dirname, 'pages/webImages/greenCheckMark.jpg'))
    console.log("greenCheckMark.jpg was requested");
});

app.get('/webImages/redErrorX.jpeg', function (req, res) {
    res.sendFile(path.join(__dirname, 'pages/webImages/redErrorX.jpeg'))
    console.log("redErrorX.jpeg was requested");
});

// Handle form submission
app.post('/upload', upload.array('files'), (req, res) => {
   // Save text input from form fields
   const itemName = req.body.itemName;
   const itemDescription = req.body.itemDescription;
   const cost = req.body.cost;

   const formData = {
      itemName: itemName,
      itemDescription: itemDescription,
      cost: cost,
      date: formattedDate,
      time: formattedTime,
    };

   // Save the form data to a JSON file
   const jsonData = JSON.stringify(formData, null, 2);
   fs.writeFileSync(`uploads/upload_${uploadNum}.json`, jsonData);
    uploadNum++;
    res.writeHead(302, {
        'Location': '/pages/success.html'
    });
    res.end();
   imgNum = 0;
});

// Start the server
app.listen(PORT, IP_ADDRESS, () => {
    console.log(`Server is running on http://${IP_ADDRESS}:${PORT}`);
    console.log(`Formatted Date: ${formattedDate}`);
    console.log(`Formatted Time: ${formattedTime}`);
});
