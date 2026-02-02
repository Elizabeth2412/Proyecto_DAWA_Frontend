import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; 
import { ServicioAutorizacion } from '../autorizacion.service';
import { ServicioArchivos } from '../servicios/servicio-archivos';
import { Archivo } from '../interfaces/archivo-interface';
import { CrudArchivos } from '../crud-archivos/crud-archivos';
import { ListaUsuarios } from '../lista-usuarios/lista-usuarios';
import { CrearCurso } from '../crear-curso/crear-curso';
import { Usuario } from '../interfaces/usuario-interface';
import { ServicioUsuarios } from '../servicios/servicio-usuarios';
import { ServicioCursos } from '../servicios/servicio-cursos';
import { Curso } from '../interfaces/curso-interface';
import { MatIcon } from "@angular/material/icon";
import { ServiceEvaluacion } from '../servicios/service-evaluacion';
import { Evaluation } from '../evaluation/evaluation';
import { Evaluacion } from '../interfaces/evaluacion-interface';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudArchivos, ListaUsuarios, CrearCurso, MatIcon, Evaluation],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard implements OnInit {
  usuarioActual: Usuario | null = null;
  archivos: Archivo[] = [];
  evaluaciones: Evaluacion[] = [];
  vistaActual: string = 'inicio';
  totalUsuarios: number = 0;
  totalCursos: number = 0;
  totalEvaluaciones: number = 0;
  cursoEditando: Curso | null = null;
  mostrarModalCurso: boolean = false;

  // Referencia al componente CrearCurso para poder llamar sus métodos
  @ViewChild(CrearCurso) crearCursoComponent!: CrearCurso;

  constructor(
    private usuariologueado: ServicioAutorizacion,
    private servicioArchivos: ServicioArchivos,
    private servicioUsuarios: ServicioUsuarios,
    private servicioCursos: ServicioCursos, 
    private servicioEvaluaciones: ServiceEvaluacion,
    private router: Router,
        private cdr: ChangeDetectorRef
    
  ) {}

ngOnInit(): void {
  this.usuarioActual = this.usuariologueado.obtenerUsuarioActual();

  // Verificar permisos
  if (!this.usuarioActual || this.usuarioActual.tipo !== 'administrador') {
    this.router.navigate(['/login']);
    return;
  }

  this.cargarArchivos();

  // TOTAL USUARIOS (Observable)
  this.servicioUsuarios.obtenerTotalUsuarios().subscribe({
    next: (total) => this.totalUsuarios = total,
    error: () => this.totalUsuarios = 0
  });

  this.servicioCursos.obtenerCursos().subscribe({
  next: (cursos: Curso[]) => {
    this.totalCursos = cursos.length;
  },
  error: () => {
    this.totalCursos = 0;
  }
});

  // TOTAL EVALUACIONES
  this.cargarTotalEvaluaciones();
}


  cargarTotalEvaluaciones(): void {
    this.servicioEvaluaciones.obtenerEvaluaciones().subscribe({
      next: (evaluaciones) => {
        this.evaluaciones = evaluaciones;
        this.totalEvaluaciones = this.evaluaciones.length;
      },
      error: (error) => {
        console.error('Error cargando evaluaciones:', error);
        this.evaluaciones = [];
        this.totalEvaluaciones = 0;
      }
    });
  }


  onCursoEditado(curso: Curso): void {
    console.log('Curso recibido para editar:', curso);
    // Usar el servicio para preparar el curso para edición
    this.cursoEditando = this.servicioCursos.prepararEdicionCurso(curso);
    this.mostrarModalCurso = true;
    
    // Forzar detección de cambios
    setTimeout(() => {
      this.cdr?.detectChanges();
    }, 0);
  }

  onCursoGuardado(curso: Curso): void {
    this.cursoEditando = null;
    this.mostrarModalCurso = false;
this.servicioCursos.obtenerCursos().subscribe({
  next: (cursos: Curso[]) => {
    this.totalCursos = cursos.length;
    this.recargarTablaCursos();
  },
  error: () => this.totalCursos = 0
});

    this.recargarTablaCursos();
  }

  guardarEdicionCurso(): void {
    if (!this.cursoEditando) return;

    const validacion = this.servicioCursos.validarCurso(this.cursoEditando);
    if (!validacion.valido) {
      alert(validacion.mensaje);
      return;
    }

    const cursoActualizado: Curso = {
      ...this.cursoEditando,
      fechaActualizacion: new Date()
    };

    this.servicioCursos.actualizarCurso(cursoActualizado);
    this.cerrarModal();
    alert('Curso actualizado exitosamente.');
    
this.servicioCursos.obtenerCursos().subscribe({
  next: (cursos: Curso[]) => {
    this.totalCursos = cursos.length;
    this.recargarTablaCursos();
  },
  error: () => this.totalCursos = 0
});
    
    this.recargarTablaCursos();
  }

  recargarTablaCursos(): void {
    if (this.vistaActual === 'cursos' && this.crearCursoComponent) {
      this.crearCursoComponent.cargarCursos();
    }
  }

  cerrarModal(): void {
    this.mostrarModalCurso = false;
    this.cursoEditando = null;
  }

  // MODIFICAR ESTE MÉTODO COMPLETAMENTE
  cambiarVista(vista: string): void {
    if (vista === 'cursos') {
      // Navegar a la ruta de tabla de cursos
      this.router.navigate(['/cursos']);
      return; // IMPORTANTE: salir del método aquí
    } else if (vista === 'evaluacion') {
      Evaluation.modoGlobal = 'tabla';
      this.vistaActual = vista;
    } else {
      this.vistaActual = vista;
    }
  }

  async cargarArchivos(): Promise<void> {
    try {
      this.archivos = await this.servicioArchivos.obtenerTodosLosArchivos();
    } catch (error) {
      console.error('Error cargando archivos:', error);
      this.archivos = [];
    }
  }


  volverInicio() {
    this.vistaActual = 'inicio';
  }
}