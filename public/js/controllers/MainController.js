var app = angular.module("Chat", ['ngSanitize']);
var adjs = ['Insidious', 'Merciful', 'Heavenly', 'Woebegone', 'Victorious', 'Itchy', 'Crooked', 'Wise', 'Wiggly', 'August', 'Enormous', 'Fluffy', 'Big Bad'];
var nouns = ['Ladybug', 'Airplane', 'Dog', 'Cat', 'Chipmunk', 'Potato', 'Snail', 'Horse', 'Iguana', 'Pickle', 'Tyrannosaurus', 'Orangutan', 'Wallaby', 'Aardvark', 'Noodle', 'Wolf'];


var socket = io();

app.controller("MainController", function($scope, $window) {
    $scope.userName = adjs[Math.floor(Math.random() * adjs.length)] + ' ' + nouns[Math.floor(Math.random() * nouns.length)];
    $scope.blockUser = [];
    $scope.colCycle = false;
    $scope.els;
    $scope.allUsers = [];
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
        } else if (text.indexOf('/col') === 0) {
            $scope.els = document.getElementsByTagName('div');
            $scope.hueCycle($scope.els);
            return 0;
        } else if (text.indexOf('/google') === 0) {
            var stuffToGoogle = text.replace('/google ', '');
            text = '<a href="https://www.google.com/search?q=' + stuffToGoogle + '" target="_blank">' + stuffToGoogle + '</a>';
            text = $scope.userName + ': ' + text;
            socket.emit('chatIn', {
                chatText: text
            });
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
    $scope.hueTimer;
    $scope.hueOff = 0;
    $scope.hueCycle = function(els) {
        if (!$scope.colCycle) {
            $scope.hueTimer = setInterval(function() {
                $scope.hueOff += 20;
                for (var j = 0; j < els.length; j++) {
                    var theHue = ((j * 20) + $scope.hueOff) % 360;
                    console.log(els[j].id)
                    $('#' + els[j].id).css({
                        'filter': 'hue-rotate(' + theHue + 'deg)',
                        '-webkit-filter': 'hue-rotate(' + theHue + 'deg)'
                            // 'transform':'rotate('+theHue+'deg)'
                    });
                }
            }, 100);
            $scope.colCycle = true;
        } else {
            clearInterval($scope.hueTimer);
            $scope.colCycle = false;
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
    //save the name
    $scope.nameSave = function() {
        ($scope.keepName) ? localStorage.newmsChatName = $scope.userName: localStorage.removeItem('newmsChatName');
    };
    //retrieve name if it exists
    $scope.getName = function() {
        if (localStorage.newmsChatName) {
            //only run this bit if we already have a name
            $scope.userName = localStorage.newmsChatName;
            $scope.keepName = true;
        }
    };
    $scope.getName();

    //stuff for pinging server to let it know we're alive
    $scope.uniqId = Math.floor(Math.random() * 9999999999).toString(26);
    $scope.pingServ = setInterval(function() {
        var userStatObj = {
            name: $scope.userName,
            key: $scope.uniqId
        };
        socket.emit('pingServ', userStatObj);
        socket.emit('getServUserData', {
            x: 1
        });
    }, 90);
    socket.on('servUserData', function(users) {
        $scope.allUsers = [''];
        // users.list.forEach(function(usr){
        //     $scope.allUsers.push(usr.list.userName);
        // });
        for (var q = 0; q < users.list.length; q++) {
            $scope.allUsers.push(users.list[q].userName);
        }
        $scope.$digest();

    });
});