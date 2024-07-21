<template>
  <div v-if="loading">
    <h1>LOADING...</h1>
    <br/>
    <p>This app runs on a free tier. The server starts after approximately 1 minute and then the app will run normally.</p>
    <br/>
    <p><i>(poor developers)</i></p>
    <br/>
    <br/>
  </div>
  <div class="home_container" v-else>
    <h1 class="home_title">Mirka's Planning Poker</h1>
    <input class="home_input" v-if="!roomId" v-model="scrumMasterName" placeholder="Enter Scrum Master name" />
    <button class="home_button" v-if="!roomId" @click="createRoom">Create Room</button>
    <!-- <p><i>Happy Evaluation ^.^</i></p> -->
    <div v-if="roomId">
      <p>Room created! Share this link:</p>
      <a class="link_text" :href="roomLink">{{ roomLink }}</a>
      <button class="home_button" @click="goToRoom">Go to Room</button>
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
.home_container {
  position: relative;
  height: 100vh; 
  display: flex;
  flex-direction: column;
  align-items: center;
}

.home_container::after {
  content: "";
  background-image: url('../assets/cards-bg.png');
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
  position: absolute;
  bottom: 6rem;
  left: 0;
  width: 100%;
  height: 60%;
}

.home_title {
  font-size: 3rem;
  color: #ffffff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  margin-top: 2rem;
  margin-bottom: 2rem;
}

.home_input {
  width: 30%;
  padding: 0.5rem;
  font-size: 1rem;
  border-radius: 4px;
  border: none;
  outline-color: #ef476f;
}

.home_button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border-radius: 4px;
  border: none;
  background-color: #ef476f;
  color: #ffffff;
  margin-top: 3rem;
  cursor: pointer;
}
.home_button:hover {
  background-color: #ff6d8a;
  box-shadow: 10px 10px 15px rgba(0, 0, 0, 1);
}

.link_text {
  color: #ff6d8a;
  text-decoration: none;
  margin-top: 1rem;
  display: block;
  font-size: 1rem;
  cursor: pointer;
}
.link_text:hover {
  text-decoration: underline;
}

p {
  font-size: 1.2rem;
}

</style>
