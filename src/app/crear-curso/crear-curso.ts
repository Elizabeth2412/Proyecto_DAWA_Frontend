import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ServicioCursos } from '../servicios/servicio-cursos';
import { Curso } from '../interfaces/curso-interface';
import { ServicioAutorizacion } from '../autorizacion.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-crear-curso',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './crear-curso.html',
  styleUrls: ['./crear-curso.css']
})
export class CrearCurso implements OnInit {
  static modoGlobal: 'formulario' | 'tabla' = 'formulario';
  cursos: Curso[] = [];
  cursosFiltrados: Curso[] = [];
  
  // Filtros
  terminoBusqueda = '';
  filtroNivel = '';

  @Input() modo: 'formulario' | 'tabla' = 'formulario';
  @Input() cursoEditando: Curso | null = null;
  @Output() cursoEditado = new EventEmitter<Curso>();
  @Output() cursoGuardado = new EventEmitter<Curso>();

  // MODALES
  mostrarModalCrear: boolean = false;
  mostrarModalEdicion: boolean = false;
  cursoParaEditar: Curso | null = null;
  cursoNuevo: Curso = this.inicializarCursoVacio();

  // Para Formulario (vista standalone)
  curso: Curso = this.inicializarCursoVacio();

  // Para Tabla
  displayedColumns: string[] = ['numero', 'titulo', 'nivel', 'duracion', 'instructor', 'acciones'];
  dataSource!: MatTableDataSource<Curso>;

  // Estado de carga
  cargando: boolean = false;
  errorCarga: string = '';

