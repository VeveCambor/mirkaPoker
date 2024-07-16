import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../views/Home.vue';
import RoomPage from '../views/Room.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
  },
  {
    path: '/room/:id',
    name: 'Room',
    component: RoomPage,
  },
  {
    path: '/h',
    name: 'H',
    component: HomePage,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;


