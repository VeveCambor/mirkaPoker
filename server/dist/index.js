"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const room_1 = require("./room");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const port = 3002;
app.use((0, cors_1.default)({ origin: "*" }));
app.use(express_1.default.json());
app.get("/", (req, res) => res.send("Express on Vercel"));
app.post('/room', (req, res) => {
    const { scrumMasterName } = req.body;
    if (!scrumMasterName) {
        return res.status(400).json({ error: 'Scrum Master name is required' });
    }
    const room = (0, room_1.createRoom)(scrumMasterName);
    res.json(room);
});
app.get('/room/:id', (req, res) => {
    const room = (0, room_1.getRoom)(req.params.id);
    if (room) {
        res.json(room);
    }
    else {
        res.status(404).send('Room not found');
    }
});
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.on('joinRoom', ({ roomId, userName }, callback) => {
        const room = (0, room_1.joinRoom)(roomId, userName, socket.id);
        if (room) {
            console.log(`User ${userName} joined room ${roomId}`);
            socket.join(roomId);
            io.to(roomId).emit('updateRoom', room);
            callback({ success: true });
        }
        else {
            callback({ success: false, message: 'Username already taken' });
        }
    });
    socket.on('vote', ({ roomId, userName, vote: userVote }) => {
        (0, room_1.vote)(roomId, userName, userVote);
        const room = (0, room_1.getRoom)(roomId);
        io.to(roomId).emit('updateRoom', room);
    });
    socket.on('startEvaluation', (roomId) => {
        const room = (0, room_1.getRoom)(roomId);
        if (room) {
            io.to(roomId).emit('startEvaluation');
            let countdown = 5;
            const countdownInterval = setInterval(() => {
                countdown--;
                io.to(roomId).emit('countdown', countdown);
                if (countdown === 0) {
                    clearInterval(countdownInterval);
                }
            }, 500);
        }
    });
    socket.on('revealVotes', ({ roomId, userName }) => {
        (0, room_1.revealVotes)(roomId, userName);
        const room = (0, room_1.getRoom)(roomId);
        io.to(roomId).emit('updateRoom', room);
        io.to(roomId).emit('results', (0, room_1.getResults)(roomId));
    });
    socket.on('resetEvaluation', (roomId) => {
        const room = (0, room_1.getRoom)(roomId);
        if (room) {
            room.votesRevealed = false;
            room.users.forEach(user => user.vote = undefined);
            io.to(roomId).emit('updateRoom', room);
            io.to(roomId).emit('countdown', 5); // Reset countdown to 5
            io.to(roomId).emit('resetCard'); // Emit reset card event
        }
    });
    socket.on('disconnecting', (reason) => {
        console.log(`User disconnecting: ${socket.id}, reason: ${reason}`);
    });
    socket.on('disconnect', (reason) => {
        console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
        (0, room_1.exitRoom)(socket.id);
        const rooms = (0, room_1.getAllRooms)();
        for (const room of rooms) {
            if (room.users.length > 0) {
                io.to(room.id).emit('updateRoom', room);
            }
            else {
                io.to(room.id).emit('roomClosed');
            }
        }
    });
});
server.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${port}`);
});
