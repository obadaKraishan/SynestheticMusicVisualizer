const express = require('express');
const path = require('path');
const multer = require('multer');
const routes = require('./routes');

const app = express();

// Set up static file serving for the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Set up static file serving for the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Use routes
app.use('/', routes);

module.exports = app;
