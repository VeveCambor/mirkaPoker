<template>
  <div  v-if="loading">
    <h1>LOADING</h1>
  </div>
  <div v-else>
    <h1>Planning Poker</h1>
    <input v-model="scrumMasterName" placeholder="Enter Scrum Master name" />
    <button @click="createRoom">Create Room</button>
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
      loading: true
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
    }
  },
  mounted() {
    this.checkServerStatus();
  }
};
</script>

<style scoped>
/* Add your styles here */
</style>
