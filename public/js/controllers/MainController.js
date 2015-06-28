var app = angular.module("Chat", []);
var adjs = ['Insidious', 'Merciful', 'Heavenly', 'Woebegone', 'Victorious', 'Itchy', 'Crooked', 'Wise', 'Wiggly', 'August'];
var nouns = ['Ladybug', 'Airplane', 'Dog', 'Cat', 'Chipmunk', 'Potato', 'Snail', 'Horse', 'Iguana', 'Pickle'];


var socket = io();

app.controller("MainController", function($scope, $window) {
    //on instantiation, create random 'user key'
    // $scope.userKey = Math.floor(Math.random()*999999999999).toString(26);//dont really need this
    $scope.userName = adjs[Math.floor(Math.random() * adjs.length)] + ' ' + nouns[Math.floor(Math.random() * nouns.length)];
    $scope.chatLines = [{
        txt: 'System: Start chatting!',
        id: 0.12345
    }];
    console.log('generating name');

    window.onkeyup = function(e) {
        if (e.which == 13) {
            $scope.speak();
        }
    };
    $scope.speak = function() {
        var text = $scope.userName + ': ' + $('#chatInp').val();
        socket.emit('chatIn', {
            chatText: text
        });
    };
    socket.on('chatOut', function(text) {
        $scope.chatLines.push({
            txt: text.chatText,
            id: Math.random()
        });
        $('#chatInp').val('');
        var chatHeight = 31 * $scope.chatLines.length;
        $('#chatLog').animate({
            scrollTop: chatHeight
        }, 100);
        $('#chatLog').scrollTop(chatHeight);
        $scope.$apply();
        $('#chatLog').focus();
    });

});