var app = angular.module("Chat", []);

var socket = io();

app.controller("MainController", function($scope, $window) {
    //on instantiation, create random 'user key'
    // $scope.userKey = Math.floor(Math.random()*999999999999).toString(26);//dont really need this
    $scope.userName = 'Anon';
    $scope.chatLines = ['System: Start chatting!'];
    console.log('generating name');
    socket.emit('regNewUser',{});
    socket.on('userRegged',function(name){
        $scope.userName = name.newName;
        $scope.$apply();
    });
    window.onkeyup = function(e){
        if (e.which==13){
            $scope.speak();
        }
    };
    $scope.speak = function(){
        var text = $scope.userName+': '+$('#chatInp').val();
        socket.emit('chatIn',{chatText:text});
    };
    socket.on('chatOut',function(text){
        $scope.chatLines.push(text.chatText);
        $scope.$apply();
    });
});