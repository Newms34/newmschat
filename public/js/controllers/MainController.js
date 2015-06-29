var app = angular.module("Chat", ['ngSanitize']);
var adjs = ['Insidious', 'Merciful', 'Heavenly', 'Woebegone', 'Victorious', 'Itchy', 'Crooked', 'Wise', 'Wiggly', 'August', 'Enormous', 'Fluffy'];
var nouns = ['Ladybug', 'Airplane', 'Dog', 'Cat', 'Chipmunk', 'Potato', 'Snail', 'Horse', 'Iguana', 'Pickle', 'Tyrannosaurus', 'Orangutan', 'Wallaby', 'Aardvark', 'Noodle'];


var socket = io();

app.controller("MainController", function($scope, $window) {
    //on instantiation, create random 'user key'
    // $scope.userKey = Math.floor(Math.random()*999999999999).toString(26);//dont really need this
    $scope.userName = adjs[Math.floor(Math.random() * adjs.length)] + ' ' + nouns[Math.floor(Math.random() * nouns.length)];
    $scope.blockUser = []
    $scope.chatLines = [{
        txt: '<i>System: Start chatting!</i>',
        id: 0.12345
    }];
    console.log('generating name');

    window.onkeyup = function(e) {
        if (e.which == 13) {
            $scope.speak();
        }
    };
    $scope.speak = function() {
        var text = $('#chatInp').val();
        if (text.indexOf('/wiki ') === 0) {
            var stuffToWiki = text.replace('/wiki ', '');
            text = '<a href="http://en.wikipedia.org/wiki/' + stuffToWiki + '" target="_blank">' + stuffToWiki + '</a>';
            text = $scope.userName + ': ' + text;
            socket.emit('chatIn', {
                chatText: text
            });
        } else if (text.indexOf('/block ') === 0) {
            //this and the next 2 if's do not send the data.
            $scope.blockEm(text.replace('/block ', ''), 0);
            return 0;
        } else if (text.indexOf('/unblock ') === 0) {
            $scope.blockEm(text.replace('/unblock ', ''), 1);
            return 0;
        } else if (text === '') {
            return 0;
        } else if (text.indexOf('<') != -1 || text.indexOf('>') != -1) {
            console.log('found some codebits');
            text = text.replace(/[<]/gi, '&lt;').replace(/[>]/, '&gt;');
            console.log(text);
            text = $scope.userName + ': ' + text;
            socket.emit('chatIn', {
                chatText: text
            });
        } else {
            text = $scope.userName + ': ' + text;
            socket.emit('chatIn', {
                chatText: text
            });
        }
        $('#chatInp').val('');

    };
    $scope.blockEm = function(text, mode) {
        if (!mode) {
            //add user to block list
            $scope.blockUser.push(text);
        } else if ($scope.blockUser.indexOf(text) != -1) {

            $scope.blockUser.splice($scope.blockUser.indexOf(text), 1);
        }
        $('#chatInp').val('');
        $scope.$apply();
    };
    socket.on('chatOut', function(text) {
        //first, check to see if user is on block list
        var foundBlock = false;
        for (var i = 0; i < $scope.blockUser.length; i++) {
            if (text.chatText.indexOf($scope.blockUser[i]) === 0) {
                foundBlock = true;
            }
        }
        if (!foundBlock) {
            $scope.chatLines.push({
                txt: text.chatText,
                id: Math.random()
            });
        }
        var chatHeight = 31 * $scope.chatLines.length;
        $('#chatLog').animate({
            scrollTop: chatHeight
        }, 100);
        $('#chatLog').scrollTop(chatHeight);
        $scope.$apply();
        $('#chatLog').focus();
    });
});