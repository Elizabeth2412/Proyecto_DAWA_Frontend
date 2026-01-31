import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router,ActivatedRoute, NavigationEnd   } from '@angular/router';
import { ServicioAutorizacion } from '../autorizacion.service';
import { ServicioCursos } from '../servicios/servicio-cursos';
import { Curso } from '../interfaces/curso-interface';
import { Archivo } from '../interfaces/archivo-interface';
import { ServicioArchivos } from '../servicios/servicio-archivos';
import { Usuario } from '../interfaces/usuario-interface';
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

    try {
      //  Llamar al método con los parámetros correctos
      const descripcion = `Archivo para curso ${this.cursoSeleccionado?.titulo || 'sin curso'}`;
      
      // Usar el método que devuelve un Observable
      this.servicioArchivos.subirArchivo(
        this.archivoSeleccionado,
        descripcion,
        this.usuarioActual.email
      ).subscribe({
        next: (response: any) => {
          if (response.Respuesta === 'Ok') {
            // Crear el objeto Archivo con los datos del archivo subido
            const nuevoArchivo: Archivo = {
              id: response.Data?.id || Date.now(),
              nombre: this.servicioArchivos.eliminarExtension(this.archivoSeleccionado!.name),
              tipo: this.archivoSeleccionado!.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'PPTX',
              tamano: this.archivoSeleccionado!.size,
              fechaSubida: new Date(),
              descripcion: descripcion,
              usuario: this.usuarioActual!.email,
              estado: 'Disponible',
              archivoId: `archivo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
            };

            if (this.modoEdicion && this.cursoEditando && this.archivoEditando) {
              // Actualizar Archivo existente en el curso
              const archivoActualizada: Archivo = {
                ...this.archivoEditando,
                ...nuevoArchivo
              };

              this.servicioCursos.actualizarArchivoEnCurso(this.cursoEditando.id, archivoActualizada);
            } else if (this.cursoSeleccionado) {
              // Agregar nueva Archivo al curso
              this.servicioCursos.agregarArchivoACurso(this.cursoSeleccionado.id, nuevoArchivo);
            }

            // Sincronizar UNA SOLA VEZ después de todas las operaciones
            this.servicioArchivos.sincronizarArchivosDesdeCursos(this.cursos);

            this.cargarCursos();
            this.limpiarEstado();
            alert('Archivo subido exitosamente.');
          } else {
            alert(response.Leyenda || 'Error al subir el archivo.');
          }
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al subir archivo:', error);
          alert('Error al subir el archivo. Por favor, intente nuevamente.');
          this.cargando = false;
        }
      });
    } catch (error) {
      console.error('Error:', error);
      this.cargando = false;
    }
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
    if (this.usuarioActual?.tipo !== 'administrador' && this.usuarioActual?.tipo !== 'instructor') {
      alert('No tienes permisos para eliminar cursos');
      return;
    }

    const confirmar = window.confirm(
      `¿Está seguro de que desea eliminar el curso "${curso.titulo}"?\n\n` +
        `Esta acción eliminará ${curso.archivos.length} archivo(s) y no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      // Eliminar archivos físicos
      curso.archivos.forEach(archivo => {
        if (archivo.id) {
          this.servicioArchivos.eliminarArchivoCompleto(archivo.id);
        }
      });

      // Eliminar curso
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

    try {
      await this.servicioArchivos.eliminarArchivoCompleto(archivo.id);
      
      // Eliminar Archivo del curso
      this.servicioCursos.eliminarArchivoDeCurso(curso.id, archivo.id);

      this.cargarCursos();
      alert('Archivo eliminado exitosamente.');
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      alert('Error al eliminar el archivo. Por favor, intente nuevamente.');
    }
  }
  guardarEdicionCurso(): void {
    if (!this.cursoEditando) return;

    if (!this.cursoEditando.titulo?.trim()) {
      alert('El título del curso es obligatorio.');
      return;
    }

    if (!this.cursoEditando.descripcion?.trim()) {
      alert('La descripción del curso es obligatoria.');
      return;
    }

    if (!this.cursoEditando.id) {
      alert('Error: Curso sin ID.');
      return;
    }

    this.servicioCursos.actualizarCurso({
      ...this.cursoEditando,
      fechaActualizacion: new Date()
    });

    this.cargarCursos();
    this.mostrarModalCurso = false;
    this.cursoEditando = null;
    alert('Curso actualizado exitosamente.');
  }

  async descargarArchivo(archivo: Archivo): Promise<void> {
    try {
      await this.servicioArchivos.descargarArchivo(archivo.id, archivo.nombre);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      alert('Error al descargar el archivo. Por favor, intente nuevamente.');
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
