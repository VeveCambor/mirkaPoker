<template>
  <div>
    <h1>Hello, {{ userName }}!</h1>
    <br />
    <div v-if="!joined">
      <input v-model="userName" placeholder="Enter your name" />
      <button @click="joinRoom">Join Room</button>
      <br/>
      <br/>
      <p><i>Happy Evaluation ^.^</i></p>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>
    <div v-else>
      <p>Room {{ roomId }}</p>
      <br />
      <div v-if="isScrumMaster">
        <input v-model="storyTitle" placeholder="Enter story title" />
      </div>
      <div v-if="evaluationStarted">
        <h2>Evaluation in progress: {{ countdown }}</h2>
      </div>
      <br />
      <div class="players-container" v-if="room">
        <div
          class="player"
          v-for="user in room.users"
          :key="user.name"
          :class="{
            scrumMaster: user.isScrumMaster,
            voted: user.vote !== undefined,
          }"
        >
          <p>{{ user.name }}</p>
          <p v-if="room.votesRevealed && !user.isScrumMaster" class="vote">
            {{ user.vote }}
          </p>
          <p
            v-else-if="user.name === userName && selectedCard !== null"
            class="vote"
          >
            {{ selectedCard }}
          </p>
        </div>
      </div>
      <br />
      <p><b>Select your vote:</b></p>
      <!-- v-if="!isScrumMaster" -->
      <div>
        <div v-for="card in fibonacci" :key="card" class="card">
          <button @click="castVote(card)">{{ card }}</button>
        </div>
      </div>
      <br />
      <br />
      <div v-if="!room.votesRevealed">
        <button
          v-if="isScrumMaster && !evaluationStarted"
          @click="startEvaluation"
        >
          Start Evaluation
        </button>
        <button v-if="isScrumMaster && !evaluationStarted" @click="revealVotes">
          Reveal Votes
        </button>
        <button v-if="isScrumMaster && evaluationStarted" @click="revealVotes">
          Reveal Votes
        </button>
        <button
          v-if="isScrumMaster && room.votesRevealed"
          @click="resetEvaluation"
        >
          Restart Evaluation
        </button>
      </div>
      <div v-if="room.votesRevealed">
        <div>
          <h2>
            Average vote: <b class="result">{{ results.average }}</b>
          </h2>
        </div>
        <br />
        <button v-if="isScrumMaster" @click="resetEvaluation">
          Restart Evaluation
        </button>
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
      <div v-if="isScrumMaster" class="joke-button">
        <br />
        <button @click="fetchJoke" class="joke">Joke at the end ?</button>
      </div>
      <div v-if="joke" class="joke">
        <br />
        <p>
          <i>Joke at the end -> <b>{{ joke }}</b></i>
        </p>
      </div>
    </div>
    <div v-if="room" class="room-link">
      <br/>
      <p>
        Room link: <a :href="roomLink">{{ roomLink }}</a>
      </p>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import io from "socket.io-client";

export default {
  name: "RoomPage",
  data() {
    return {
      roomId: this.$route.params.id,
      userName: "",
      room: null,
      joined: false,
      fibonacci: [1, 2, 3, 5, 8, 13, 21, "🍃"],
      results: {},
      evaluationStarted: false,
      countdown: 7,
      errorMessage: "",
      storyTitle: "",
      storyHistory: [],
      selectedCard: null,
      joke: "",
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
      return this.room
        ? this.room.users.filter((user) => !user.isScrumMaster)
        : [];
    },
  },
  mounted() {
    if (!this.socket) {
      // added
      this.socket = io('https://mirkapoker-server.onrender.com');
    }
    this.socket.on("updateRoom", (room) => {
      this.room = room;
    });
    this.socket.on("results", (results) => {
      this.results = results;
      if (this.isScrumMaster && this.storyTitle) {
        this.storyHistory.push({
          title: this.storyTitle,
          average: results.average,
        });
        this.storyTitle = "";
      }
    });
    this.socket.on("startEvaluation", () => {
      this.evaluationStarted = true;
      this.countdown = 7;
      // this.selectedCard = null; // Reset selected card on evaluation start
    });
    this.socket.on("countdown", (count) => {
      this.countdown = count;
      if (count === 0) {
        this.evaluationStarted = false;
      }
    });
    this.socket.on("resetCard", () => {
      this.selectedCard = null;
    });
    this.socket.on("roomClosed", () => {
      alert("Room has been closed.");
      this.joined = false;
      this.room = null;
      localStorage.removeItem("savedRoom");
    });
    this.socket.on("newJoke", (joke) => {
      this.joke = joke;
    });

    const userName = this.$route.query.userName;
    if (userName) {
      this.userName = userName;
      this.joinRoom();
    }
  },
  methods: {
    joinRoom() {
      this.socket.emit(
        "joinRoom",
        { roomId: this.roomId, userName: this.userName },
        (response) => {
          if (response.success) {
            this.joined = true;
            this.errorMessage = "";
            const savedRoom = {
              id: this.roomId,
              userName: this.userName,
              isScrumMaster: this.isScrumMaster,
            };
            localStorage.setItem("savedRoom", JSON.stringify(savedRoom));
            this.$router.push({
              path: `/room/${this.roomId}`,
              query: { userName: this.userName },
            });
          } else {
            this.errorMessage = response.message;
          }
        }
      );
    },
    castVote(card) {
      this.selectedCard = card;
      this.socket.emit("vote", {
        roomId: this.roomId,
        userName: this.userName,
        vote: card,
      });
    },
    revealVotes() {
      this.socket.emit("revealVotes", {
        roomId: this.roomId,
        userName: this.userName,
      });
    },
    startEvaluation() {
      this.socket.emit("startEvaluation", this.roomId);
    },
    resetEvaluation() {
      this.evaluationStarted = false;
      // this.countdown = 7;
      this.socket.emit("resetEvaluation", this.roomId);
    },
    async fetchJoke() {
      try {
        const response = await axios.get(
          "https://v2.jokeapi.dev/joke/Programming"
        );
        let joke = "";
        if (response.data.type === "single") {
          joke = response.data.joke;
        } else {
          joke = `${response.data.setup} - ${response.data.delivery}`;
        }
        this.socket.emit("sendJoke", { roomId: this.roomId, joke });
      } catch (error) {
        console.error("Failed to fetch joke", error);
      }
    },
  },
  beforeUnmount() {
    localStorage.removeItem("savedRoom");
  },
};
</script>

<style scoped>

.room-link {
  /* position: absolute; */
  /* bottom: 0; */
  /* width: 99%; */
  text-align: center;
  font-size: 18px;
  margin-bottom: 20px;
  padding-top: 20px;
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

button {
  /* font-size: 1.2em; */
  padding: 8px 13px;
  border: 2px solid #007bff;
  border-radius: 10px;
  background-color: #007bff;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease;
  /* color: black; */
  margin-left: 2px;
  margin-right: 2px;
  color: white;
}

.joke {
  border: 2px solid pink;
}

button:hover {
  background-color: #007bff;
  color: pink;
}

input {
  /* font-size: 1em; */
  padding: 8px 13px;
  margin-left: 2px;
  margin-right: 2px;
  /* border: 2px solid #007bff; */
  border-radius: 10px;
  transition: background-color 0.3s ease, color 0.3s ease;
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
  color: black;
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
