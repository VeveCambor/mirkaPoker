<template>
  <div>
    <h1>Hello, {{ userName }}!</h1>
    <div v-if="!joined">
      <input v-model="userName" placeholder="Enter your name" />
      <button @click="joinRoom">Join Room</button>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>
    <div v-else>
      <p>Room {{ roomId }}</p>
      <br/>
      <div v-if="isScrumMaster">
        <input v-model="storyTitle" placeholder="Enter story title" />
      </div>
      <div v-if="evaluationStarted">
        <h2>Evaluation in progress: {{ countdown }}</h2>
      </div>
      <br/>
      <div class="players-container" v-if="room">
        <div class="player" v-for="user in room.users" :key="user.name" :class="{ scrumMaster: user.isScrumMaster, voted: user.vote !== undefined }">
          <p>{{ user.name }}</p>
          <p v-if="room.votesRevealed && !user.isScrumMaster" class="vote">{{ user.vote }}</p>
          <p v-else-if="user.name === userName && selectedCard !== null" class="vote">{{ selectedCard }}</p>
        </div>
      </div>
      <p v-if="!isScrumMaster">Select your vote:</p>
      <div v-if="!isScrumMaster">
        <div v-for="card in fibonacci" :key="card" class="card">
          <button @click="castVote(card)">{{ card }}</button>
        </div>
      </div>
      <br/>
      <div v-if="!room.votesRevealed">
        <button v-if="isScrumMaster && !evaluationStarted" @click="startEvaluation">Start Evaluation</button>
        <button v-if="isScrumMaster && !evaluationStarted" @click="revealVotes">Reveal Votes</button>
        <button v-if="isScrumMaster && evaluationStarted" @click="revealVotes">Reveal Votes</button>
        <button v-if="isScrumMaster && room.votesRevealed" @click="resetEvaluation">Restart Evaluation</button>
      </div>
      <div v-if="room.votesRevealed">
        <h2>Votes</h2>
        <div class="results">
          <p>Average vote: <b>{{ results.average }}</b></p>
        </div>
        <button v-if="isScrumMaster" @click="resetEvaluation">Restart Evaluation</button>
      </div>
      <div class="history" v-if="storyHistory.length > 0">
        <h2>Story History</h2>
        <table>
          <thead>
            <tr>
              <th>Story Title</th>
              <th>Average Vote</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="story in storyHistory" :key="story.title">
              <td>{{ story.title }}</td>
              <td>{{ story.average }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-if="isScrumMaster && room" class="room-link">
      <p>Room link: <a :href="roomLink">{{ roomLink }}</a></p>
    </div>
  </div>
</template>

<script>
import io from 'socket.io-client';

export default {
  name: 'RoomPage',
  data() {
    return {
      roomId: this.$route.params.id,
      userName: '',
      room: null,
      joined: false,
      fibonacci: [1, 2, 3, 5, 8, 13, 21],
      results: {},
      evaluationStarted: false,
      countdown: 10,
      errorMessage: '',
      storyTitle: '',
      storyHistory: [],
      selectedCard: null
    };
  },
  computed: {
    isScrumMaster() {
      return this.room && this.room.scrumMaster === this.userName;
    },
    roomLink() {
      return `${window.location.origin}/room/${this.roomId}`;
    },
    filteredUsers() {
      return this.room ? this.room.users.filter(user => !user.isScrumMaster) : [];
    }
  },
  mounted() {
    // this.socket = io('http://localhost:3000');
    this.socket = io('https://mirkapoker-server.onrender.com');
    this.socket.on('updateRoom', (room) => {
      this.room = room;
    });
    this.socket.on('results', (results) => {
      this.results = results;
      if (this.isScrumMaster && this.storyTitle) {
        this.storyHistory.push({ title: this.storyTitle, average: results.average });
        this.storyTitle = '';
      }
    });
    this.socket.on('startEvaluation', () => {
      this.evaluationStarted = true;
      this.countdown = 10;
      this.selectedCard = null; // Reset selected card on evaluation start
    });
    this.socket.on('countdown', (count) => {
      this.countdown = count;
      if (count === 0) {
        this.evaluationStarted = false;
      }
    });
    this.socket.on('resetCard', () => {
      this.selectedCard = null;
    });
    this.socket.on('roomClosed', () => {
      alert('Room has been closed.');
      this.joined = false;
      this.room = null;
      localStorage.removeItem('savedRoom');
    });

    const userName = this.$route.query.userName;
    if (userName) {
      this.userName = userName;
      this.joinRoom();
    }
  },
  methods: {
    joinRoom() {
      this.socket.emit('joinRoom', { roomId: this.roomId, userName: this.userName }, (response) => {
        if (response.success) {
          this.joined = true;
          this.errorMessage = '';
          const savedRoom = {
            id: this.roomId,
            userName: this.userName,
            isScrumMaster: this.isScrumMaster
          };
          localStorage.setItem('savedRoom', JSON.stringify(savedRoom));
        } else {
          this.errorMessage = response.message;
        }
        this.$router.push({
          path: `/room/${this.roomId}`,
          query: { userName: this.userName }
      });
      });
    },
    castVote(card) {
      this.selectedCard = card;
      this.socket.emit('vote', { roomId: this.roomId, userName: this.userName, vote: card });
    },
    revealVotes() {
      this.socket.emit('revealVotes', { roomId: this.roomId, userName: this.userName });
    },
    startEvaluation() {
      this.socket.emit('startEvaluation', this.roomId);
    },
    resetEvaluation() {
      this.evaluationStarted = false;
      this.countdown = 10;
      // this.selectedCard = null;
      this.socket.emit('resetEvaluation', this.roomId);
      // this.socket.emit('resetCard', this.roomId); // Emit reset card event
    }
  },
  beforeUnmount() {
    localStorage.removeItem('savedRoom');
  }
};
</script>

<style scoped>
.room-link {
  position: absolute;
  bottom: 0;
  width: 99%;
  text-align: center;
  background-color: #f9f9f9;
  border-top: 1px solid #ddd;
}

.players-container {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.player {
  width: 100px;
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #000;
  border-radius: 50%;
  background-color: #f0f0f0;
  margin: 5px;
}

.player.scrumMaster {
  background-color: #ffc107;
}

.player.voted {
  background-color: #90ee90;
}

.player.voted .vote {
  background-color: #90ee90;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-top: 5px;
}

.card {
  display: inline-block;
  margin: 5px;
}

.card button {
  font-size: 1.2em;
  padding: 10px 20px;
  border: 2px solid #007bff;
  border-radius: 5px;
  background-color: white;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.card button:hover {
  background-color: #007bff;
  color: white;
}

.card button.selected {
  background-color: #007bff;
  color: white;
}

.history {
  position: absolute;
  right: 0;
  top: 0;
  width: 300px;
  height: 100%;
  padding: 10px;
  background-color: #fff;
  border-left: 1px solid #ddd;
  overflow-y: auto;
}

.history table {
  width: 100%;
  border-collapse: collapse;
}

.history th,
.history td {
  border: 1px solid #ddd;
  padding: 8px;
}

.history th {
  background-color: #f2f2f2;
}
</style>
