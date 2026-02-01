import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
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
export class CrearCurso implements OnInit, OnDestroy {
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

  private _handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (this.mostrarModalEdicion) this.cerrarModalEdicion();
      if (this.mostrarModalCrear) this.cerrarModalCrear();
    }
  };

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

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this._handleEsc);
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
    
    try {
      document.body.classList.add('modal-open');
      document.addEventListener('keydown', this._handleEsc);
    } catch (e) {
      console.error('Error al abrir modal crear:', e);
    }
  }

  cerrarModalCrear(): void {
    this.mostrarModalCrear = false;
    this.cursoNuevo = this.inicializarCursoVacio();
    
    try {
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', this._handleEsc);
    } catch (e) {}
  }

  guardarNuevoCursoModal(): void {
    const validacion = this.servicioCursos.validarCurso(this.cursoNuevo);
    if (!validacion.valido) {
      alert(validacion.mensaje);
      return;
    }

    if (!this.cursoNuevo.nivel) {
      alert('Por favor, selecciona un nivel para el curso.');
      return;
    }

    if (!this.cursoNuevo.duracion || this.cursoNuevo.duracion < 1) {
      alert('Por favor, ingresa una duración válida (mínimo 1 hora).');
      return;
    }

    const usuario = this.servicioAuth.obtenerUsuarioActual();
    this.cursoNuevo.instructor = usuario ? usuario.email : 'invitado@gmail.com';
    this.cursoNuevo.fechaCreacion = new Date();
    this.cursoNuevo.fechaActualizacion = new Date();

    this.servicioCursos.agregarCurso(this.cursoNuevo);
    alert(`Curso "${this.cursoNuevo.titulo}" creado correctamente.`);
    
    this.cursoGuardado.emit(this.cursoNuevo);
    this.cerrarModalCrear();
    this.cargarCursos();
    this.aplicarFiltros();
  }

  // ========== MODAL EDITAR CURSO ==========
  abrirModalEdicion(curso: Curso): void {
    this.cursoParaEditar = { ...curso };
    this.mostrarModalEdicion = true;
    
    try {
      document.body.classList.add('modal-open');
      document.addEventListener('keydown', this._handleEsc);
    } catch (e) {
      console.error('Error al abrir modal editar:', e);
    }
  }

  cerrarModalEdicion(): void {
    this.mostrarModalEdicion = false;
    this.cursoParaEditar = null;
    
    try {
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', this._handleEsc);
    } catch (e) {}
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

    this.servicioCursos.actualizarCurso(cursoActualizado);
    alert(`Curso "${cursoActualizado.titulo}" actualizado correctamente.`);
    
    this.cursoGuardado.emit(cursoActualizado);
    this.cerrarModalEdicion();
    this.cargarCursos();
    this.aplicarFiltros();
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

    this.servicioCursos.agregarCurso(this.curso);
    alert(`Curso "${this.curso.titulo}" creado correctamente.`);

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
  }

  private actualizarCurso(): void {
    if (!this.cursoEditando) return;

    const cursoActualizado: Curso = {
      ...this.cursoEditando,
      ...this.curso,
      fechaActualizacion: new Date()
    };

    this.servicioCursos.actualizarCurso(cursoActualizado);
    alert(`Curso "${cursoActualizado.titulo}" actualizado correctamente.`);
    
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
  }

  // ========== MÉTODOS DE TABLA Y FILTROS ==========
  nuevoCurso(): void {
    this.abrirModalCrear();
  }

  cargarCursos(): void {
    const usuario = this.servicioAuth.obtenerUsuarioActual();
    
    if (usuario && usuario.tipo === 'instructor') {
      this.cursos = this.servicioCursos.obtenerCursosPorInstructor(usuario.email);
    } else {
      this.cursos = this.servicioCursos.obtenerCursos();
    }
    
    this.dataSource = new MatTableDataSource(this.cursos);
    this.aplicarFiltros();
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

  puedeEditarEliminar(): boolean {
    const usuario = this.servicioAuth.obtenerUsuarioActual();
    if (!usuario) return false;
    
    if (usuario.tipo === 'administrador') {
      return true;
    }
    
    if (usuario.tipo === 'instructor') {
      if (this.modo === 'tabla' && this.dataSource) {
        return true;
      }
      return this.cursos.some(c => c.instructor === usuario.email);
    }
    
    return false;
  }

  editarCurso(curso: Curso): void {
    console.log('CrearCurso: Editando curso:', curso);
    this.abrirModalEdicion(curso);
  }

  eliminarCurso(curso: Curso): void {
    if (confirm(`¿Estás seguro de eliminar el curso "${curso.titulo}"?`)) {
      this.servicioCursos.eliminarCurso(curso.id);
      this.cargarCursos();
      this.aplicarFiltros();
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