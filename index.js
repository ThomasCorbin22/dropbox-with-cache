// Require modules
const express = require('express')
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const https = require('https');

const app = express()

// Set up middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(fileUpload())

// Store the port into a variable
const port = 8081

// Link my two folders
app.use('/static', express.static('public'))

// Set up cache variable
let cache = {}

// Set up directory
let uploadDirectory = __dirname + '/storage'
let publicDirectory = __dirname + '/public'

// Promisified write function
function writeFile(name, body) {
    return new Promise((resolve, reject) => {
        fs.writeFile(uploadDirectory + '/' + name, body, (err, data) => {
            if (err) {
                reject(err)
            }
            else {
                resolve(data)
            }
        })
    })
}

// Promisified read function
function readFile(name) {
    return new Promise((resolve, reject) => {
        fs.readFile(uploadDirectory + '/' + name, (err, data) => {
            if (err) {
                reject(err)
            }
            else {
                resolve(data)
            }
        })
    })
}

// Promisified delete function - Checks if the file exists and deletes if it does
function deleteFile(name) {
    return new Promise((resolve, reject) => {
        fs.stat(uploadDirectory + '/' + name, function (err, stats) {
            if (err){
                console.log(name + ' is not a file');
                resolve(name)
            }
            else {
                console.log(name + ' is a file');
                fs.unlink(uploadDirectory + '/' + name, (err) => {
                    if (err) {
                        reject(err)
                    }
                    else {
                        console.log(name + ' was deleted');
                        resolve(name)
                    }
                })
            }
        })
    })
}

// Get request for the homepage
app.get('/app', (request, response) => {
    console.log('Server is here')
    response.sendFile(publicDirectory + '/index.html')
})

// Get request for list of files currently in server
app.get('/app/directory', (request, response) => {
    readdir(uploadDirectory)
        .then((body) => {
            response.send(body)
        }).catch((error) => {
            response.status(500).send(error.message)
        })
})

// Post request for a file
app.post('/app/upload', (request, response) => {
    if (typeof request.files == 'array') {
        for (let i = 0; i < request.files.length; i++) {
            uploadFile(request.files[i].file, response)
        }
    }
    else {
        uploadFile(request.files.file, response)
    }
})

// Delete request for a file
app.delete('/app/delete', (request, response) => {
    console.log(request.body)
    name = request.body.name

    if (cache[name]) {
        delete cache[name]
    }

    deleteFile(name)
        .then((body) => {
            console.log(body)
        }).catch((error) => {
            response.status(500).send(error.message)
        })
})

// Get request for a file
app.get('/app/download/:id', (request, response) => {
    name = request.params.id

    if (cache[name] == null) {
        console.log('File not in cache.')
        cache[name] = readFile(name)
    }
    else {
        console.log('File is in cache')
    }

    cache[name]
        .then((body) => {
            response.send(body)
        }).catch((error) => {
            response.status(500).send(error.message)
        })
})

// Set up the server
const options = {
    cert: fs.readFileSync('./localhost.crt'),
    key: fs.readFileSync('./localhost.key')
  };
  
  console.log("Application listening to port " + port);
  https.createServer(options, app).listen(port);

// Upload a file to storage / cache
function uploadFile(file, response) {
    name = file.name
    data = file.data

    writeFile(name, data)

    cache[name] = readFile(name)

    cache[name]
        .then(() => {
            console.log(`Remember you can also download your file with localhost:${port}/download/filename`)
        }).catch((error) => {
            console.log(error)
        })
}

// Read the names of the files in the directory
function readdir(path) {
    let fileNames = []

    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err) {
                reject(err);
            }
            else {
                for (let i = 0; i < files.length; i++){
                    fileNames.push(files[i])
                }
                resolve(fileNames);
            }
        });
    });
}