import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServicioAutorizacion} from '../autorizacion.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Usuario } from '../servicios/servicio-usuarios';
import { MatIcon } from '@angular/material/icon';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterModule, MatIcon],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header implements OnInit {
  usuarioLogueado: boolean = false;
  usuarioActual: Usuario | null = null;

  constructor(
    private servicioAutorizacion: ServicioAutorizacion,
    private router: Router
  ) {}

  ngOnInit(): void {
    // usar obtenerUsuarioActual()
    //this.usuarioLogueado = this.servicioAutorizacion.obtenerUsuarioActual() !== null;

    // . Mantiene sincronización con cambios de sesión
    //this.servicioAutorizacion.cambioEstado$.subscribe(estado => {
    //  this.usuarioLogueado = estado;
    //});

    // Suscribirse a cambios de sesión
    //this.servicioAutorizacion.cambioEstado$.subscribe(
    //  (estado) => {
    //    this.usuarioLogueado = estado;
    //  }
    //);

    // Verificar estado inicial
    //this.usuarioLogueado = this.servicioAutorizacion.estaLogueado();

    this.servicioAutorizacion.obtenerObservableLogueado().subscribe(isLogged => {
      this.usuarioLogueado = isLogged;

      if (isLogged) {
        this.usuarioActual = this.servicioAutorizacion.obtenerUsuarioActual();
      } else {
        this.usuarioActual = null;
      }
    });

    // Cargar estado inicial por si ya estaba logueado
    this.usuarioActual = this.servicioAutorizacion.obtenerUsuarioActual();
    this.usuarioLogueado = this.usuarioActual != null;
  }

  manejarSesion(): void {
    if (this.usuarioLogueado) {
      const confirmacion = confirm('¿Estás seguro de que deseas cerrar sesión?');
      if (confirmacion) {
        this.servicioAutorizacion.cerrarSesion();
        this.router.navigate(['/login']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  redireccionarInstructorCurso(){
    this.router.navigate(['/instructor']);
  }

  redireccionarEstudianteCurso(){
    this.router.navigate(['/estudiante']);
  }

  verificarAcceso(event: Event): void {
    if (!this.usuarioLogueado) {
      event.preventDefault();
      alert('Debes iniciar sesión para acceder a esta sección.');
      this.router.navigate(['/login']);
    }
  }

}