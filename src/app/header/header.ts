/*src/app/header/header.ts*/
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { PublicVarService } from '../publicVarService';
import { ServicioAutorizacion } from '../autorizacion.service';
import { Login } from '../login/login';
import { Register } from '../register/register';
import { Usuario } from '../interfaces/usuario-interface';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ]
})
export class Header implements OnInit {
  usuarioLogueado = false;
  usuarioActual: Usuario | null = null;

  constructor(
    private router: Router,
    private publicVarService: PublicVarService,
    private servicioAutorizacion: ServicioAutorizacion
  ) {}

  ngOnInit() {
    // Suscribirse al estado de login de PublicVarService
    this.publicVarService.logeado$.subscribe(estado => {
      this.usuarioLogueado = estado;
    });

    // Suscribirse al usuario actual del ServicioAutorizacion
    this.servicioAutorizacion.obtenerObservableUsuarioActual().subscribe(usuario => {
      this.usuarioActual = usuario;
      this.usuarioLogueado = usuario !== null;
      
      // Sincronizar con PublicVarService
      this.publicVarService.actualizarEstadoLogin(usuario !== null);
    });

    // Estado inicial
    this.usuarioActual = this.servicioAutorizacion.obtenerUsuarioActual();
    this.usuarioLogueado = this.usuarioActual !== null;
    this.publicVarService.actualizarEstadoLogin(this.usuarioLogueado);
  }

  // Método unificado para manejar sesión
  manejarSesion(): void {
    if (this.usuarioLogueado) {
      const confirmacion = confirm('¿Estás seguro de que deseas cerrar sesión?');
      if (confirmacion) {
        this.cerrarSesion();
      }
    } else {
      this.openDialogLogin();
    }
  }

  cerrarSesion() {
    this.servicioAutorizacion.cerrarSesion();
    this.publicVarService.actualizarEstadoLogin(false);
    this.router.navigate(['/pagina-principal']);
  }

  // Métodos de diálogo
  readonly dialog = inject(MatDialog);


  openDialogLogin() {
    const dialogRef = this.dialog.open(Login, { 
      width: '400px',
      disableClose: true 
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.usuarioActual = this.servicioAutorizacion.obtenerUsuarioActual();
        this.usuarioLogueado = this.usuarioActual !== null;
      }
    });
  }

  openDialogRegistrarUsuario() {
    this.dialog.open(Register, { 
      width: '500px',
      disableClose: true 
    });
  }

  // Métodos de navegación con verificación de permisos
  redireccionarInstructor(): void {
    const usuario = this.servicioAutorizacion.obtenerUsuarioActual();
    
    if (!usuario) {
      alert('Debes iniciar sesión para acceder a esta sección.');
      this.openDialogLogin();
      return;
    }

    if (usuario.tipo === 'instructor' || usuario.tipo === 'administrador') {
      this.router.navigate(['/instructor']);
    } else {
      alert('No tienes permisos para acceder al panel de instructor.');
    }
  }

  redireccionarEstudiante(): void {
    const usuario = this.servicioAutorizacion.obtenerUsuarioActual();
    
    if (!usuario) {
      alert('Debes iniciar sesión para acceder a esta sección.');
      this.openDialogLogin();
      return;
    }

    if (usuario.tipo === 'estudiante') {
      this.router.navigate(['/estudiante']);
    } else {
      alert('Esta sección es solo para estudiantes.');
    }
  }

  redireccionarAdminDashboard(): void {
    const usuario = this.servicioAutorizacion.obtenerUsuarioActual();
    
    if (!usuario) {
      alert('Debes iniciar sesión para acceder a esta sección.');
      this.openDialogLogin();
      return;
    }

    if (usuario.tipo === 'administrador') {
      this.router.navigate(['/admin-dashboard']);
    } else {
      alert('Esta sección es solo para administradores.');
    }
  }

  // Método para verificar acceso en enlaces
  verificarAcceso(event: Event, tipoUsuarioPermitido: string[] = []): void {
    if (!this.usuarioLogueado) {
      event.preventDefault();
      alert('Debes iniciar sesión para acceder a esta sección.');
      this.openDialogLogin();
      return;
    }

    const usuario = this.servicioAutorizacion.obtenerUsuarioActual();
    if (usuario && tipoUsuarioPermitido.length > 0 && !tipoUsuarioPermitido.includes(usuario.tipo)) {
      event.preventDefault();
      alert('No tienes permisos para acceder a esta sección.');
    }
  }

  // Método para obtener el nombre completo del usuario
  obtenerNombreCompleto(): string {
    if (!this.usuarioActual) return '';
    return `${this.usuarioActual.nombre} ${this.usuarioActual.apellido || ''}`.trim();
  }
}