// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;
var rooms={};

io.on('connection', function (socket) {
    // console.log("----------------",socket);
    var addedUser = false;
    var room = socket.handshake['query']['room_var'];
    // console.log("rooms we defined",rooms[room]);

    // console.log("room debug:",room);
     socket.join(room);
     // console.log('user joined room #'+room);

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {
        // we tell the client to execute 'new message'
        //io.to(room).emit('chat message', msg);
        /*socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });*/
        //
        socket.to(room).emit('new message', {
         username: socket.username,
         message: data
         });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (username) {
        if (addedUser) return;

        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        if(rooms[room] === undefined){
            rooms[room]=[];
            console.log("rooms not defined yet",rooms,"room we have:",room);
            rooms[room].push(socket.username);
            console.log("rooms after connection",rooms,"room we have:",room);
        }else{
            rooms[room].push(socket.username);
            console.log("rooms defined",rooms,"room we have:",room);
        }
        addedUser = true;
        socket.emit('login', {
            numUsers: rooms[room].length
        });
        // echo globally (all clients) that a person has connected
        socket.to(room).emit('user joined', {
            username: socket.username,
            numUsers: rooms[room].length
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', function () {
        socket.to(room).emit('typing', {
            username: socket.username
        });
    });//pizza

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function () {
        socket.to(room).emit('stop typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        if (addedUser) {
            --numUsers;

            // echo globally that this client has lefte

            var indexToDelete = rooms[room].indexOf(socket.username);
            if (indexToDelete > -1) {
                rooms[room].splice(indexToDelete, 1);
            }
            console.log("rooms defined",rooms,"room we have:",room);
        }
        socket.to(room).emit('user left', {
            username: socket.username,
            numUsers: rooms[room].length
        });
    });


});
