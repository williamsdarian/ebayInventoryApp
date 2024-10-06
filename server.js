const express = require('express');
const multer = require('multer');
const path = require('path');
const fsa = require('fs').promises;
const fs = require('fs');
const uuidv4 = require('uuid').v4;

const app = express();
app.set('view engine', 'ejs');
const PORT = process.env.PORT || 3000;
const IP_ADDRESS = 'localhost'; // Change this to your desired IP address
app.use('/pages', express.static(__dirname + "/pages"));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.urlencoded({ extended: true }));

var imgNum = 0;
var uploadNum = Date.now();

// Set up multer for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/');
    },
    filename: async function (req, file, cb) {
        const ext = path.extname(file.originalname);

        // Dynamically get the upload number by counting existing entries in uploads.json
        const filename = `upload_${uploadNum}_${imgNum}${ext}`;
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

// Handle form submission
app.post('/upload', upload.array('files'), async (req, res) => {
    try {

        const filePath = path.join(__dirname, 'uploads', 'uploads.json');
        let tmpUploads;

        // Read existing JSON data
        try {
            tmpUploads = fs.readFileSync(filePath, 'utf-8');
        } catch (err) {
            if (err.code === 'ENOENT') {
                tmpUploads = JSON.stringify({ items: [] }, null, 2); // If file doesn't exist, initialize an empty array
            } else {
                console.error(err);
                return res.status(500).send('Error reading file');
            }
        }

        const itemName = req.body.itemName;
        const itemDescription = req.body.itemDescription;
        const cost = req.body.cost;

        // Get formatted date and time
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().slice(0, 10);
        const formattedTime = currentDate.toLocaleTimeString();

        // Get the dynamically calculated upload number
        const uploadID = uploadNum.toString();
        const imagePaths = req.files.map(file => `/images/${file.filename}`);  // Store correct relative path

        const formData = {
            id: uploadID,
            itemName,
            itemDescription,
            cost,
            date: formattedDate,
            time: formattedTime,
            isListed: "No",
            hasSold: "No",
            imagePaths
        };

       
        let entry;
        try {
            entry = JSON.parse(tmpUploads);
        } catch (err) {
            console.error(err);
            return res.status(500).send('Error parsing JSON');
        }

        if (!Array.isArray(entry.items)) {
            entry.items = [];
        }

        entry.items.push(formData);

        // Write the updated JSON back to the file
        tmpUploads = JSON.stringify(entry, null, 2);
        try {
            fs.writeFileSync(filePath, tmpUploads, 'utf-8');
        } catch (err) {
            console.error(err);
            return res.status(500).send('Error writing file');
        }

        res.writeHead(302, {
            'Location': '/pages/success.html'
        });
        res.end();

        imgNum = 0; // Reset image number for the next upload session
    } catch (err) {
        console.error(err);
        res.status(500).send('Error during upload process');
    }
    uploadNum++;
});

app.post('/deleteUpload', async (req, res) => {
    const uploadID = req.body.uploadID;
    console.log(uploadID);
    const filePath = path.join(__dirname, 'uploads', 'uploads.json');

  try {
    const data = await fsa.readFile(filePath, 'utf-8');
      const jsonData = JSON.parse(data);

      console.log("Original: " + jsonData.items);

      const updatedItems = jsonData.items.filter(upload => upload.id !== uploadID);

      console.log("Updated: " + updatedItems);

    // Update the JSON file
    const updatedData = { items: updatedItems };
    await fsa.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');

    res.redirect('/pastUploads');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting upload');
  }
});



// Register Middlewares/Headers
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/pages/index.html');
    let reqIP = req.socket.remoteAddress;
    console.log("Index requested by " + reqIP);
});

app.get('/error', (req, res) => {
    res.sendFile(__dirname + '/pages/error.html');
    console.log("path: " + __dirname + 'pages/error.html' + '  UHHHH OHHHH!!!!');
});

app.get('/success', (req, res) => {
    res.sendFile(__dirname + '/pages/success.html');
    console.log("path: " + __dirname + 'pages/success.html');
});

app.get('/pastUploads', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'uploads', 'uploads.json');
        const data = await fsa.readFile(filePath, 'utf-8');
        const jsonData = JSON.parse(data);
        let reqIP = req.socket.remoteAddress;

        // Ensure jsonData has an items array
        if (!Array.isArray(jsonData.items)) {
            throw new Error('JSON data does not contain an items array');
        }

        // Pass the items array to the template
        res.render('pastUploads', { data: jsonData.items });
        console.log("pastUploads requested by " + reqIP);

    } catch (err) {
        console.error(err);
        res.status(500).send('Error reading or parsing file');
    }
});

// serve CSS and JS files
app.get('/assets/js/main.js', function (req, res) {
    res.set('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'pages/assets/js/main.js'));
    //console.log("main.js was requested");
});

app.get('/assets/css/fontawesome-all.min.css', function (req, res) {
    res.set('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'pages/assets/css/fontawesome-all.min.css'));
    //console.log("fontawesome-all.min.css was requested");
});

app.get('/assets/css/main.css', function (req, res) {
    res.set('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'pages/assets/css/main.css'));
    //console.log("main.css was requested");
});

app.get('/webImages/bg01.jpg', function (req, res) {
    res.sendFile(path.join(__dirname, 'pages/webImages/bg01.jpg'))
   // console.log("bg01.jpg was requested");
});

app.get('/webImages/bg02.jpg', function (req, res) {
    res.sendFile(path.join(__dirname, 'pages/webImages/bg02.jpg'))
    //console.log("bg02.jpg was requested");
});

app.get('/webImages/bg03.jpg', function (req, res) {
    res.sendFile(path.join(__dirname, 'pages/webImages/bg03.jpg'))
   // console.log("bg03.jpg was requested");
});

app.get('/webImages/greenCheckMark.jpg', function (req, res) {
    res.sendFile(path.join(__dirname, 'pages/webImages/greenCheckMark.jpg'))
    //console.log("greenCheckMark.jpg was requested");
});

app.get('/webImages/redErrorX.jpeg', function (req, res) {
    res.sendFile(path.join(__dirname, 'pages/webImages/redErrorX.jpeg'))
    //console.log("redErrorX.jpeg was requested");
});

// Start the server
app.listen(PORT, IP_ADDRESS, () => {
    var currentDate = new Date();
    var formattedDate = currentDate.toISOString().slice(0, 10);
    var formattedTime = currentDate.toLocaleTimeString();
    console.log(`Server is running on http://${IP_ADDRESS}:${PORT}`);
    console.log(`Formatted Date: ${formattedDate}`);
    console.log(`Formatted Time: ${formattedTime}`);
});
