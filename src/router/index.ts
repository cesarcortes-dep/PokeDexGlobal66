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
      // Ruta y no estado interno: tiene URL propia y el botón "atrás" funciona.
      // Reusa `ListView`: es la misma pantalla con la fuente de datos filtrada.
      path: '/favoritos',
      name: 'favorites',
      component: ListView,
      props: { onlyFavorites: true },
    },
    {
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
