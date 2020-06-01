// Require modules
const express = require('express')
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const app = express()

// Set up middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(fileUpload())

// Store the port into a variable
const port = 8000

// Link my two folders
app.use(express.static('public'))
app.use(express.static('files'))

// Set up cache variable
let cache = {}

// Set up directory
let uploadDirectory = __dirname + '/storage'
let publicDirectory = __dirname + '/public'

// Promisified write function
function writeFile(name, body) {
    return new Promise((resolve, reject) => {
        fs.writeFile(uploadDirectory + '/' + name, body, (err, data) => {
            if (err){
                reject(err)
            }
            else {
                resolve(data)
            }
        })
    })
}

// Promisified read function
function readFile(name){
    return new Promise((resolve, reject) => {
        fs.readFile(uploadDirectory + '/' + name, (err, data) => {
            if (err){
                reject(err)
            }
            else {
                resolve(data)
            }
        })
    })
}

// Get request for the homepage
app.get('/', (request, response) => {
    response.sendFile(publicDirectory + '/index-old.html')
})

// Post request for a file
app.post('/upload', (request, response) => {
    if (typeof request.files == 'array'){
        for (let i = 0; i < request.files.length; i++){
            uploadFile(request.files[i].file, response)
        }
    }
    else{
        uploadFile(request.files.file, response)
    }
})

// Get request for a file
app.get('/download/:id', (request, response) => {
    name = request.params.id

    if (cache[name] == null){
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
app.listen(port, () => {
    console.log(`This application is listening to port: ${port}`)
})

function uploadFile(file, response){
    name = file.name
    data = file.data
    
    writeFile(name, data)

    cache[name] = readFile(name)
    cache[name]
        .then(() => {
            response.end(`Remember to download your file with localhost:${port}/download/filename`)
        }).catch((error) => {
            response.end(error)
        })
}