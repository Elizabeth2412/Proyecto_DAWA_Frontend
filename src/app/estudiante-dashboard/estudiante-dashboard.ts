import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServicioAutorizacion, Usuario } from '../autorizacion.service';
import { ServicioCursos, Curso, Diapositiva } from '../servicios/servicio-cursos';
import { ServicioArchivos } from '../servicios/servicio-archivos';
import { ServicioAlmacenamientoSession } from '../servicios/servicio-almacenamiento-session';

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
    private almacenamientoSession: ServicioAlmacenamientoSession,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.servicioAutorizacion.obtenerUsuarioActual();
    if (!this.usuarioActual || this.usuarioActual.tipo !== 'estudiante') {
      this.router.navigate(['/login']);
      return;
    }
    this.cargarCursos();
  }

  iniciarEvaluacion(): void {
    this.router.navigate(['/evaluacion']);
  }


  cargarCursos(): void {
    this.cursos = this.servicioCursos.obtenerCursos();
  }

  seleccionarCurso(curso: Curso): void {
    this.cursoSeleccionado = this.cursoSeleccionado?.id === curso.id ? null : curso;
  }

  async visualizarDiapositiva(diapositiva: Diapositiva): Promise<void> {
    if (!diapositiva.archivoId) {
      alert('No hay archivo asociado para visualizar.');
      return;
    }
    
    try {
      const blob = await this.almacenamientoSession.obtenerArchivoBlob(diapositiva.archivoId);
      if (!blob) {
        alert('Archivo no encontrado.');
        return;
      }
      this.servicioArchivos.visualizarArchivoDesdeBlob(blob, diapositiva.archivo);
    } catch (error) {
      console.error('Error al visualizar archivo:', error);
      alert('Error al cargar el archivo para visualización.');
    }
  }

  async descargarDiapositiva(diapositiva: Diapositiva): Promise<void> {
    if (!diapositiva.archivoId) {
      alert('No hay archivo para descargar.');
      return;
    }
    
    try {
      const blob = await this.almacenamientoSession.obtenerArchivoBlob(diapositiva.archivoId);
      if (!blob) {
        alert('Archivo no encontrado.');
        return;
      }
      this.servicioArchivos.descargarArchivoDesdeBlob(blob, diapositiva.archivo);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      alert('Error al cargar el archivo para descarga.');
    }
  }

  obtenerTamanoLegible(tamanoBytes?: number): string {
    if (!tamanoBytes) return 'N/A';
    return this.servicioArchivos.obtenerTamañoArchivoLegible(tamanoBytes);
  }

  obtenerTipoLegible(diapositiva: Diapositiva): string {
    return this.servicioArchivos.obtenerTipoArchivoLegible(diapositiva.tipo, diapositiva.archivo);
  }

  formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  calcularProgresoCurso(curso: Curso): number {
    const totalDiapositivas = curso.diapositivas.length;
    if (totalDiapositivas === 0) return 0;
    
    const diapositivasCompletadas = curso.diapositivas.filter(d => d.completada).length;
    return Math.round((diapositivasCompletadas / totalDiapositivas) * 100);
  }

  marcarComoCompletada(diapositiva: Diapositiva, curso: Curso): void {
    diapositiva.completada = !diapositiva.completada;
    this.servicioCursos.actualizarDiapositivaEnCurso(curso.id, diapositiva);
    
    // Recalcular progreso del curso
    const progreso = this.calcularProgresoCurso(curso);
    curso.progreso = progreso;
    this.servicioCursos.actualizarCurso(curso);
  }

  obtenerEstadisticas() {
    const totalCursos = this.cursos.length;
    const cursosCompletados = this.cursos.filter(curso => curso.progreso === 100).length;
    const totalDiapositivas = this.cursos.reduce((total, curso) => total + curso.diapositivas.length, 0);
    const diapositivasCompletadas = this.cursos.reduce((total, curso) => 
      total + curso.diapositivas.filter(d => d.completada).length, 0
    );

    return {
      totalCursos,
      cursosCompletados,
      totalDiapositivas,
      diapositivasCompletadas
    };
  }

  cerrarSesion(): void {
    this.servicioAutorizacion.cerrarSesion();
    this.router.navigate(['/login']);
  }
}