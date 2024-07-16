import { v4 as uuidv4 } from 'uuid';

interface User {
  name: string;
  vote?: number;
  isScrumMaster: boolean;
  id: string;
}

interface Room {
  id: string;
  users: User[];
  votesRevealed: boolean;
  scrumMaster: string;
  countdownInterval?: NodeJS.Timeout;
}

const rooms: Room[] = [];

export const createRoom = (scrumMasterName: string): Room => {
  const room: Room = {
    id: uuidv4(),
    users: [{ name: scrumMasterName, isScrumMaster: true, id: uuidv4(), vote: undefined }],
    votesRevealed: false,
    scrumMaster: scrumMasterName,
  };
  rooms.push(room);
  return room;
};

export const getRoom = (id: string): Room | undefined => {
  return rooms.find(room => room.id === id);
};

export const joinRoom = (id: string, userName: string, socketId: string): Room | undefined => {
  const room = getRoom(id);
  if (room) {
    if (!room.users.some(user => user.name === userName)) {
      room.users.push({ name: userName, isScrumMaster: false, id: socketId, vote: undefined });
    }
  }
  return room;
};

export const exitRoom = (socketId: string): void => {
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

export const vote = (id: string, userName: string, userVote: number): void => {
  const room = getRoom(id);
  if (room) {
    const user = room.users.find(u => u.name === userName);
    if (user) {
      user.vote = userVote;
    }
  }
};

export const revealVotes = (id: string, userName: string): void => {
  const room = getRoom(id);
  if (room && room.scrumMaster === userName) {
    room.votesRevealed = true;
  }
};

export const getResults = (id: string): { average: number, votes: { name: string, vote: number }[] } | null => {
  const room = getRoom(id);
  if (room && room.votesRevealed) {
    const votes = room.users.map(user => user.vote).filter(vote => vote !== undefined) as number[];
    const average = votes.length > 0 ? votes.reduce((a, b) => a + b, 0) / votes.length : 0;
    const results = room.users.filter(user => user.vote !== undefined).map(user => ({ name: user.name, vote: user.vote as number }));
    return { average, votes: results };
  }
  return null;
};

export const getAllRooms = (): Room[] => {
  return rooms;
};
