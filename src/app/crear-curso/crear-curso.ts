import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ServicioCursos, Curso } from '../servicios/servicio-cursos';
import { ServicioAutorizacion } from '../autorizacion.service';

@Component({
  selector: 'app-crear-curso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-curso.html',
  styleUrls: ['./crear-curso.css']
})
export class CrearCurso {

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
}
