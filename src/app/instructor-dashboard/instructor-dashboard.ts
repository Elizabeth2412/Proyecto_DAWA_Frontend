import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router';
import { ServicioAutorizacion } from '../autorizacion.service';
import { ServicioCursos, Curso } from '../servicios/servicio-cursos';
import { ServicioArchivos, Archivo } from '../servicios/servicio-archivos';
import { ServicioAlmacenamientoSession } from '../servicios/servicio-almacenamiento-session'; // .
import { Usuario } from '../servicios/servicio-usuarios';
import { CrearCurso } from '../crear-curso/crear-curso';
@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CrearCurso], 
  templateUrl: './instructor-dashboard.html',
  styleUrls: ['./instructor-dashboard.css']
})
export class InstructorDashboard implements OnInit {
  usuarioActual: Usuario | null = null;
  archivoSeleccionado: File | null = null;
  vistaActual: string = 'inicio';

  cursos: Curso[] = [];
  cargando: boolean = false;
  cursoEditando: Curso | null = null;
  archivoEditando: Archivo | null = null;
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
    // CORRECCIÓN: Manejar cuando el usuario es null
    if (this.usuarioActual && this.usuarioActual.email) {
      this.cursos = this.servicioCursos.obtenerCursosPorInstructor(this.usuarioActual.email);
    } else {
      // Si no hay usuario autenticado, mostrar todos los cursos o cursos de invitado
      this.cursos = this.servicioCursos.obtenerCursos().filter(curso => 
        curso.instructor === 'invitado@gmail.com' || !curso.instructor
      );
    }
  }
  async onArchivoSeleccionado(evento: any): Promise<void> {
    const resultado = await this.servicioArchivos.procesarArchivoSeleccionado(evento);
    
    if (resultado.error) {
      alert(resultado.error);
      return;
    }
    
    this.archivoSeleccionado = resultado.archivo;
  }
 async subirArchivo(): Promise<void> {
  if (!this.archivoSeleccionado || !this.usuarioActual) return;

  this.cargando = true;
  
  const resultado = await this.servicioArchivos.subirArchivo(
    this.archivoSeleccionado,
    this.cursoSeleccionado,
    this.modoEdicion,
    this.cursoEditando,
    this.archivoEditando,
    this.usuarioActual.email
  );

  if (resultado.exito) {
    if (resultado.necesitaActualizar && this.cursoEditando && this.archivoEditando) {
      // Actualizar Archivo existente en el curso
      const archivoActualizada: Archivo = {
        ...this.archivoEditando,
        nombre: this.servicioArchivos.eliminarExtension(this.archivoSeleccionado.name),
        tipo: this.archivoSeleccionado.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'PPTX',
        archivoId: `archivo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        fechaSubida: new Date(),
        tamano: this.archivoSeleccionado.size
      };

      this.servicioCursos.actualizarArchivoEnCurso(
        this.cursoEditando.id, 
        archivoActualizada
      );
      
    } else if (resultado.Archivo && this.cursoSeleccionado) {
      // Agregar nueva Archivo al curso
      this.servicioCursos.agregarArchivoACurso(
        this.cursoSeleccionado.id, 
        resultado.Archivo
      );
    }

    // Sincronizar UNA SOLA VEZ después de todas las operaciones
    this.servicioArchivos.sincronizarArchivosDesdeCursos(this.cursos);
    
    this.cargarCursos();
    this.limpiarEstado();
    alert(resultado.mensaje);
  } else {
    alert(resultado.mensaje);
  }
  
  this.cargando = false;
}
  private limpiarInputArchivo(): void {
    const inputArchivo = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (inputArchivo) inputArchivo.value = '';
  }


  limpiarEstado(): void {
    this.archivoSeleccionado = null;
    this.cursoEditando = null;
    this.archivoEditando = null;
    this.modoEdicion = false;
    this.limpiarInputArchivo();
  }

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
      archivos: [],
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
    this.vistaActual = 'cursos';
    CrearCurso.modoGlobal = 'tabla';
  }

  volverInicio(): void {
    this.vistaActual = 'inicio';
    CrearCurso.modoGlobal = 'formulario';
  }

  irCrearCurso(): void {
    this.router.navigate(['/crear-curso']);
  }

  verCurso(curso: Curso): void {
    alert(`Viendo curso: ${curso.titulo}`);
  }

  editarCurso(curso: Curso): void {
    // Usar el servicio para preparar el curso para edición
    this.cursoEditando = this.servicioCursos.prepararEdicionCurso(curso);
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

    // Usar validación del servicio
    const validacion = this.servicioCursos.validarCurso(this.cursoEditando);
    if (!validacion.valido) {
      alert(validacion.mensaje);
      return;
    }

    // Usar el servicio para actualizar el curso
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
      `Esta acción eliminará ${curso.archivos.length} Archivo(s) y no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      // Eliminar todos los archivos asociados del curso
      curso.archivos.forEach(async Archivo => {
        if (Archivo.archivoId) {
          try {
            await this.almacenamientoSession.borrarArchivo(Archivo.archivoId);
          } catch (error) {
            console.warn(`No se pudo eliminar el archivo: ${Archivo.archivoId}`, error);
          }
        }
      });

      // Usar el servicio para eliminar el curso
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

  async editarArchivo(curso: Curso, Archivo: Archivo): Promise<void> {
    this.modoEdicion = true;
    this.cursoEditando = curso;
    this.archivoEditando = Archivo;
    
    const inputArchivo = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (inputArchivo) {
      inputArchivo.click();
    }
  }

async eliminarArchivo(curso: Curso, archivo: Archivo): Promise<void> {
  const confirmar = window.confirm(
    `¿Está seguro de que desea eliminar el archivo "${archivo.nombre}"?\n\nEsta acción no se puede deshacer.`
  );

  if (!confirmar) return;

  // Eliminar archivo asociado
  const resultadoArchivo = await this.servicioArchivos.eliminarArchivoDeArchivo(archivo);
  
  if (resultadoArchivo.exito) {
    // Eliminar Archivo del curso
    this.servicioCursos.eliminarArchivoDeCurso(curso.id, archivo.id);
    
    // Eliminar también del listado general de archivos
    this.servicioArchivos.eliminarArchivo(archivo.id);
    
    this.cargarCursos();
    alert('Archivo eliminado exitosamente.');
  } else {
    alert(resultadoArchivo.mensaje);
  }
}

  async visualizarArchivo(Archivo: Archivo): Promise<void> {
    const resultado = await this.servicioArchivos.visualizarArchivo(Archivo);
    if (!resultado.exito) {
      alert(resultado.mensaje);
    }
  }

  async descargarArchivo(Archivo: Archivo): Promise<void> {
    const resultado = await this.servicioArchivos.descargarArchivoDeArchivo(Archivo);
    if (!resultado.exito) {
      alert(resultado.mensaje);
    }
  }

  obtenerTamanoLegible(tamanoBytes?: number): string {
    if (!tamanoBytes) return 'N/A';
    return this.servicioArchivos.obtenerTamanoArchivoLegible(tamanoBytes);
  }

  obtenerTipoLegible(Archivo: Archivo): string {
    return this.servicioArchivos.obtenerTipoArchivoLegibleParaArchivo(Archivo);
  }

  formatearFecha(fecha: Date): string {
    return this.servicioArchivos.formatearFecha(fecha);
  }


}
