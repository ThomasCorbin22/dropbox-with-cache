// Require modules
const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const fs = require('fs')
const https = require('https')

const app = express()

// Require passport initialisation
const passport = require('passport')
const initPassport = require('./auth/init-passport')

// Set up middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(fileUpload())

// Set up session
app.use(session({
  secret: 'supersecret',
  resave: false,
  saveUninitialized: true
}))

// Store the port into a variable
const port = 8082

// Serve public folders
app.use('/app-02', express.static('public'))

// Set up cache variable
const cache = {}

// Set up directory
const uploadDirectory = __dirname + '/storage'
const publicDirectory = __dirname + '/public'

// Promisified write function
function writeFile (name, body) {
  return new Promise((resolve, reject) => {
    fs.writeFile(uploadDirectory + '/' + name, body, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

// Promisified read function
function readFile (name) {
  return new Promise((resolve, reject) => {
    fs.readFile(uploadDirectory + '/' + name, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

// Promisified delete function - Checks if the file exists and deletes if it does
function deleteFile (name) {
  return new Promise((resolve, reject) => {
    fs.stat(uploadDirectory + '/' + name, function (err, stats) {
      if (err) {
        console.log(name + ' is not a file')
        resolve(name)
      } else {
        console.log(name + ' is a file')
        fs.unlink(uploadDirectory + '/' + name, (err) => {
          if (err) {
            reject(err)
          } else {
            console.log(name + ' was deleted')
            resolve(name)
          }
        })
      }
    })
  })
}

// Initialise passport
initPassport(app)

// Check if user is logged in
function isLoggedIn (req) {
  if (req.isAuthenticated()) {
    return true
  }
}

// Get request for the homepage
app.get('/app-02', (request, response) => {
  console.log('Server is here')
  response.sendFile(publicDirectory + '/index.html')
})

// Get request for list of files currently in server
app.get('/app-02/directory', (request, response) => {
  if (isLoggedIn(request) === true) {
    readdir(uploadDirectory)
      .then((body) => {
        response.send(body)
      }).catch((error) => {
        response.status(500).send(error.message)
      })
  } else {
    console.log('Not logged in')
    response.send('Not Logged In')
  }
})

// Post request for a file
app.post('/app-02/upload', (request, response) => {
  if (isLoggedIn(request) === true) {
    if (typeof request.files === 'array') {
      for (let i = 0; i < request.files.length; i++) {
        uploadFile(request.files[i].file)
        response.send(request.files.map(file => file.name))
      }
    } else {
      uploadFile(request.files.file)
      response.send(request.files.file.name)
    }
  } else {
    console.log('Not logged in')
    response.send('Not Logged In')
  }
})

// Delete request for a file
app.delete('/app-02/delete', (request, response) => {
  if (isLoggedIn(request) === true) {
    console.log(request.body)
    let name = request.body.name

    if (cache[name]) {
      delete cache[name]
    }

    deleteFile(name)
      .then((body) => {
        console.log(body)
      }).catch((error) => {
        response.status(500).send(error.message)
      })
  } else {
    console.log('Not logged in')
    response.send('Not Logged In')
  }
})

// Get request for a file
app.get('/app-02/download/:id', (request, response) => {
    console.log('got here')
  if (isLoggedIn(request) === true) {
    let name = request.params.id

    if (cache[name] == null) {
      console.log('File not in cache.')
      cache[name] = readFile(name)
    } else {
      console.log('File is in cache')
    }
    
    cache[name]
      .then((body) => {
        response.send(body)
      }).catch((error) => {
        response.status(500).send(error.message)
      })
  } else {
    console.log('Not logged in')
    response.send('Not Logged In')
  }
})

// Post login request
app.post('/app-02/login', passport.authenticate('local-login', {
  successRedirect: '/app-02',
  failureRedirect: '/app-02'
}))

// Post signup request
app.post('/app-02/signup', passport.authenticate('local-signup', {
  successRedirect: '/app-02',
  failureRedirect: '/app-02'
}))

// Login route
app.get('/app-02/login', (req, res) => {
  if (isLoggedIn(req) === true) {
    console.log('Logged in')
    res.send(req.user.email)
  } else {
    console.log('Not logged in')
    res.send('Not Logged In')
  }
})

// Logout route
app.get('/app-02/logout', (req, res) => {
  req.logout()
  console.log('Logged out')
  res.redirect('/app-02')
})

// Set up the server
const options = {
  cert: fs.readFileSync('./localhost.crt'),
  key: fs.readFileSync('./localhost.key')
}

console.log('Application listening to port ' + port)
https.createServer(options, app).listen(port)

// Upload a file to storage / cache
function uploadFile (file) {
  let name = file.name
  let data = file.data

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
function readdir (path) {
  const fileNames = []

  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, files) => {
      if (err) {
        reject(err)
      } else {
        for (let i = 0; i < files.length; i++) {
          fileNames.push(files[i])
        }
        resolve(fileNames)
      }
    })
  })
}
