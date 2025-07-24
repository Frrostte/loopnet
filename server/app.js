const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const discovery = require('./discovery');

const app = express();
const PORT = 3000;

// Configure multer to save files locally (in ./uploads folder)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

app.use(express.static(path.join(__dirname, '../public')));

// Create uploads folder if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
//expose the uploads/ folder
app.use('/files', express.static(uploadDir));
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}


// Upload API
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  console.log(`Received file: ${req.file.filename}`);
  res.send('File uploaded successfully');
});

// Files API - list uploaded files
app.get('/files', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan files');
    }
    res.json(files);
  });
});
app.get('/peers', (req, res) => {
  const peerList = Array.from(discovery.peers.entries()).map(([id, peer]) => ({
    id,
    address: peer.address,
    lastSeen: peer.lastSeen,
    port: peer.port || PORT,  
    files: peer.files,
  }));
  res.json(peerList);
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

