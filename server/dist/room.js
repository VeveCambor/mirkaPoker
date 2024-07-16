"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRooms = exports.getResults = exports.revealVotes = exports.vote = exports.exitRoom = exports.joinRoom = exports.getRoom = exports.createRoom = void 0;
const uuid_1 = require("uuid");
const rooms = [];
const createRoom = (scrumMasterName) => {
    const room = {
        id: (0, uuid_1.v4)(),
        users: [{ name: scrumMasterName, isScrumMaster: true, id: (0, uuid_1.v4)(), vote: undefined }],
        votesRevealed: false,
        scrumMaster: scrumMasterName,
    };
    rooms.push(room);
    return room;
};
exports.createRoom = createRoom;
const getRoom = (id) => {
    return rooms.find(room => room.id === id);
};
exports.getRoom = getRoom;
const joinRoom = (id, userName, socketId) => {
    const room = (0, exports.getRoom)(id);
    if (room) {
        if (!room.users.some(user => user.name === userName)) {
            room.users.push({ name: userName, isScrumMaster: false, id: socketId, vote: undefined });
        }
    }
    return room;
};
exports.joinRoom = joinRoom;
const exitRoom = (socketId) => {
    for (const room of rooms) {
        room.users = room.users.filter(user => user.id !== socketId);
        if (room.users.length === 0) {
            const index = rooms.indexOf(room);
            if (index !== -1) {
                rooms.splice(index, 1);
            }
        }
    }
};
exports.exitRoom = exitRoom;
const vote = (id, userName, userVote) => {
    const room = (0, exports.getRoom)(id);
    if (room) {
        const user = room.users.find(u => u.name === userName);
        if (user) {
            user.vote = userVote;
        }
    }
};
exports.vote = vote;
const revealVotes = (id, userName) => {
    const room = (0, exports.getRoom)(id);
    if (room && room.scrumMaster === userName) {
        room.votesRevealed = true;
    }
};
exports.revealVotes = revealVotes;
const getResults = (id) => {
    const room = (0, exports.getRoom)(id);
    if (room && room.votesRevealed) {
        const votes = room.users.map(user => user.vote).filter(vote => vote !== undefined);
        const average = votes.length > 0 ? votes.reduce((a, b) => a + b, 0) / votes.length : 0;
        const results = room.users.filter(user => user.vote !== undefined).map(user => ({ name: user.name, vote: user.vote }));
        return { average, votes: results };
    }
    return null;
};
exports.getResults = getResults;
const getAllRooms = () => {
    return rooms;
};
exports.getAllRooms = getAllRooms;
