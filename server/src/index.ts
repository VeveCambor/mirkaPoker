import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
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

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

app.post('/api/room', (req, res) => {
  const { scrumMasterName } = req.body;
  if (!scrumMasterName) {
    return res.status(400).json({ error: 'Scrum Master name is required' });
  }
  const room = createRoom(scrumMasterName);
  res.json(room);
});

app.get('/api/room/:id', (req, res) => {
  const room = getRoom(req.params.id);
  if (room) {
    res.json(room);
  } else {
    res.status(404).send('Room not found');
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('joinRoom', ({ roomId, userName }, callback) => {
    const room = joinRoom(roomId, userName, socket.id);
    if (room) {
      console.log(`User ${userName} joined room ${roomId}`);
      socket.join(roomId);
      io.to(roomId).emit('updateRoom', room);
      callback({ success: true });
    } else {
      callback({ success: false, message: 'Username already taken' });
    }
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
      let countdown = 10;
      const countdownInterval = setInterval(() => {
        countdown--;
        io.to(roomId).emit('countdown', countdown);
        if (countdown === 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);
    }
  });

  socket.on('revealVotes', ({ roomId, userName }) => {
    revealVotes(roomId, userName);
    const room = getRoom(roomId);
    io.to(roomId).emit('updateRoom', room);
    io.to(roomId).emit('results', getResults(roomId));
  });

  socket.on('resetEvaluation', (roomId) => {
    const room = getRoom(roomId);
    if (room) {
      room.votesRevealed = false;
      room.users.forEach(user => user.vote = undefined);
      io.to(roomId).emit('updateRoom', room);
      io.to(roomId).emit('countdown', 10); // Reset countdown to 10
      io.to(roomId).emit('resetCard'); // Emit reset card event
    }
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

// Serve index.html for all other routes to support client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running at http://localhost:${port}`);
});
