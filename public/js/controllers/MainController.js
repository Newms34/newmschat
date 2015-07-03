var app = angular.module("Chat", ['ngSanitize']);
var adjs = ['Insidious', 'Merciful', 'Heavenly', 'Woebegone', 'Victorious', 'Itchy', 'Crooked', 'Wise', 'Wiggly', 'August', 'Enormous', 'Fluffy', 'Big Bad', 'Odiferous', 'Sinister'];
var nouns = ['Ladybug', 'Airplane', 'Dog', 'Cat', 'Chipmunk', 'Potato', 'Snail', 'Horse', 'Iguana', 'Pickle', 'Tyrannosaurus', 'Orangutan', 'Wallaby', 'Aardvark', 'Noodle', 'Wolf', 'Beluga', 'Ant', 'Orangutan'];


var socket = io();

app.controller("MainController", function($scope, $window) {
    $scope.userName = adjs[Math.floor(Math.random() * adjs.length)] + ' ' + nouns[Math.floor(Math.random() * nouns.length)];
    $scope.blockUser = [];
    $scope.colCycle = false;
    $scope.els;
    $scope.updateShow = false;
    $scope.commanding = false;
    $scope.focused = false;
    $scope.textHist = [];
    $scope.textHistNum = 0;
    $scope.loggedIn = false;
    $scope.allUsers = [];
    $scope.newMsg = false;
    $scope.muted = false;
    $scope.loading = true;
    $scope.adminShow = false;
    $scope.tempAdminData = [];
    $scope.audioCont = (window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext);
    $scope.chatLines = [{
        txt: '<i>System: Start chatting!</i>',
        id: 0.12345
    }];
    //ban check stuff
    socket.emit('chkBan', {
        name: $scope.userName
    });
    socket.on('chkBanRep', function(ban) {
        if (ban.status === true && ban.name == $scope.userName) {
            //user b&!
            console.log('banned ', ban.name);
        } else {
            //user not b&!
            console.log('not banned ', ban.name);
        }
    });

    //audio stuff
    if ($scope.audioCont) {
        $scope.context = new $scope.audioCont();
        $scope.gainValue = 0.2; //vol!
        $scope.gainNode = $scope.context.createGain ? $scope.context.createGain() : $scope.context.createGainNode();
        $scope.oscillator;
    } else {
        alert('Your browser doesn\'t support webaudio. Sorry!');
    }
    $scope.beep = function(beepArr) {
        if (typeof $scope.oscillator != 'undefined') $scope.oscillator.disconnect(); //if there is a previous osc, disconnect it first
        $scope.oscillator = $scope.context.createOscillator();
        $scope.oscillator.frequency.value = beepArr[0];
        $scope.oscillator.connect($scope.gainNode);
        $scope.gainNode.connect($scope.context.destination);
        $scope.gainNode.gain.value = $scope.gainValue;
        $scope.oscillator.type = 'sine';
        $scope.oscillator.start ? $scope.oscillator.start(0) : $scope.oscillator.noteOn(0);
        setTimeout(function() {
            $scope.oscillator.disconnect();
            console.log(beepArr)
            beepArr.shift();
            console.log(beepArr);
            if (beepArr.length){
                $scope.beep(beepArr);
            }
        }, 75);
    };

    socket.on('discBeep',function(empty){
        $scope.beep([220,207,195]);
    })

    window.onkeyup = function(e) {
        //first two focus and send message
        //second two scroll thru previous entries
        if (e.which == 13 && $scope.focused && !$scope.updateShow) {
            e.preventDefault();
            $scope.speak();
            $scope.focused = false;
            $('#chatInp').blur();
        } else if ((e.which == 13 || e.which == 191) && !$scope.focused) {
            e.preventDefault();
            $scope.focused = true;
            if (e.which == 191) {
                $('#chatInp').val('/');
            }
            $('#chatInp').focus();
        } else if (e.which == 38 && $scope.textHistNum && $scope.textHist.length) {
            e.preventDefault();
            $scope.textHistNum--;
            $('#chatInp').val($scope.textHist[$scope.textHistNum]);
        } else if (e.which == 40 && $scope.textHistNum < $scope.textHist.length - 1 && $scope.textHist.length) {
            //scroll down
            e.preventDefault();
            $scope.textHistNum++;
            $('#chatInp').val($scope.textHist[$scope.textHistNum]);
        }
        var txt = $('#chatInp').val();
        if (txt[0] == '/') {
            $scope.commanding = true;
        } else {
            $scope.commanding = false;
        }
    };
    $('#chatInp').focus(function() {
        $scope.focused = true;
    });
    $scope.speak = function() {
        var text = $('#chatInp').val();
        if (text !== '' && text != ' ') {
            //text not empty, add to list
            $scope.textHist.pop();
            $scope.textHist.push(text);
            $scope.textHist.push('');
            $scope.textHistNum = $scope.textHist.length - 1;
            if ($scope.textHistNum > 30) {
                $scope.textHist.shift();
                $scope.textHist.shift();
                $scope.textHistNum -= 2;
            }
        }
        if (text.indexOf('/wiki ') === 0) {
            var stuffToWiki = text.replace('/wiki ', '');
            text = '<b>Wikipedia: </b><a href="http://en.wikipedia.org/wiki/' + stuffToWiki + '" target="_blank">' + stuffToWiki + '</a>';
            text = $scope.userName + ': ' + text;
            socket.emit('chatIn', {
                name: $scope.userName,
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
            text = '<b>Google: </b><a href="https://www.google.com/search?q=' + stuffToGoogle + '" target="_blank">' + stuffToGoogle + '</a>';
            text = $scope.userName + ': ' + text;
            socket.emit('chatIn', {
                name: $scope.userName,
                chatText: text
            });
        } else if (text === '') {
            return 0;
        } else if (text.indexOf('<') != -1 || text.indexOf('>') != -1) {
            text = text.replace(/[<]/gi, '&lt;').replace(/[>]/, '&gt;');
            text = $scope.userName + ': ' + text;
            socket.emit('chatIn', {
                name: $scope.userName,
                chatText: text
            });
        } else {
            text = $scope.userName + ': ' + text;
            socket.emit('chatIn', {
                name: $scope.userName,
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
        var found = false;
        for (var n = 0; n < $scope.allUsers.length; n++) {
            if ($scope.allUsers[n].user == text) {
                found = true;
            }
        }
        if (!mode && found) {
            //user exists and is online
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
            //okay to add
            var x = new Date();
            var theTime = x.getHours() + ':' + x.getMinutes() + ':' + x.getSeconds();
            var theText = theTime + ' - ' + text.chatText;
            $scope.chatLines.push({
                name: text.name,
                txt: theText,
                id: Math.random()
            });
            if (text.name !== $scope.userName) {
                //not this user
                if (!document.hasFocus()) {
                    document.title = 'NewmsChat(!)'
                    $scope.newMsg = true;
                }
                //beep
                if (!$scope.muted) {
                    $scope.beep([440,466.164,493.883]);
                }
            }
        }
        //now see if we need to start deleting 'old' entries
        if ($scope.chatLines.length > 40) {
            $scope.chatLines.shift();
        }
        var chatHeight = 31 * $scope.chatLines.length;
        $('#chatLog').animate({
            scrollTop: chatHeight
        }, 100);
        $('#chatLog').scrollTop(chatHeight);
        $scope.$apply();
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
        $scope.allUsers = [];
        for (var q = 0; q < users.list.length; q++) {
            $scope.allUsers.push({
                user: users.list[q].userName,
                status: users.list[q].state,
                banned: false
            });
        }
        $scope.$digest();
    });

    socket.on('servUserDataAll', function(users) {
        //for bans
        console.log('servAll:', users);
        $scope.allUsers = [];
        console.log('all:', $scope.allUsers);
        for (var q = 0; q < users.list.length; q++) {
            $scope.allUsers.push({
                user: users.list[q].userName,
                status: users.list[q].state,
                banned: users.list[q].userBanned
            });
        }
        console.log('all:', $scope.allUsers);
        $scope.tempAdminData = []; //empty temp data
        $scope.allUsers.forEach(function(usr) {
            $scope.tempAdminData.push({
                user: usr.user,
                status: usr.status,
                banned: usr.banned
            });
        });
        socket.emit('chkBan', {
            name: $scope.userName
        })
        $scope.$digest();
    });

    $scope.toggleAdmin = function() {
        if ($scope.adminShow) {
            //already showing admin window, so hide it.
            $scope.adminShow = false;
        } else {
            $scope.tempAdminData = []; //empty temp data
            $scope.allUsers.forEach(function(usr) {
                $scope.tempAdminData.push({
                    user: usr.user,
                    status: usr.status,
                    banned: usr.banned
                });
            });
            $scope.adminShow = true;
        }
    };
    $scope.adminLogin = function() {
        $scope.passAttempt = $('#thePass').val();
        socket.emit('admin', {
            name: $scope.userName,
            pass: $scope.passAttempt
        });
    };
    $scope.banEm = function(userBan, banStatus) {
        //0 = unban, 1 = ban
        socket.emit('banUser', {
            name: userBan.user,
            banned: banStatus
        });
    };
    socket.on('logStatus', function(stat) {
        if (stat.status && (stat.name == $scope.userName)) {
            $scope.loggedIn = stat.status;
            $('#inst').slideUp(0);
        }
    });
    window.onfocus = function() {
        document.title = 'NewmsChat';
        $scope.newMsg = false;
    };

});

app.directive('ngElementReady', [function() {
    return {
        priority: -1000, // a low number so this directive loads after all other directives have loaded. 
        restrict: "A", // attribute only
        link: function($scope, $element, $attributes) {
            $scope.loading = false;
            // do what you want here.
        }
    };
}]);