  constructor(
    public router: Router,
    private servicioCursos: ServicioCursos,
    private servicioAuth: ServicioAutorizacion,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      if (data['modo']) {
        this.modo = data['modo'];
        CrearCurso.modoGlobal = data['modo'];
      }
    });

    if (this.modo === 'tabla') {
      this.cargarCursos();
    }
    
    if (this.cursoEditando) {
      this.curso = { ...this.cursoEditando };
    }
  }

  private inicializarCursoVacio(): Curso {
    return {
      id: 0,
      titulo: '',
      descripcion: '',
      nivel: '',      
      duracion: 0,   
      archivos: [],
      progreso: 0,
      instructor: '',
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };
  }

  // ========== MODAL CREAR NUEVO CURSO ==========
  abrirModalCrear(): void {
    this.cursoNuevo = this.inicializarCursoVacio();
    this.mostrarModalCrear = true;
  }

  cerrarModalCrear(): void {
    this.mostrarModalCrear = false;
    this.cursoNuevo = this.inicializarCursoVacio();
  }

  guardarNuevoCursoModal(): void {
    const validacion = this.servicioCursos.validarCurso(this.cursoNuevo);
    if (!validacion.valido) {
      alert(validacion.mensaje);
      return;
    }

    const usuario = this.servicioAuth.obtenerUsuarioActual();
    this.cursoNuevo.instructor = usuario ? usuario.email : 'invitado@gmail.com';
    this.cursoNuevo.fechaCreacion = new Date();
    this.cursoNuevo.fechaActualizacion = new Date();

    this.servicioCursos.agregarCurso(this.cursoNuevo).subscribe({
      next: (response: any) => {
        const respuesta = response.respuesta || response.Respuesta;
        const leyenda = response.leyenda || response.Leyenda;

        if (respuesta === 'Ok') {
          alert(leyenda || `Curso "${this.cursoNuevo.titulo}" creado correctamente.`);
          this.cursoGuardado.emit(this.cursoNuevo);
          this.cerrarModalCrear();
          this.cargarCursos();
        } else {
          alert(leyenda || 'Error al crear el curso');
        }
      },
      error: (error) => {
        console.error('Error al crear curso:', error);
        alert('Error al crear el curso: ' + (error.error?.leyenda || error.message));
      }
    });
  }

  // ========== MODAL EDITAR CURSO ==========
  abrirModalEdicion(curso: Curso): void {
    this.cursoParaEditar = { ...curso };
    this.mostrarModalEdicion = true;
  }

  cerrarModalEdicion(): void {
    this.mostrarModalEdicion = false;
    this.cursoParaEditar = null;
  }

  guardarEdicionModal(): void {
    if (!this.cursoParaEditar) return;

    const validacion = this.servicioCursos.validarCurso(this.cursoParaEditar);
    if (!validacion.valido) {
      alert(validacion.mensaje);
      return;
    }

    const cursoActualizado: Curso = {
      ...this.cursoParaEditar,
      fechaActualizacion: new Date()
    };

    this.servicioCursos.actualizarCurso(cursoActualizado).subscribe({
      next: (response: any) => {
        const respuesta = response.respuesta || response.Respuesta;
        const leyenda = response.leyenda || response.Leyenda;

        if (respuesta === 'Ok') {
          alert(leyenda || `Curso "${cursoActualizado.titulo}" actualizado correctamente.`);
          this.cursoGuardado.emit(cursoActualizado);
          this.cerrarModalEdicion();
          this.cargarCursos();
        } else {
          alert(leyenda || 'Error al actualizar el curso');
        }
      },
      error: (error) => {
        console.error('Error al actualizar curso:', error);
        alert('Error al actualizar el curso: ' + (error.error?.leyenda || error.message));
      }
    });
  }

  // ========== MÉTODOS DE LA VISTA FORMULARIO ==========
  esEdicion(): boolean {
    return this.cursoEditando !== null && this.cursoEditando.id !== 0;
  }

  cancelarEdicion(): void {
    if (this.esEdicion()) {
      this.cursoEditando = null;
      this.curso = this.inicializarCursoVacio();
    } else {
      const usuario = this.servicioAuth.obtenerUsuarioActual();
      if (usuario && usuario.tipo === 'administrador') {
        this.router.navigate(['/admin-dashboard']);
      } else if (usuario && usuario.tipo === 'instructor') {
        this.router.navigate(['/instructor']);
      } else {
        this.router.navigate(['/']);
      }
    }
  }

  guardarCurso(): void {
    if (this.esEdicion()) {
      this.actualizarCurso();
    } else {
      this.crearCurso();
    }
  }

  crearCurso(): void {
    const usuario = this.servicioAuth.obtenerUsuarioActual();
    
    if (usuario) {
      this.curso.instructor = usuario.email;
    } else {
      this.curso.instructor = 'invitado@gmail.com';
    }
    
    this.curso.fechaCreacion = new Date();
    this.curso.fechaActualizacion = new Date();

    this.servicioCursos.agregarCurso(this.curso).subscribe({
      next: (response: any) => {
        const respuesta = response.respuesta || response.Respuesta;
        const leyenda = response.leyenda || response.Leyenda;

        if (respuesta === 'Ok') {
          alert(leyenda || `Curso "${this.curso.titulo}" creado correctamente.`);
          this.cursoGuardado.emit(this.curso);

          if (usuario) {
            if (usuario.tipo === 'administrador') {
              this.router.navigate(['/admin-dashboard']);
            } else {
              this.router.navigate(['/instructor']);
            }
          } else {
            this.router.navigate(['/']);
          }
        } else {
          alert(leyenda || 'Error al crear el curso');
        }
      },
      error: (error) => {
        console.error('Error al crear curso:', error);
        alert('Error al crear el curso: ' + (error.error?.leyenda || error.message));
      }
    });
  }

  private actualizarCurso(): void {
    if (!this.cursoEditando) return;

    const cursoActualizado: Curso = {
      ...this.cursoEditando,
      ...this.curso,
      fechaActualizacion: new Date()
    };

    this.servicioCursos.actualizarCurso(cursoActualizado).subscribe({
      next: (response: any) => {
        const respuesta = response.respuesta || response.Respuesta;
        const leyenda = response.leyenda || response.Leyenda;

        if (respuesta === 'Ok') {
          alert(leyenda || `Curso "${cursoActualizado.titulo}" actualizado correctamente.`);
          this.cursoGuardado.emit(cursoActualizado);
          this.cursoEditando = null;
          
          if (this.modo === 'tabla') {
            this.cargarCursos();
          } else {
            const usuario = this.servicioAuth.obtenerUsuarioActual();
            if (usuario && usuario.tipo === 'administrador') {
              this.router.navigate(['/admin-dashboard']);
            } else {
              this.router.navigate(['/instructor']);
            }
          }
        } else {
          alert(leyenda || 'Error al actualizar el curso');
        }
      },
      error: (error) => {
        console.error('Error al actualizar curso:', error);
        alert('Error al actualizar el curso: ' + (error.error?.leyenda || error.message));
      }
    });
  }

  // ========== MÉTODOS DE TABLA Y FILTROS ==========
  nuevoCurso(): void {
    this.abrirModalCrear();
  }

  cargarCursos(): void {
    this.cargando = true;
    this.errorCarga = '';

    this.servicioCursos.obtenerCursos().subscribe({
      next: (cursos) => {
        console.log('Cursos recibidos:', cursos);
        
        this.cursos = cursos || [];
        this.dataSource = new MatTableDataSource(this.cursos);
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar cursos:', error);
        this.errorCarga = 'Error al cargar los cursos: ' + error.message;
        this.cursos = [];
        this.dataSource = new MatTableDataSource<Curso>([]);
        this.cargando = false;
        
        if (error.message.includes('Error interno del servidor')) {
          this.errorCarga = 'Error del servidor al cargar cursos. Por favor, intente más tarde.';
        } else if (error.message.includes('No se pudo conectar')) {
          this.errorCarga = 'No se puede conectar con el servidor. Verifique su conexión.';
        }
      }
    });
  }

  aplicarFiltros(): void {
    let cursosFiltrados = [...this.cursos];

    // Filtro por búsqueda (título o instructor)
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase().trim();
      cursosFiltrados = cursosFiltrados.filter(curso =>
        curso.titulo.toLowerCase().includes(termino) ||
        curso.instructor.toLowerCase().includes(termino)
      );
    }

    // Filtro por nivel
    if (this.filtroNivel) {
      cursosFiltrados = cursosFiltrados.filter(curso => 
        curso.nivel === this.filtroNivel
      );
    }

    this.dataSource.data = cursosFiltrados;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.terminoBusqueda = filterValue;
    this.aplicarFiltros();
  }

  filtrarPorNivel(): void {
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroNivel = '';
    this.aplicarFiltros();
  }

  getNivelClass(nivel: string): string {
    switch(nivel) {
      case 'Principiante': return 'nivel-principiante';
      case 'Intermedio': return 'nivel-intermedio';
      case 'Avanzado': return 'nivel-avanzado';
      default: return '';
    }
  }

  // CORREGIDO: Método que verifica permisos de edición/eliminación
  puedeEditarEliminar(curso?: Curso): boolean {
    const usuario = this.servicioAuth.obtenerUsuarioActual();
    if (!usuario) return false;
    
    // Administrador puede editar/eliminar cualquier curso
    if (usuario.tipo === 'administrador') {
      return true;
    }
    
    // Instructor solo puede editar/eliminar sus propios cursos
    if (usuario.tipo === 'instructor' && curso) {
      // Verificar que el instructor del curso sea el mismo usuario actual
      return curso.instructor === usuario.email;
    }
    
    return false;
  }

  editarCurso(curso: Curso): void {
    // CORREGIDO: Pasar el curso al método de validación
    if (this.puedeEditarEliminar(curso)) {
      this.abrirModalEdicion(curso);
    } else {
      alert('No tienes permisos para editar este curso. Solo puedes editar los cursos que hayas creado.');
    }
  }

  eliminarCurso(curso: Curso): void {
    // CORREGIDO: Pasar el curso al método de validación
    if (!this.puedeEditarEliminar(curso)) {
      alert('No tienes permisos para eliminar este curso. Solo puedes eliminar los cursos que hayas creado.');
      return;
    }

    if (confirm(`¿Estás seguro de eliminar el curso "${curso.titulo}"?\nEsta acción no se puede deshacer.`)) {
      this.servicioCursos.eliminarCurso(curso.id).subscribe({
        next: (response: any) => {
          const respuesta = response.respuesta || response.Respuesta;
          const leyenda = response.leyenda || response.Leyenda;

          if (respuesta === 'Ok') {
            alert(leyenda || `Curso "${curso.titulo}" eliminado correctamente.`);
            this.cargarCursos();
          } else {
            alert(leyenda || 'Error al eliminar el curso');
          }
        },
        error: (error) => {
          console.error('Error al eliminar curso:', error);
          alert('Error al eliminar el curso: ' + (error.error?.leyenda || error.message));
        }
      });
    }
  }

  volver(): void {
    CrearCurso.modoGlobal = 'formulario';
    
    const usuario = this.servicioAuth.obtenerUsuarioActual();
    if (usuario && usuario.tipo === 'administrador') {
      this.router.navigate(['/admin-dashboard']);
    } else {
      this.router.navigate(['/instructor']);
    }
  }
}