import { createApp } from 'vue';
import App from './App.vue';
import io from 'socket.io-client';
import router from './router';

const socket = io('http://172.19.104.61:3000'); // Nahraďte YOUR_IP_ADDRESS skutočnou IP adresou vášho počítača

const app = createApp(App);
app.config.globalProperties.$socket = socket;
app.use(router).mount('#app');
