import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ServicioCursos, Curso } from '../servicios/servicio-cursos';

@Component({
  selector: 'app-lista-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-cursos.html',
  styleUrls: ['./lista-cursos.css'],
})
export class ListaCursosComponent implements OnInit {
  cursos: Curso[] = [];
  cursosFiltrados: Curso[] = [];

  // filtros
  terminoBusqueda = '';
  filtroNivel = '';

  constructor(private servicioCursos: ServicioCursos, private router: Router) {}

  ngOnInit(): void {
    this.cargarCursos();
  }

  cargarCursos(): void {
    this.cursos = this.servicioCursos.obtenerCursos();
    this.cursosFiltrados = [...this.cursos];
  }

  filtrarCursos(): void {
    this.cursosFiltrados = this.cursos.filter((curso) => {
      const coincideTexto =
        !this.terminoBusqueda ||
        curso.titulo.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        curso.instructor.toLowerCase().includes(this.terminoBusqueda.toLowerCase());

      const coincideNivel = !this.filtroNivel || curso.nivel === this.filtroNivel;

      return coincideTexto && coincideNivel;
    });
  }

  nuevoCurso(): void {
    this.router.navigate(['/cursos/nuevo']);
  }

  editarCurso(curso: Curso): void {
    this.router.navigate(['/cursos/editar', curso.id]);
  }

  eliminarCurso(id: number): void {
    if (confirm('¿Estás seguro de eliminar este curso?')) {
      this.servicioCursos.eliminarCurso(id);
      this.cargarCursos();
    }
  }
}
