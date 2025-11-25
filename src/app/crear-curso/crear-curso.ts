import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ServicioCursos, Curso } from '../servicios/servicio-cursos';
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
export class CrearCurso {
  static modoGlobal: 'formulario' | 'tabla' = 'formulario';
  
  @Input() modo: 'formulario' | 'tabla' = 'formulario';
  @Input() cursoEditando: Curso | null = null; // Recibir curso para editar
  @Output() cursoEditado = new EventEmitter<Curso>();
  @Output() cursoGuardado = new EventEmitter<Curso>();

  // Para Formulario
  curso: Curso = {
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

  // Para Tabla
  displayedColumns: string[] = ['numero', 'titulo', 'nivel', 'duracion', 'instructor', 'acciones'];
  dataSource!: MatTableDataSource<Curso>;
  cursos: Curso[] = [];

  constructor(
    public router: Router,
    private servicioCursos: ServicioCursos,
    private servicioAuth: ServicioAutorizacion
  ) {}

  ngOnInit(): void {
    this.modo = CrearCurso.modoGlobal;
    
    if (this.modo === 'tabla') {
      this.cargarCursos();
    }
    
    // Si hay un curso para editar, cargarlo en el formulario
    if (this.cursoEditando) {
      this.curso = { ...this.cursoEditando };
    }
  }

  // Método para verificar si estamos en modo edición
  esEdicion(): boolean {
    return this.cursoEditando !== null && this.cursoEditando.id !== 0;
  }

  // Método para cancelar edición
  cancelarEdicion(): void {
    if (this.esEdicion()) {
      this.cursoEditando = null;
      this.curso = {
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
    } else {
      // Navegar según el contexto
      const usuario = this.servicioAuth.obtenerUsuarioActual();
      if (usuario && usuario.tipo === 'administrador') {
        this.router.navigate(['/admin']);
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

  private crearCurso(): void {
    const usuario = this.servicioAuth.obtenerUsuarioActual();
    
    // Asignar instructor basado en el usuario autenticado o modo invitado
    if (usuario) {
      this.curso.instructor = usuario.email;
    } else {
      this.curso.instructor = 'invitado@gmail.com';
    }
    
    this.curso.fechaCreacion = new Date();
    this.curso.fechaActualizacion = new Date();

    this.servicioCursos.agregarCurso(this.curso);
    alert(`Curso "${this.curso.titulo}" creado correctamente.`);

    // Emitir evento
    this.cursoGuardado.emit(this.curso);

    // Navegar según el contexto
    if (usuario) {
      if (usuario.tipo === 'administrador') {
        this.router.navigate(['/admin']);
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
    
    // Emitir evento
    this.cursoGuardado.emit(cursoActualizado);
    
    // Limpiar el curso en edición
    this.cursoEditando = null;
    
    if (this.modo === 'tabla') {
      this.cargarCursos(); // Recargar la tabla
    } else {
      // Navegar según el contexto
      const usuario = this.servicioAuth.obtenerUsuarioActual();
      if (usuario && usuario.tipo === 'administrador') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/instructor']);
      }
    }
  }

  // Hacer este método público para que pueda ser llamado desde el padre
  cargarCursos(): void {
    this.cursos = this.servicioCursos.obtenerCursos();
    this.dataSource = new MatTableDataSource(this.cursos);
    
    // Forzar la actualización de la tabla
    if (this.dataSource) {
      this.dataSource.data = [...this.cursos];
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getNivelClass(nivel: string): string {
    switch(nivel) {
      case 'Principiante': return 'nivel-principiante';
      case 'Intermedio': return 'nivel-intermedio';
      case 'Avanzado': return 'nivel-avanzado';
      default: return '';
    }
  }

  editarCurso(curso: Curso): void {
    console.log('Editando curso:', curso);
    // Emitir el evento para que el componente padre maneje la edición
    this.cursoEditado.emit(curso);
  }

  eliminarCurso(curso: Curso): void {
    if (confirm(`¿Estás seguro de eliminar el curso "${curso.titulo}"?`)) {
      this.servicioCursos.eliminarCurso(curso.id);
      this.cargarCursos(); // Recargar la tabla inmediatamente
    }
  }

  volver(): void {
    CrearCurso.modoGlobal = 'formulario';
    
    // Navegar según el contexto
    const usuario = this.servicioAuth.obtenerUsuarioActual();
    if (usuario && usuario.tipo === 'administrador') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/instructor']);
    }
  }
}