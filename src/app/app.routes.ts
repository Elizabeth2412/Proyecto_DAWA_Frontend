import { Routes } from '@angular/router';
import { Header } from './header/header';
import { Footer } from './footer/footer';

export const routes: Routes = [
    { path: '', component: Header},
    { path: 'pie de pagina', component: Footer}
];
    