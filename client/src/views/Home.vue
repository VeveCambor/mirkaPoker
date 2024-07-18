<template>
  <div  v-if="loading">
    <h1>LOADING...</h1>
    <br/>
    <p>This app runs on a free tier. The server starts after approximately 1 minute and then the app will run normally.</p>
    <br/>
    <p><i>(poor developers)</i></p>
    <br/>
    <br/>
  </div>
  <div v-else>
    <h1>Mirka's Planning Poker</h1>
    <br/>
    <input v-model="scrumMasterName" placeholder="Enter Scrum Master name" />
    <button @click="createRoom">Create Room</button>
    <br/>
    <br/>
    <p><i>Happy Evaluation ^.^</i></p>
    <div v-if="roomId">
      <p>Room created! Share this link:</p>
      <a :href="roomLink">{{ roomLink }}</a>
      <br/>
      <br/>
      <button @click="goToRoom">Go to Room</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'HomePage',
  data() {
    return {
      scrumMasterName: '',
      roomId: null,
      loading: true,
    };
  },
  computed: {
    roomLink() {
      return `${window.location.origin}/room/${this.roomId}`;
    },
  },
  methods: {
    async createRoom() {
      if (!this.scrumMasterName) {
        alert('Please enter the Scrum Master name');
        return;
      }
      try {
        // const response = await axios.post('http://localhost:3000/room', { scrumMasterName: this.scrumMasterName });
        const response = await axios.post('https://mirkapoker-server.onrender.com/room', { scrumMasterName: this.scrumMasterName });
        this.roomId = response.data.id;
      } catch (error) {
        console.error(error);
        alert('Failed to create room');
      }
    },
    goToRoom() {
      this.$router.push({
        path: `/room/${this.roomId}`,
        query: { userName: this.scrumMasterName }
      });
    },
    async checkServerStatus() {
      try {
        await axios.get('https://mirkapoker-server.onrender.com');
        this.loading = false;
      } catch (error) {
        console.error('Server is not up yet, retrying...');
        setTimeout(this.checkServerStatus, 3000); // Retry after 3 seconds
      }
    },
    // async fetchJoke() {
    //   try {
    //     const response = await axios.get('https://v2.jokeapi.dev/joke/Programming'); // Replace with your joke API URL
    //     console.log(response)
    //     if(response.data.joke){
    //       this.joke = response.data.joke;
    //     } else {
    //       this.joke = response.data.setup;
    //     }
    //     console.log(this.joke)
    //   } catch (error) {
    //     console.error('Failed to fetch joke', error);
    //   }
    // }
  },
  mounted() {
    this.checkServerStatus();
  }
};
</script>

<style scoped>
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
</style>
