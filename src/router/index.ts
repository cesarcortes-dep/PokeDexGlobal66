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
      // Ruta y no modal: da URL compartible y botón "atrás" en los dos formatos.
      path: '/pokemon/:name',
      name: 'detail',
      component: () => import('@/views/DetailView.vue'),
      props: true,
    },
    {
      // El Figma no define un 404, así que cualquier ruta desconocida vuelve al
      // listado en vez de dejar la pantalla en blanco.
      path: '/:pathMatch(.*)*',
      redirect: { name: 'list' },
    },
  ],
})

export default router
