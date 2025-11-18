import { Routes } from '@angular/router';
import { Login } from './login/login';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';
import { InstructorDashboard } from './instructor-dashboard/instructor-dashboard';
import { EstudianteDashboard } from './estudiante-dashboard/estudiante-dashboard';
import { Footer } from './footer/footer';
import { Header } from './header/header';
import { CrearCurso } from './crear-curso/crear-curso';
import { Evaluation } from './evaluation/evaluation';
import { ComunidadVirtual } from './comunidad-virtual/comunidad-virtual';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'admin', component: AdminDashboard },
  { path: 'instructor', component: InstructorDashboard },
  { path: 'estudiante', component: EstudianteDashboard },
  { path: 'header', component: Header },
  { path: 'footer', component: Footer },
  { path: 'crear-curso', component: CrearCurso },
  { path: 'evaluacion', component: Evaluation },
  { path: 'comunidad', component:ComunidadVirtual},
  { path: '**', redirectTo: '/login' }
];
