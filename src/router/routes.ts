import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/IndexPage.vue'),
      },
      {
        path: 'viewer',
        component: () => import('pages/PageViewer.vue'),
      },
      {
        path: 'editor',
        component: () => import('pages/EditorWorkbench.vue'),
      },
      {
        path: 'migration-preview/:series?/:lesson?',
        component: () => import('pages/MigrationPreviewPage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
