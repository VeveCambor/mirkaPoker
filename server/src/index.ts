import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createRoom, getRoom, joinRoom, exitRoom, vote, revealVotes, getResults, getAllRooms } from './room';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const port = 3000;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/", (req, res) => res.send("Express on Render!!!"));

app.post('/room', (req, res) => {
  const { scrumMasterName } = req.body;
  if (!scrumMasterName) {
    return res.status(400).json({ error: 'Scrum Master name is required' });
  }
  const room = createRoom(scrumMasterName);
  res.json(room);
});

app.get('/room/:id', (req, res) => {
  const room = getRoom(req.params.id);
  if (room) {
    res.json(room);
  } else {
    res.status(404).send('Room not found');
  }
});

io.on('connection', (socket) => {
  const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
  console.log(`User connected: ${socket.id}, IP: ${clientIp}`); // Vypíše sa IP adresa používateľa

  let inactivityTimeout: NodeJS.Timeout | null = null; // doplnene: premenná pre ukladanie časového limitu nečinnosti ADDED

  // doplnene: funkcia na resetovanie časového limitu nečinnosti ADDED
  const resetInactivityTimeout = () => {
    if (inactivityTimeout) {
      clearTimeout(inactivityTimeout); // doplnene: vymaže predchádzajúci časový limit, ak existuje
    }
    inactivityTimeout = setTimeout(() => {
      console.log(`User disconnected due to inactivity: ${socket.id}`);
      socket.disconnect(); // doplnene: odpojí používateľa po 15 minútach nečinnosti
    }, 15 * 60 * 1000); // doplnene: nastaví časový limit na 15 minút
  };

  resetInactivityTimeout(); // doplnene: inicializuje časový limit po pripojení

  socket.on('joinRoom', ({ roomId, userName }, callback) => {
    const room = joinRoom(roomId, userName, socket.id);
    if (room) {
      console.log(`User ${userName} joined room ${roomId}, IP ${clientIp}`);
      socket.join(roomId);
      io.to(roomId).emit('updateRoom', room);
      callback({ success: true });
    } else {
      callback({ success: false, message: 'Username already taken' });
    }
    resetInactivityTimeout(); // doplnene: resetuje časový limit po pripojení do miestnosti ADDED
  });

  socket.on('vote', ({ roomId, userName, vote: userVote }) => {
    vote(roomId, userName, userVote);
    const room = getRoom(roomId);
    io.to(roomId).emit('updateRoom', room);
  });

  socket.on('startEvaluation', (roomId) => {
    const room = getRoom(roomId);
    if (room) {
      io.to(roomId).emit('startEvaluation');
      let countdown = 7;
      const countdownInterval = setInterval(() => {
        countdown--;
        io.to(roomId).emit('countdown', countdown);
        if (countdown === 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);
    }
    resetInactivityTimeout(); // doplnene: resetuje časový limit po pripojení do miestnosti ADDED
  });

  socket.on('revealVotes', ({ roomId, userName }) => {
    revealVotes(roomId, userName);
    const room = getRoom(roomId);
    io.to(roomId).emit('updateRoom', room);
    io.to(roomId).emit('results', getResults(roomId));
    resetInactivityTimeout(); // doplnene: resetuje časový limit po pripojení do miestnosti ADDED
  });

  socket.on('resetEvaluation', (roomId) => {
    const room = getRoom(roomId);
    if (room) {
      room.votesRevealed = false;
      room.users.forEach(user => user.vote = undefined);
      io.to(roomId).emit('updateRoom', room);
      io.to(roomId).emit('countdown', 7); 
      io.to(roomId).emit('resetCard'); // Emit reset card event
    }
  });

  socket.on('sendJoke', ({ roomId, joke }) => {
    io.to(roomId).emit('newJoke', joke);
  });

  socket.on('disconnecting', (reason) => {
    console.log(`User disconnecting: ${socket.id}, reason: ${reason}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
    exitRoom(socket.id);
    const rooms = getAllRooms();
    for (const room of rooms) {
      if (room.users.length > 0) {
        io.to(room.id).emit('updateRoom', room);
      } else {
        io.to(room.id).emit('roomClosed');
      }
    }
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running at http://localhost:${port}`);
});
