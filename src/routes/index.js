const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');

// Serve the main HTML file
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Handle music file upload
router.post('/upload', musicController.uploadMusic);

module.exports = router;
