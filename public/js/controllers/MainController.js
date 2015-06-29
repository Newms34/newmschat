var app = angular.module("Chat", ['ngSanitize']);
var adjs = ['Insidious', 'Merciful', 'Heavenly', 'Woebegone', 'Victorious', 'Itchy', 'Crooked', 'Wise', 'Wiggly', 'August'];
var nouns = ['Ladybug', 'Airplane', 'Dog', 'Cat', 'Chipmunk', 'Potato', 'Snail', 'Horse', 'Iguana', 'Pickle'];


var socket = io();

app.controller("MainController", function($scope, $window) {
    //on instantiation, create random 'user key'
    // $scope.userKey = Math.floor(Math.random()*999999999999).toString(26);//dont really need this
    $scope.userName = adjs[Math.floor(Math.random() * adjs.length)] + ' ' + nouns[Math.floor(Math.random() * nouns.length)];
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
        var text = $scope.userName + ': ' + $('#chatInp').val();
        socket.emit('chatIn', {
            chatText: text
        });
    };
    socket.on('chatOut', function(text) {
        if (text.chatText.indexOf($scope.userName + ': /wiki ') === 0) {
            //user wikied!
            var stuffToWiki = text.chatText.replace($scope.userName + ': /wiki ','');
            var wikiText = $scope.userName+ ': <a href="http://en.wikipedia.org/wiki/'+stuffToWiki+'" target="_blank">'+stuffToWiki+'</a>';
            $scope.chatLines.push({
                txt: wikiText,
                id: Math.random()
            });
        } else {
            $scope.chatLines.push({
                txt: text.chatText,
                id: Math.random()
            });
        }
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