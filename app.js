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
//following generates a random name for each new user.
var adjs = ['Insidious', 'Merciful', 'Heavenly', 'Woebegone', 'Victorious', 'Itchy', 'Crooked', 'Wise', 'Wiggly', 'August'];
var nouns = ['Ladybug', 'Airplane', 'Dog', 'Cat', 'Chipmunk', 'Potato', 'Snail', 'Horse', 'Iguana', 'Pickle'];

io.on('connection', function(socket) {
    socket.on('chatIn', function(words) {
        //Do stuff!
        io.emit('chatOut', words); //write words!
    });
    socket.on('regNewUser', function(emptyObj) {
        var aLen = adjs.length;
        var nLen = nouns.length;
        var userName = adjs[Math.floor(Math.random() * aLen)] + ' '+nouns[Math.floor(Math.random() * nLen)];
        io.emit('userRegged', {
            newName: userName
        });
    });
});


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