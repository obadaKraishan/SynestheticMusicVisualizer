const express = require('express');
const path = require('path');
const multer = require('multer');
const routes = require('./routes');

const app = express();

// Set up static file serving
app.use(express.static(path.join(__dirname, '../public')));

// Set up file upload destination
const upload = multer({ dest: 'uploads/' });

// Use routes
app.use('/', routes);

module.exports = app;
