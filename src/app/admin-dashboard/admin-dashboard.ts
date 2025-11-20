import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServicioAutorizacion, Usuario } from '../autorizacion.service';
import { ServicioArchivos, Archivo } from '../servicios/servicio-archivos';
import { CrudArchivos } from '../crud-archivos/crud-archivos';
import { ListaUsuarios } from '../lista-usuarios/lista-usuarios';
import { CrearCurso } from '../crear-curso/crear-curso';
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, CrudArchivos, ListaUsuarios, CrearCurso],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard implements OnInit {
  usuarioActual: Usuario | null = null;
  archivos: Archivo[] = [];
  vistaActual: string = 'inicio'; // 'inicio', 'archivos', 'usuarios', etc

  constructor(
    private autorizacionService: ServicioAutorizacion,
    private usuariologueado: ServicioAutorizacion,
    private servicioArchivos: ServicioArchivos,
    private router: Router
  ) {}

  cambiarVista(vista: string): void {
    if (vista === 'cursos') {
      CrearCurso.modoGlobal = 'tabla';
    } else {
      CrearCurso.modoGlobal = 'formulario';
    }
    
    this.vistaActual = vista;
  }


  ngOnInit(): void {
    this.usuarioActual = this.usuariologueado.obtenerUsuarioActual();
    this.cargarArchivos();
  }

  cargarArchivos(): void {
    this.archivos = this.servicioArchivos.obtenerArchivos();
  }

  //cambiarVista(vista: string): void {
  //  this.vistaActual = vista;
  //}

  cerrarSesion(): void {
    this.autorizacionService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}