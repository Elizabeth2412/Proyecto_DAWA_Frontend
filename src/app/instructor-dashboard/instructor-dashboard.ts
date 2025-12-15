import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router,ActivatedRoute, NavigationEnd   } from '@angular/router';
import { ServicioAutorizacion } from '../autorizacion.service';
import { ServicioCursos, Curso } from '../servicios/servicio-cursos';
import { ServicioArchivos, Archivo } from '../servicios/servicio-archivos';
import { ServicioAlmacenamientoSession } from '../servicios/servicio-almacenamiento-session'; // .
import { Usuario } from '../servicios/servicio-usuarios';
import { CrearCurso } from '../crear-curso/crear-curso';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CrearCurso],
  templateUrl: './instructor-dashboard.html',
  styleUrls: ['./instructor-dashboard.css'],
})
export class InstructorDashboard implements OnInit {
  usuarioActual: Usuario | null = null;
  archivoSeleccionado: File | null = null;
  vistaActual: string = 'inicio';
  private routerSub!: Subscription;
  private routeSub!: Subscription;
  cursos: Curso[] = [];
  cargando: boolean = false;
  cursoEditando: Curso | null = null;
  archivoEditando: Archivo | null = null;
  modoEdicion: boolean = false;
  cursoSeleccionado: Curso | null = null;
  mostrarModalCurso: boolean = false;
 nuevoCurso: any = {
    titulo: '',
    descripcion: '',
    nivel: 'Principiante',
    duracion: 1
  };
  modalCurso: any = null;
  modoFormularioCurso: 'crear' | 'editar' = 'crear';

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
  
  if (!this.usuarioActual || 
      (this.usuarioActual.tipo !== 'instructor' && this.usuarioActual.tipo !== 'administrador')) {
    this.router.navigate(['/login']);
    return;
  }
  
  this.cargarCursos();
}
  ngOnDestroy(): void {
    if (this.routerSub) this.routerSub.unsubscribe();
    if (this.routeSub) this.routeSub.unsubscribe();
  }
  
cargarCursos(): void {
  if (this.usuarioActual && this.usuarioActual.email) {
    // Si es administrador, mostrar todos los cursos
    if (this.usuarioActual.tipo === 'administrador') {
      this.cursos = this.servicioCursos.obtenerCursos();
    } else {
      // Si es instructor, mostrar solo sus cursos
      this.cursos = this.servicioCursos.obtenerCursosPorInstructor(this.usuarioActual.email);
    }
  } else {
    this.cursos = this.servicioCursos
      .obtenerCursos()
      .filter((curso) => curso.instructor === 'invitado@gmail.com' || !curso.instructor);
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
          tamano: this.archivoSeleccionado.size,
        };

        this.servicioCursos.actualizarArchivoEnCurso(this.cursoEditando.id, archivoActualizada);
      } else if (resultado.Archivo && this.cursoSeleccionado) {
        // Agregar nueva Archivo al curso
        this.servicioCursos.agregarArchivoACurso(this.cursoSeleccionado.id, resultado.Archivo);
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
    this.modoFormularioCurso = 'crear';
    this.nuevoCurso = { 
      titulo: '', 
      descripcion: '', 
      nivel: 'Principiante', 
      duracion: 1 
    };
    this.modalCurso = this.nuevoCurso;
    this.cursoEditando = null;
    
    setTimeout(() => {
      this.mostrarModalCurso = true;
      console.log('Modal crear curso abierto');
      try {
        this.cdr.detectChanges();
      } catch (e) {
        console.error('Error en detectChanges:', e);
      }
      try {
        document.body.classList.add('modal-open');
      } catch (e) {}
      try {
        document.addEventListener('keydown', this._handleEsc);
      } catch (e) {}
    }, 0);
  }


  cerrarModalCrearCurso(): void {
    this.mostrarModalCurso = false;
    this.nuevoCurso = { titulo: '', descripcion: '' };
    this.cursoEditando = null;
    this.modalCurso = null;
    try {
      document.body.classList.remove('modal-open');
    } catch (e) {
      /* safe in SSR */
    }
    try {
      document.removeEventListener('keydown', this._handleEsc);
    } catch (e) {
      /* safe */
    }
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
      fechaActualizacion: new Date(),
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
      const curso = this.cursos.find((c) => c.id.toString() === cursoId);
      this.cursoSeleccionado = curso || null;
      console.log('Curso seleccionado:', this.cursoSeleccionado);
    } else {
      this.cursoSeleccionado = null;
    }
  }
 gestionarCursos(): void {
    // Navegar a la ruta correcta
    this.router.navigate(['/cursos']);
  }


  volverInicio(): void {
    this.vistaActual = 'inicio';
    CrearCurso.modoGlobal = 'formulario';
  }
  irCrearCurso(): void {
    this.router.navigate(['/cursos/nuevo']);
  }

  verCurso(curso: Curso): void {
    alert(`Viendo curso: ${curso.titulo}`);
  }
// En instructor-dashboard.ts, modifica el método editarCurso:
editarCurso(curso: Curso): void {
  console.log('Editando curso en instructor dashboard:', curso);
  
  // Para administradores e instructores, usar el modal local
  if (this.usuarioActual?.tipo === 'administrador' || this.usuarioActual?.tipo === 'instructor') {
    this.cursoEditando = this.servicioCursos.prepararEdicionCurso(curso);
    this.modalCurso = this.cursoEditando;

    setTimeout(() => {
      this.mostrarModalCurso = true;
      console.log('Modal abierto para editar curso:', this.cursoEditando);
      try {
        this.cdr.detectChanges();
      } catch (e) {
        console.error('Error en detectChanges:', e);
      }
      try {
        document.body.classList.add('modal-open');
      } catch (e) {}
      try {
        document.addEventListener('keydown', this._handleEsc);
      } catch (e) {}
    }, 0);
  }
}
  eliminarCurso(curso: Curso): void {
    // Permitir a administradores e instructores eliminar cursos
    if (this.usuarioActual?.tipo !== 'administrador' && this.usuarioActual?.tipo !== 'instructor') {
      alert('No tienes permisos para eliminar cursos');
      return;
    }

    const confirmar = window.confirm(
      `¿Está seguro de que desea eliminar el curso "${curso.titulo}"?\n\n` +
        `Esta acción eliminará ${curso.archivos.length} Archivo(s) y no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      curso.archivos.forEach(async (Archivo) => {
        if (Archivo.archivoId) {
          try {
            await this.almacenamientoSession.borrarArchivo(Archivo.archivoId);
          } catch (error) {
            console.warn(`No se pudo eliminar el archivo: ${Archivo.archivoId}`, error);
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
      fechaActualizacion: new Date(),
    };

    this.servicioCursos.actualizarCurso(actualizado);
    this.cargarCursos();
    this.mostrarModalCurso = false;
    this.cursoEditando = null;
    try {
      document.body.classList.remove('modal-open');
    } catch (e) {
      /* safe in SSR */
    }
    alert('Curso actualizado exitosamente.');
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
