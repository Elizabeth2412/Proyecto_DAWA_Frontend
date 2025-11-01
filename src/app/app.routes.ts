import { Routes } from '@angular/router';
import { Header } from './header/header';
import { Footer } from './footer/footer';
import { Login } from './login/login';

export const routes: Routes = [
    { path: '', component: Header},
    { path: 'pie de pagina', component: Footer},
    { path: 'login', component: Login}
];
    