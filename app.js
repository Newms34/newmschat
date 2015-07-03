var express = require('express'),
    logger = require('morgan'),
    path = require('path'),
    bodyParser = require('body-parser');

var app = express();
var routes = require('./routes');
var config = require('./.config');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html')

//use stuff
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, 'views')));

app.use('/', routes);


var http = require('http').Server(app);
var io = require('socket.io')(http);
var userList = [];
var banList = [];
var pwd = '4';
var isAuthed = false;
//following generates a random name for each new user.
io.on('connection', function(socket) {
    socket.on('chatIn', function(words) {
        //Do stuff!
        console.log(socket.handshake.address);
        io.emit('chatOut', words); //write words!
    });
    socket.on('active', function(user) {
        //user is active, reset their timer

    });
    socket.on('pingServ', function(userUpd) {
        //two options here: either create new user 'object', or reset timer from old user
        var foundUser = -1;
        for (var i = 0; i < userList.length; i++) {
            if (userList[i].userId == userUpd.key) {
                foundUser = i;
            }
        }
        if (foundUser !== -1) {
            //found a user at position i
            userList[foundUser].userTimer = 40;
            var outList = {
                list: userList
            };
        } else {
            //no user made yet, so create one
            userList.push({
                userName: userUpd.name,
                userId: userUpd.key,
                userTimer: 40,
                userBanned: false
            });
        }
    });
    socket.on('banUser', function(userBan) {
        var foundUser = -1;
        for (var i = 0; i < userList.length; i++) {
            if (userList[i].userName == userBan.name) {
                foundUser = i;
            }
        }
        if (userBan.banned) {
            //ban em
            banList.push(socket.handshake.address);
            userList[foundUser].userBanned = true;
        } else {
            //unban em
            banList.splice(banList.indexOf(socket.handshake.address), 1);
            userList[foundUser].userBanned = false;
        }
        console.log(banList);
        console.log(userList);
        io.emit('servUserDataAll', {
            list: userList
        });
    });
    socket.on('getServUserData', function(emptyObj) {
        //first, business logic to remove dead users
        for (var p = 0; p < userList.length; p++) {
            userList[p].userTimer--;
            if (!userList[p].userTimer) {
                //user ded q.q
                userList = userList.splice(p, 1);
            }
        }
        io.emit('servUserData', {
            list: userList
        });
        // console.log(outList);
    });
    socket.on('admin', function(pass) {
        console.log(pass.pass);
        if (pass.pass == pwd) {
            console.log('Hi Admin!');
            io.emit('logStatus', {
                name: pass.name,
                status: true
            });
            isAuthed = true;
        } else {
            console.log('Who are you?!');
            io.emit('logStatus', {
                name: pass.name,
                status: false
            });
            isAuthed = false;
        }
    });
    socket.on('chkBan', function(empty) {
        if (banList.indexOf(socket.handshake.address)) {
            io.emit('chkBanRep', {
                ban: true
            });
        }else {
            io.emit('chkBanRep', {
                ban: false
            });
        }
    })
});

function removeUser(user) {
    userList.splice(user, 1);
}


http.listen(process.env.PORT || 3000);



app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500).send({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500).send({
        message: err.message,
        error: {}
    });
});