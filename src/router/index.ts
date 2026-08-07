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
      // Favoritos es una **ruta** y no un estado interno de la lista: el Figma
      // lo pone en la barra de navegación, y así tiene URL propia y el botón
      // "atrás" del navegador funciona entre las dos vistas.
      //
      // Reusa `ListView` en lugar de duplicarla: es la misma pantalla con la
      // fuente de datos filtrada, y `onlyFavorites` se lo dice por props.
      path: '/favoritos',
      name: 'favorites',
      component: ListView,
      props: { onlyFavorites: true },
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
