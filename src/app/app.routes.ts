//src/app/app.routes.ts
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
import { Register } from './register/register';
import { ListaUsuarios } from './lista-usuarios/lista-usuarios';
import { PaginalPrincipal } from './paginal-principal/paginal-principal';
import { ListaCursosComponent } from './lista-cursos/lista-cursos.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'lista-usuarios', component: ListaUsuarios },
  { path: 'admin-dashboard', component: AdminDashboard },
  { path: 'estudiante', component: EstudianteDashboard },
  { path: 'header', component: Header },
  { path: 'footer', component: Footer },
  { 
    path: 'instructor', 
    component: InstructorDashboard 
  },
  { path: 'evaluacion', component: Evaluation },
  { path: 'comunidad', component: ComunidadVirtual },
  { path: 'pagina-principal', component: PaginalPrincipal },
   { 
    path: 'crear-curso', 
    component: CrearCurso,
    data: { modo: 'formulario' }
  },
  { 
    path: 'cursos', 
    component: CrearCurso,
    data: { modo: 'tabla' }
  },
  { 
    path: 'cursos/nuevo', 
    component: CrearCurso,
    data: { modo: 'formulario' }
  },
  { 
    path: 'cursos/editar/:id', 
    component: CrearCurso,
    data: { modo: 'formulario' }
  },
  { path: '**', redirectTo: '/login' },
];
