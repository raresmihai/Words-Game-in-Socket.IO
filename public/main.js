var socket=io();
var roundEnd = false;

function roClicked() {
    $("#nickname-q").html("Introduceti numele");
    $("#lastWordInfo").html("Ultimul cuvant");
    $("#pnlTitle").html("Joaca FAZAN");
    $("#players-header").html("Jucatori");
    $("#rules-header").html("Reguli");
    $("#ruleTitle").html("Jocul Fazan");
    $("#mainRule").text("Formeaza un cuvant cu ultimele 2 litere ale cuvantului precedent pentru a acumula puncte!");
    $("#rulePoints").text("Punctaj");
    $("#mainPoints").text("1 punct pentru fiecare litera a cuvantului");
    $("#closingPoints").text("20 de puncte pentru inchidere");
    $(".language.page").fadeOut();
    $(".login.page").show();
    socket.emit("room","ro");
}

function engClicked() {
    $("#nickname-q").html("What's your nickname?");
    $("#lastWordInfo").html("Last word");
    $("#pnlTitle").html("Play PHEASANT");
    $("#players-header").html("Players");
    $("#rules-header").html("Rules");
    $("#ruleTitle").html("Pheasant game");
    $("#mainRule").text("Form a word with the last 2 letters of the previous word to get points!");
    $("#rulePoints").text("Scoring");
    $("#mainPoints").text("1 point for each word letter");
    $("#closingPoints").text("20 points for closing words");
    $(".language.page").fadeOut();
    $(".login.page").show();
    socket.emit("room","eng");
}

//setUsername
$(function(){
 $("#user-form input").keypress(function (e) {
    if (e.keyCode == 13) {
        username = $("#userInput").val();
        socket.emit("add user",username);
    }
 });

 $("#input-form input").keypress(function (e) {
    if (e.keyCode == 13) {
        socket.emit('chat message', $('#m').val());
        $('#m').val('');
    }
 });

  $("#word-form input").keypress(function (e) {
    if (e.keyCode == 13) {
        word = $('#first2').text() + $('#word').val();
        word = word.toUpperCase().trim();
        socket.emit('new word', word);
        $('#word').val('');
    }
 });
});

socket.on('login', function (data) {
connected = true;
// Display the welcome message
});

// Whenever the server emits 'new message', update the chat body
socket.on('chat message', function (data) {
    $('#messages').append($('<li>').text(data.username + ": " + data.message));
    $("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
});

socket.on('user joined', function (data) {
    updateTable(data);
});

socket.on('user left', function (data) {
    updateTable(data);
});

socket.on('invalid word', function(response) {
    $('#invalid').html(response);
    $('#invalid').show();
});

socket.on('last word', function(data) {
    $(".login.page").fadeOut();
    $(".main.page").show();
    player = data["player"];
    lastWord = data["lastWord"];
    $('#lastWord').html(player + ": " + lastWord);
    $('#first2').html(data["lastWord"].substring(data["lastWord"].length-2,data["lastWord"].length));
});

socket.on('new word', function(data) {
    response = data["username"] + ": " + data["word"] + " " + data["points"] + "p"
    $('#lastWord').html(response);
    $('#first2').html(data["word"].substring(data["word"].length-2,data["word"].length));
    updateTable(data);
    if(roundEnd) {
        roundEnd = false;
        $('#ending').fadeOut();
        $('#endingWord').fadeOut();
    }
    $("#invalid").fadeOut();
});

socket.on('round end', function(data) {
    response = data["winner"];
    if(data["room"]=="ro") {
        response += " a inchis runda!";
    } else {
        response += " closed the round!";
    }
    $('#ending').html(response);
    response = data["winner"] + ": " + data["word"] + " " + data["points"] + "p"
    $('#endingWord').html(response);
    lastWord = data["lastWord"];
    $('#lastWord').html("Server" + ": " + lastWord);
    $('#ending').show();
    $('#endingWord').show();
    roundEnd = true;
    $("#invalid").fadeOut();
    updateTable(data);
    $('#first2').html(data["lastWord"].substring(data["lastWord"].length-2,data["lastWord"].length));
});

socket.on('duplicate user', function(response) {
    $('#loginInfo').html(response);
    $('#loginInfo').show();
});


function updateTable(data) {
    table = data["table"];

    header = "";
    if(data["room"]=="ro") {
        header = '<tr>' + '<th>Nume</th>' +'<th>Punctaj</th>' + '</tr>';
    } else {
        header = '<tr>' + '<th>Name</th>' +'<th>Points</th>' + '</tr>';
    }    
    $("#tableHead").empty();
    $("#tableHead").append(header);

    $("#tableBody").empty();
    for(var i=0;i<table.length;i++) {
        newRow = '<tr>' + '<th>'+table[i].username+'</th>' +'<th>'+table[i].points+'</th>' + '</tr>';
        $('#tableBody').append(newRow);
    }
}

function wordIsValid(word) {
    return false;
}