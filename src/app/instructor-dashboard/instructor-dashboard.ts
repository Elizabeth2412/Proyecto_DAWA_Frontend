import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router';
import { ServicioAutorizacion, Usuario } from '../autorizacion.service';
import { ServicioCursos, Curso, Diapositiva } from '../servicios/servicio-cursos';
import { ServicioArchivos } from '../servicios/servicio-archivos';
import { ServicioAlmacenamientoSession } from '../servicios/servicio-almacenamiento-session'; // .

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './instructor-dashboard.html',
  styleUrls: ['./instructor-dashboard.css']
})
export class InstructorDashboard implements OnInit {
  usuarioActual: Usuario | null = null;
  archivoSeleccionado: File | null = null;
  cursos: Curso[] = [];
  cargando: boolean = false;
  cursoEditando: Curso | null = null;
  diapositivaEditando: Diapositiva | null = null;
  modoEdicion: boolean = false;
  cursoSeleccionado: Curso | null = null;
  mostrarModalCurso: boolean = false;
  nuevoCurso: any = {
    titulo: '',
    descripcion: ''
  };
  modalCurso: any = null;
  
  private _handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (this.mostrarModalCurso) this.cerrarModalCrearCurso();
    }
  };

  constructor(
    private servicioAutorizacion: ServicioAutorizacion,
    private servicioCursos: ServicioCursos,
    private servicioArchivos: ServicioArchivos,
    private almacenamientoSession: ServicioAlmacenamientoSession, // .
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.servicioAutorizacion.obtenerUsuarioActual();
    //if (!this.usuarioActual || this.usuarioActual.tipo !== 'instructor') {
    //  this.router.navigate(['/login']);
    //  return;
    //}
    this.cargarCursos();
  }

  cargarCursos(): void {
    this.cursos = this.servicioCursos.obtenerCursosPorInstructor(this.usuarioActual!.email);
  }

  onArchivoSeleccionado(evento: any): void {
    const archivo = evento.target.files[0];
    if (archivo && this.servicioArchivos.esArchivoValido(archivo)) {
      // Verificar espacio disponible antes de aceptar el archivo
      if (!this.almacenamientoSession.verificarEspacioDisponible(archivo.size)) {
        alert('El archivo es demasiado grande para el almacenamiento temporal. Por favor, use un archivo más pequeño.');
        this.limpiarInputArchivo();
        return;
      }
      
      this.archivoSeleccionado = archivo;
    } else {
      alert('Por favor, selecciona un archivo PDF o PPTX válido.');
      this.limpiarInputArchivo();
    }
  }

  async subirArchivo(): Promise<void> {
    if (!this.archivoSeleccionado || !this.usuarioActual) return;

    if (!this.cursoSeleccionado && !this.modoEdicion) {
      alert('Por favor, selecciona un curso antes de subir diapositivas.');
      return;
    }

    this.cargando = true;
    try {
      const idArchivo = `archivo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      
      // .: Usar sessionStorage en lugar de IndexedDB
      await this.almacenamientoSession.guardarArchivoBlob(idArchivo, this.archivoSeleccionado);

      const nuevaDiapositiva: Diapositiva = {
        id: Date.now(),
        titulo: this.eliminarExtension(this.archivoSeleccionado.name),
        archivo: this.archivoSeleccionado.name,
        tipo: this.archivoSeleccionado.type.includes('pdf') ? 'pdf' : 'pptx',
        completada: false,
        archivoId: idArchivo,
        fechaSubida: new Date(),
        tamano: this.archivoSeleccionado.size
      };

      if (this.modoEdicion && this.cursoEditando && this.diapositivaEditando) {
        await this.actualizarDiapositivaExistente(nuevaDiapositiva);
      } else {
        await this.agregarDiapositivaACursoExistente(nuevaDiapositiva);
      }

      this.cargarCursos();
      this.limpiarEstado();
      
    } catch (error) {
      console.error('Error al subir archivo:', error);
      alert('Error al subir el archivo. Por favor, intente nuevamente.');
    } finally {
      this.cargando = false;
    }
  }

  private async actualizarDiapositivaExistente(nuevaDiapositiva: Diapositiva): Promise<void> {
    if (!this.cursoEditando || !this.diapositivaEditando) return;

    if (this.diapositivaEditando.archivoId) {
      try {
        await this.almacenamientoSession.borrarArchivo(this.diapositivaEditando.archivoId);
      } catch (error) {
        console.warn('No se pudo eliminar el archivo anterior:', error);
      }
    }

    const diapositivaActualizada: Diapositiva = {
      ...this.diapositivaEditando,
      titulo: nuevaDiapositiva.titulo,
      archivo: nuevaDiapositiva.archivo,
      tipo: nuevaDiapositiva.tipo,
      archivoId: nuevaDiapositiva.archivoId,
      fechaSubida: new Date(),
      tamano: nuevaDiapositiva.tamano
    };

    this.servicioCursos.actualizarDiapositivaEnCurso(
      this.cursoEditando.id, 
      diapositivaActualizada
    );

    alert(`Archivo "${nuevaDiapositiva.archivo}" actualizado exitosamente.`);
  }

  private async agregarDiapositivaACursoExistente(nuevaDiapositiva: Diapositiva): Promise<void> {
    if (!this.cursoSeleccionado) return;

    this.servicioCursos.agregarDiapositivaACurso(this.cursoSeleccionado.id, nuevaDiapositiva);
    alert(`Diapositiva "${nuevaDiapositiva.archivo}" agregada exitosamente al curso "${this.cursoSeleccionado.titulo}".`);
  }

  private eliminarExtension(nombreArchivo: string): string {
    return nombreArchivo.replace(/\.[^/.]+$/, "");
  }

  private limpiarInputArchivo(): void {
    const inputArchivo = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (inputArchivo) inputArchivo.value = '';
  }

  limpiarEstado(): void {
    this.archivoSeleccionado = null;
    this.cursoEditando = null;
    this.diapositivaEditando = null;
    this.modoEdicion = false;
    this.limpiarInputArchivo();
  }

  // Resto de los métodos permanecen igual...
  abrirModalCrearCurso(): void {
    this.nuevoCurso = { titulo: '', descripcion: '', nivel: 'Principiante', duracion: 1 };
    this.modalCurso = this.nuevoCurso;
    setTimeout(() => {
      this.mostrarModalCurso = true;
      console.log('abrirModalCrearCurso: modalCurso=', this.modalCurso, 'mostrarModalCurso=', this.mostrarModalCurso);
      try { this.cdr.detectChanges(); } catch (e) { /* safe */ }
      try { document.body.classList.add('modal-open'); } catch (e) { /* safe in SSR */ }
      try { document.addEventListener('keydown', this._handleEsc); } catch (e) { /* safe */ }
    }, 0);
  }

  cerrarModalCrearCurso(): void {
    this.mostrarModalCurso = false;
    this.nuevoCurso = { titulo: '', descripcion: '' };
    this.cursoEditando = null;
    this.modalCurso = null;
    try { document.body.classList.remove('modal-open'); } catch (e) { /* safe in SSR */ }
    try { document.removeEventListener('keydown', this._handleEsc); } catch (e) { /* safe */ }
  }

  crearCurso(): void {
    if (!this.nuevoCurso.titulo.trim()) {
      alert('Por favor, ingresa un título para el curso.');
      return;
    }

    if (!this.nuevoCurso.descripcion.trim()) {
      alert('Por favor, ingresa una descripción para el curso.');
      return;
    }

    const nuevoCurso: Curso = {
      id: 0,
      titulo: this.nuevoCurso.titulo,
      descripcion: this.nuevoCurso.descripcion,
      nivel: this.nuevoCurso.nivel || 'Principiante',   
      duracion: this.nuevoCurso.duracion || 1,          
      diapositivas: [],
      progreso: 0,
      instructor: this.usuarioActual!.email,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    this.servicioCursos.agregarCurso(nuevoCurso);
    this.cargarCursos();
    this.cerrarModalCrearCurso();
    alert(`Curso "${nuevoCurso.titulo}" creado exitosamente.`);
  }

  seleccionarCurso(curso: Curso): void {
    this.cursoSeleccionado = curso;
    this.modoEdicion = false;
  }

  onCursoSeleccionado(cursoId: string): void {
    console.log('Curso ID seleccionado:', cursoId);
    
    if (cursoId && cursoId !== 'null') {
      const curso = this.cursos.find(c => c.id.toString() === cursoId);
      this.cursoSeleccionado = curso || null;
      console.log('Curso seleccionado:', this.cursoSeleccionado);
    } else {
      this.cursoSeleccionado = null;
    }
  }

  gestionarCursos(): void {
    alert('Selecciona un curso de la lista para agregar diapositivas.');
  }

  irCrearCurso(): void {
    this.router.navigate(['/crear-curso']);
  }

  verCurso(curso: Curso): void {
    alert(`Viendo curso: ${curso.titulo}`);
  }

  editarCurso(curso: Curso): void {
    this.cursoEditando = { ...curso };
    if (!this.cursoEditando.nivel) this.cursoEditando.nivel = 'Principiante';
    if (!this.cursoEditando.duracion) this.cursoEditando.duracion = 1;
    this.modalCurso = this.cursoEditando;
    setTimeout(() => {
      this.mostrarModalCurso = true;
      console.log('editarCurso: modalCurso=', this.modalCurso, 'mostrarModalCurso=', this.mostrarModalCurso);
      try { this.cdr.detectChanges(); } catch (e) { /* safe */ }
      try { document.body.classList.add('modal-open'); } catch (e) { /* safe in SSR */ }
      try { document.addEventListener('keydown', this._handleEsc); } catch (e) { /* safe */ }
    }, 0);
  }

  guardarEdicionCurso(): void {
    if (!this.cursoEditando) return;

    if (!this.cursoEditando.titulo || !this.cursoEditando.titulo.trim()) {
      alert('Por favor, ingresa un título para el curso.');
      return;
    }
    if (!this.cursoEditando.descripcion || !this.cursoEditando.descripcion.trim()) {
      alert('Por favor, ingresa una descripción para el curso.');
      return;
    }

    const original = this.servicioCursos.obtenerCursoPorId(this.cursoEditando.id);
    const actualizado: Curso = {
      ...(original || this.cursoEditando),
      ...this.cursoEditando,
      fechaActualizacion: new Date()
    };

    this.servicioCursos.actualizarCurso(actualizado);
    this.cargarCursos();
    this.mostrarModalCurso = false;
    this.cursoEditando = null;
    try { document.body.classList.remove('modal-open'); } catch (e) { /* safe in SSR */ }
    alert('Curso actualizado exitosamente.');
  }

  eliminarCurso(curso: Curso): void {
    const confirmar = window.confirm(
      `¿Está seguro de que desea eliminar el curso "${curso.titulo}"?\n\n` +
      `Esta acción eliminará ${curso.diapositivas.length} diapositiva(s) y no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      // Eliminar todos los archivos asociados del curso
      curso.diapositivas.forEach(async diapositiva => {
        if (diapositiva.archivoId) {
          try {
            await this.almacenamientoSession.borrarArchivo(diapositiva.archivoId);
          } catch (error) {
            console.warn(`No se pudo eliminar el archivo: ${diapositiva.archivoId}`, error);
          }
        }
      });

      this.servicioCursos.eliminarCurso(curso.id);
      
      if (this.cursoSeleccionado && this.cursoSeleccionado.id === curso.id) {
        this.cursoSeleccionado = null;
      }
      
      this.cargarCursos();
      alert('Curso eliminado exitosamente.');
    } catch (error) {
      console.error('Error al eliminar curso:', error);
      alert('Error al eliminar el curso. Por favor, intente nuevamente.');
    }
  }

  // Funciones para diapositivas
  async editarDiapositiva(curso: Curso, diapositiva: Diapositiva): Promise<void> {
    this.modoEdicion = true;
    this.cursoEditando = curso;
    this.diapositivaEditando = diapositiva;
    
    const inputArchivo = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (inputArchivo) {
      inputArchivo.click();
    }
  }

  async eliminarDiapositiva(curso: Curso, diapositiva: Diapositiva): Promise<void> {
    const confirmar = window.confirm(
      `¿Está seguro de que desea eliminar la diapositiva "${diapositiva.titulo}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      if (diapositiva.archivoId) {
        await this.almacenamientoSession.borrarArchivo(diapositiva.archivoId);
      }

      this.servicioCursos.eliminarDiapositivaDeCurso(curso.id, diapositiva.id);

      this.cargarCursos();
      alert('Diapositiva eliminada exitosamente.');
    } catch (error) {
      console.error('Error al eliminar diapositiva:', error);
      alert('Error al eliminar la diapositiva. Por favor, intente nuevamente.');
    }
  }

  async visualizarArchivo(diapositiva: Diapositiva): Promise<void> {
    if (!diapositiva.archivoId) {
      alert('No hay archivo asociado para previsualizar.');
      return;
    }
    
    try {
      // .: Obtener archivo de sessionStorage
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

  async descargarArchivo(diapositiva: Diapositiva): Promise<void> {
    if (!diapositiva.archivoId) {
      alert('No hay archivo para descargar.');
      return;
    }
    
    try {
      // .: Obtener archivo de sessionStorage
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
    if (diapositiva.tipo === 'pdf' || diapositiva.archivo.toLowerCase().endsWith('.pdf')) {
      return 'PDF Document';
    } else if (diapositiva.tipo === 'pptx' || diapositiva.archivo.toLowerCase().endsWith('.pptx')) {
      return 'PowerPoint Presentation';
    } else {
      return 'Archivo';
    }
  }

  formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  cerrarSesion(): void {
    // Limpiar archivos de sessionStorage al cerrar sesión
    this.servicioAutorizacion.cerrarSesion();
    this.router.navigate(['/login']);
  }
}