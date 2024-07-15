<template>
  <div>
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
        const response = await axios.post('http://localhost:3000/room', { scrumMasterName: this.scrumMasterName });
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
  },
};
</script>

<style scoped>
/* Add your styles here */
</style>
