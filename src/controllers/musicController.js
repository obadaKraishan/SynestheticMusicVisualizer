const path = require('path');
const multer = require('multer');

// Set up multer for file upload handling
const upload = multer({
    dest: 'uploads/', // Specify the directory for storing uploaded files
    limits: {
        fileSize: 100 * 1024 * 1024 // Set file size limit (100 MB in this case)
    }
}).single('musicFile'); // Use .single() to specify a single file upload with the field name 'musicFile'

exports.uploadMusic = (req, res) => {
    upload(req, res, function (err) {
        if (err) {
            return res.status(400).send('Error uploading file.');
        }

        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        console.log('File uploaded:', req.file);

        // Respond with the file path for further processing
        res.status(200).json({
            message: 'File uploaded successfully!',
            filePath: path.join('/uploads/', req.file.filename)
        });
    });
};
