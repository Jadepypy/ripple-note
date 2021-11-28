require('dotenv').config();
const express = require('express')
const app = express()

const {start} = require('./server/controllers/socket_io')
const { createServer } = require("http");
const server = createServer(app);
const io = require("socket.io")(server)
start(io)

app.use('/node_modules', express.static('node_modules'))
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use('/api', 
        [
          require('./server/routes/user_route'),
          require('./server/routes/file_route'),
          require('./server/routes/vault_route')
        ]
)

app.use(function(req, res, next) {
    res.status(404).sendFile(__dirname + '/public/404.html');
});

app.use(function(err, req, res, next) {
    console.log(err);
    res.status(500).send('Internal Server Error');
})

server.listen(3000, function(){
  console.log('listening on *:3000');
});