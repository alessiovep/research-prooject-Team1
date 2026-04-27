import { createRouter, createWebHistory } from 'vue-router'
import StudentView from '@/views/StudentView.vue'
import ScannerView from '@/views/ScannerView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/student' },
    { path: '/student', name: 'student', component: StudentView },
    { path: '/scanner', name: 'scanner', component: ScannerView }
  ]
})

export default router
