// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require("socket.io")(server);
var port = process.env.PORT || 3000;
var fs = require('fs');

wordlist = {
  "ro": trimWords(fs.readFileSync(__dirname + '/public/romanianWords.txt','UTF-8').split('\n')).filter(function(el) {return el.length > 3;}),
  "eng": removeLastChar(fs.readFileSync(__dirname + '/public/englishWords.txt','UTF-8').split('\n').filter(function(el) {return el.length > 3;}))
}

table = {
  "ro": [],
  "eng": []
}

lastWord = {
  "ro": getRandomWord("ro"),
  "eng": getRandomWord("eng")
}

lastUser = {
  "ro": "Server",
  "eng": "Server"
}

users = {
  "ro": [],
  "eng": []
}

roundWords = {
  "ro": [],
  "eng": []
}

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));


app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});


io.sockets.on('connection', function (socket) {

  socket.on('chat message', function (data) {
    io.sockets.in(socket.room).emit('chat message', {
      username: socket.username,
      message: data
    });
  });

  socket.on('room', function(room) {
    socket.room = room;
    socket.join(room);
  });

  socket.on('add user', function (username) {
    if(socket.room == undefined) socket.room = "ro";
    if(users[socket.room].indexOf(username)==-1) {
      users[socket.room].push(username);
      socket.username = username;
      table[socket.room].push({
        username: username,
        points: 0
      });
      io.sockets.in(socket.room).emit('user joined', {
        table: table[socket.room],
        room: socket.room
      });
      socket.emit('last word', {
        lastWord: lastWord[socket.room],
        player: lastUser[socket.room]
      });
    } else {
      response = "Exista deja un utilizator cu numele " + username + " conectat!";
      if(socket.room === "eng") {
        response = "A user with the nickname " + username + " already exists!";
      }
      socket.emit('duplicate user', response);
    }
  });

  socket.on('new word', function(word) {
    if(wordIsValid(socket.room,word)) {
      if(isClosingWord(socket.room,word) < 3) {
        points = word.length + 20;
        lastWord[socket.room] = getRandomWord(socket.room);
        winner = socket.username;
        lastUser[socket.room] = "Server";
        updateTable(socket.room,winner,points);
        roundWords[socket.room] = [];
        io.sockets.in(socket.room).emit('round end', {
          winner: winner,
          table: table[socket.room],
          room: socket.room,
          word: word,
          lastWord: lastWord[socket.room],
          points: points
        });
      } else {
        lastUser[socket.room] = socket.username;
        lastWord[socket.room] = word;
        points = word.length;
        updateTable(socket.room,socket.username,points);
        roundWords[socket.room].push(word);
        io.sockets.in(socket.room).emit('new word', {
          username: lastUser[socket.room],
          table: table[socket.room],
          room: socket.room,
          word: word,
          points: points
        });
      }
    } else {
      response = "";
      if(wordAlreadySaid(socket.room,word)) {
        if(socket.room=="ro") {
          response = "Cuvantul " + word + " a fost spus deja!";
        } else {
          response = "The word " + word + " was already said!";
        }        
      } else {
        if(socket.room=="ro") {
          response = "Cuvantul " + word + " este invalid!";
        } else {
          response = "The word " + word + " is invalid!";
        }
      }
      socket.emit("invalid word",response)
    }
  });

  socket.on('disconnect', function () {
      removeFromUsers(socket.room, socket.username);
      removeFromTable(socket.room,socket.username);
      io.sockets.in(socket.room).emit('user left', {
        table: table[socket.room],
        room: socket.room
      });
  });
});



function removeFromTable(room,username) {
  if(table[room] !== undefined) {
    table[room] =  table[room].filter(function(el) {
      return el.username !== username;
    });
  }
}

function removeFromUsers(room,username) {
  if(users[room] !== undefined) {
    index = users[room].indexOf(username);
    users[room].splice(index,1);
  }

}

function wordIsValid(room,word) {
  if(wordAlreadySaid(room,word)) {
    return false;
  }

  length = lastWord[room].length;
  if(lastWord[room].substring(length-2,length).toUpperCase() !== word.substring(0,2).toUpperCase()) {
    return false;
  }
  for(i=0;i<wordlist[room].length;i++) {
    if(wordlist[room][i].toUpperCase() === word.toUpperCase()) {
      return true;
    }
  }
  return false;
}

function isClosingWord(room,word) {
  count = 0;
  for(i=0;i<wordlist[room].length;i++) {
    if(wordlist[room][i].substring(0,2).toUpperCase() === word.substring(word.length-2,word.length).toUpperCase()) {
      count ++;
    }
  }
  return count;
}

function getRandomWord(room) {
  count = 0;
  while(1) {
    randomWord = wordlist[room][Math.floor(Math.random()*wordlist[room].length)];
    if(isClosingWord(room,randomWord) > 5) {
      return randomWord.toUpperCase();
    }
  }
}

function updateTable(room,user,points) {
  updateByUser(table[room],user,points);
  table[room].sort(compare);
}

function updateByUser(table, username, points) {
  for (var i = 0; i < table.length; i++) {
    if (table[i].username === username) {
      table[i].points += points;
    }
  }
}

function compare(a,b) {
  if (a.points < b.points)
    return 1;
  if (a.points > b.points)
    return -1;
  return 0;
}

function removeLastChar(v) {
  for(i=0;i<v.length;i++) {
      v[i] = v[i].substring(0,v[i].length-1);
  }
  return v;
}

function trimWords(v) {
  for(i=0;i<v.length;i++) {
      v[i] = v[i].trim();
  }
  return v;
}

function wordAlreadySaid(room,word) {
  if(roundWords[room] != undefined) {
    return roundWords[room].indexOf(word) != -1;
  }
}