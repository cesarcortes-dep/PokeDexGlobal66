import { createRouter, createWebHistory } from 'vue-router'
import ListView from '@/views/ListView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'list',
      component: ListView,
    },
    {
      // El detalle como ruta da URL compartible y "atrás" del navegador gratis.
      // Si el Figma lo resuelve como modal, esto cambia (ver ADR-0005 pendiente).
      path: '/pokemon/:name',
      name: 'detail',
      component: () => import('@/views/DetailView.vue'),
      props: true,
    },
    {
      // TODO: 404 propio si el Figma lo contempla.
      path: '/:pathMatch(.*)*',
      redirect: { name: 'list' },
    },
  ],
})

export default router
