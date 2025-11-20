import { Component } from '@angular/core';
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
  
  modo: 'formulario' | 'tabla' = 'formulario';


  //Para Formulario
  curso: Curso = {
    id: 0,
    titulo: '',
    descripcion: '',
    nivel: '',      
    duracion: 0,   
    diapositivas: [],
    progreso: 0,
    instructor: '',
    fechaCreacion: new Date(),
    fechaActualizacion: new Date()
  };

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
  }

  guardarCurso(): void {
    const usuario = this.servicioAuth.obtenerUsuarioActual();

    if (!usuario) {
      alert('Error: usuario no autenticado.');
      return;
    }

    this.curso.instructor = usuario.email;
    this.curso.fechaCreacion = new Date();
    this.curso.fechaActualizacion = new Date();

    this.servicioCursos.agregarCurso(this.curso);

    alert(`Curso "${this.curso.titulo}" creado correctamente.`);
    this.router.navigate(['/instructor']);
  }

  //Para Tabla
  displayedColumns: string[] = ['numero', 'titulo', 'nivel', 'duracion', 'instructor', 'acciones'];
  dataSource!: MatTableDataSource<Curso>;
  cursos: Curso[] = [];
  
  cargarCursos(): void {
    this.cursos = this.servicioCursos.obtenerCursos();
    this.dataSource = new MatTableDataSource(this.cursos);
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
    alert(`Editar curso: ${curso.titulo}`);

  }

  eliminarCurso(curso: Curso): void {
    if (confirm(`¿Estás seguro de eliminar el curso "${curso.titulo}"?`)) {
      if (this.servicioCursos.eliminarCurso) {
        this.servicioCursos.eliminarCurso(curso.id);
      } else {
        this.cursos = this.cursos.filter(c => c.id !== curso.id);
      }
      this.cargarCursos();
    }
  }

  volver(): void {
    CrearCurso.modoGlobal = 'formulario';
    this.router.navigate(['/admin']);
  }
}





