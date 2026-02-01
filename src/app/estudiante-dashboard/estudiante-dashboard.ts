import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServicioAutorizacion } from '../autorizacion.service';
import { ServicioCursos } from '../servicios/servicio-cursos';
import { Curso } from '../interfaces/curso-interface';
import { ServicioArchivos } from '../servicios/servicio-archivos';
import { Archivo } from '../interfaces/archivo-interface';
import { Usuario } from '../interfaces/usuario-interface';
@Component({
  selector: 'app-estudiante-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estudiante-dashboard.html',
  styleUrls: ['./estudiante-dashboard.css']
})
export class EstudianteDashboard implements OnInit {
  usuarioActual: Usuario | null = null;
  cursos: Curso[] = [];
  cursoSeleccionado: Curso | null = null;
  cargando: boolean = false;

  constructor(
    private servicioAutorizacion: ServicioAutorizacion,
    private servicioCursos: ServicioCursos,
    private servicioArchivos: ServicioArchivos,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.servicioAutorizacion.obtenerUsuarioActual();
    this.cargarCursos();
  }

  iniciarEvaluacion(): void {
    this.router.navigate(['/evaluacion'], { 
      state: { abrirModalInicio: true } 
    });
  }

  cargarCursos(): void {
    this.cursos = this.servicioCursos.obtenerCursos();
  }

  seleccionarCurso(curso: Curso): void {
    this.cursoSeleccionado = this.cursoSeleccionado?.id === curso.id ? null : curso;
  }

   async visualizarArchivo(archivo: Archivo): Promise<void> {
    if (!archivo.id) {
      alert('Archivo no válido.');
      return;
    }

    try {
      await this.servicioArchivos.descargarArchivo(archivo.id, archivo.nombre);
    } catch (error: any) {
      alert(`Error al visualizar archivo: ${error.message}`);
    }
  }



  async descargarArchivo(archivo: Archivo): Promise<void> {
    if (!archivo.id) {
      alert('Archivo no válido.');
      return;
    }

    try {
      await this.servicioArchivos.descargarArchivo(archivo.id, archivo.nombre);
    } catch (error: any) {
      alert(`Error al descargar archivo: ${error.message}`);
    }
  }
  obtenerTamanoLegible(tamanoBytes?: number): string {
    if (!tamanoBytes) return 'N/A';
    return this.servicioArchivos.obtenerTamanoArchivoLegible(tamanoBytes);
  }

  obtenerTipoLegible(archivo: Archivo): string {
    return this.servicioArchivos.obtenerTipoArchivoLegible(archivo.tipo, archivo.nombre);
  }

  formatearFecha(fecha: Date): string {
    return this.servicioArchivos.formatearFecha(fecha);
  }

  calcularProgresoCurso(curso: Curso): number {
    const totalArchivos = curso.archivos.length;
    if (totalArchivos === 0) return 0;
    
    const archivosVistos = curso.archivos.filter(a => a.estado === 'Disponible').length;
    return Math.round((archivosVistos / totalArchivos) * 100);
  }

  obtenerEstadisticas() {
    const totalCursos = this.cursos.length;
    const cursosCompletados = this.cursos.filter(curso => curso.progreso === 100).length;
    const totalArchivos = this.cursos.reduce((total, curso) => total + curso.archivos.length, 0);
    const archivosVistos = this.cursos.reduce((total, curso) => 
      total + curso.archivos.filter(a => a.estado === 'Disponible').length, 0
    );

    return {
      totalCursos,
      cursosCompletados,
      totalArchivos,
      archivosVistos
    };
  }
toggleEstadoArchivo(archivo: Archivo, curso: Curso): void {
  archivo.estado = archivo.estado === 'Disponible' ? 'NoDisponible' : 'Disponible';
  
  // Actualizar el progreso del curso
  curso.progreso = this.calcularProgresoCurso(curso);
  
  // Opcional: Guardar los cambios en el servicio
  this.servicioCursos.actualizarCurso(curso);
}
  cerrarSesion(): void {
    this.servicioAutorizacion.cerrarSesion();
    this.router.navigate(['/login']);
  }
}