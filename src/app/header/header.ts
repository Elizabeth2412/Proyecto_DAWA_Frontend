import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServicioAutorizacion } from '../autorizacion.service';
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

  // MODIFICAR ESTE MÉTODO
  redireccionarInstructorCurso(): void {
    const usuario = this.servicioAutorizacion.obtenerUsuarioActual();
    
    if (!usuario) {
      alert('Debes iniciar sesión para acceder a esta sección.');
      this.router.navigate(['/login']);
      return;
    }

    // Permitir tanto instructores como administradores
    if (usuario.tipo === 'instructor' || usuario.tipo === 'administrador') {
      this.router.navigate(['/instructor']);
    } else {
      alert('No tienes permisos para acceder al panel de instructor.');
    }
  }

  redireccionarEstudianteCurso(): void {
    const usuario = this.servicioAutorizacion.obtenerUsuarioActual();
    
    if (!usuario) {
      alert('Debes iniciar sesión para acceder a esta sección.');
      this.router.navigate(['/login']);
      return;
    }

    if (usuario.tipo === 'estudiante') {
      this.router.navigate(['/estudiante']);
    } else {
      alert('Esta sección es solo para estudiantes.');
    }
  }

  // ELIMINAR o modificar este método
  verificarAcceso(event: Event, tipoUsuarioPermitido: string[] = []): void {
    if (!this.usuarioLogueado) {
      event.preventDefault();
      alert('Debes iniciar sesión para acceder a esta sección.');
      this.router.navigate(['/login']);
      return;
    }

    const usuario = this.servicioAutorizacion.obtenerUsuarioActual();
    if (usuario && tipoUsuarioPermitido.length > 0 && !tipoUsuarioPermitido.includes(usuario.tipo)) {
      event.preventDefault();
      alert('No tienes permisos para acceder a esta sección.');
    }
  }

  // AGREGAR método para redireccionar al admin dashboard
  redireccionarAdminDashboard(): void {
    const usuario = this.servicioAutorizacion.obtenerUsuarioActual();
    
    if (!usuario) {
      alert('Debes iniciar sesión para acceder a esta sección.');
      this.router.navigate(['/login']);
      return;
    }

    if (usuario.tipo === 'administrador') {
      this.router.navigate(['/admin-dashboard']);
    } else {
      alert('Esta sección es solo para administradores.');
    }
  }
}