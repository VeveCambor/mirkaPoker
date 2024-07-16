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
        const response = await axios.post('https://mirkapoker-server.onrender.com/api/room', { scrumMasterName: this.scrumMasterName });
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
