import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ServicioAutorizacion } from '../autorizacion.service';
import { ServicioArchivos, Archivo } from '../servicios/servicio-archivos';
import { CrudArchivos } from '../crud-archivos/crud-archivos';
import { ListaUsuarios } from '../lista-usuarios/lista-usuarios';
import { CrearCurso } from '../crear-curso/crear-curso';
import { Usuario } from '../servicios/servicio-usuarios';
import { ServicioUsuarios } from '../servicios/servicio-usuarios';
import { ServicioCursos } from '../servicios/servicio-cursos';
import { Curso } from '../servicios/servicio-cursos';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudArchivos, ListaUsuarios, CrearCurso],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard implements OnInit {
  usuarioActual: Usuario | null = null;
  archivos: Archivo[] = [];
  vistaActual: string = 'inicio';
  totalUsuarios: number = 0;
  totalCursos: number = 0;
  cursoEditando: Curso | null = null;
  mostrarModalCurso: boolean = false;

  // Referencia al componente CrearCurso para poder llamar sus métodos
  @ViewChild(CrearCurso) crearCursoComponent!: CrearCurso;

  constructor(
    private autorizacionService: ServicioAutorizacion,
    private usuariologueado: ServicioAutorizacion,
    private servicioArchivos: ServicioArchivos,
    private servicioUsuarios: ServicioUsuarios,
    private servicioCursos: ServicioCursos, 
    private router: Router
  ) {}

  // Método para manejar cuando se edita un curso
  onCursoEditado(curso: Curso): void {
    // Usar el servicio para preparar el curso para edición
    this.cursoEditando = this.servicioCursos.prepararEdicionCurso(curso);
    this.mostrarModalCurso = true;
  }

  // Método para manejar cuando se guarda un curso (nuevo o editado)
  onCursoGuardado(curso: Curso): void {
    this.cursoEditando = null;
    this.mostrarModalCurso = false;
    // Recargar estadísticas
    this.totalCursos = this.servicioCursos.obtenerCursos().length;
    
    // Forzar la recarga de la tabla
    this.recargarTablaCursos();
  }

  // Método para guardar la edición del curso
  guardarEdicionCurso(): void {
    if (!this.cursoEditando) return;

    // Validar el curso
    const validacion = this.servicioCursos.validarCurso(this.cursoEditando);
    if (!validacion.valido) {
      alert(validacion.mensaje);
      return;
    }

    // Actualizar el curso
    const cursoActualizado: Curso = {
      ...this.cursoEditando,
      fechaActualizacion: new Date()
    };

    this.servicioCursos.actualizarCurso(cursoActualizado);
    this.cerrarModal();
    alert('Curso actualizado exitosamente.');
    
    // Recargar estadísticas
    this.totalCursos = this.servicioCursos.obtenerCursos().length;
    
    // Forzar la recarga de la tabla
    this.recargarTablaCursos();
  }

  // Método para recargar la tabla de cursos
  recargarTablaCursos(): void {
    // Si estamos en la vista de cursos, recargar la tabla
    if (this.vistaActual === 'cursos' && this.crearCursoComponent) {
      this.crearCursoComponent.cargarCursos();
    }
  }

  // Método para cerrar el modal
  cerrarModal(): void {
    this.mostrarModalCurso = false;
    this.cursoEditando = null;
  }

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

    this.totalUsuarios = this.servicioUsuarios.obtenerTotalUsuarios();
    this.totalCursos = this.servicioCursos.obtenerCursos().length;
  }

  cargarArchivos(): void {
    this.archivos = this.servicioArchivos.obtenerArchivos();
  }
}