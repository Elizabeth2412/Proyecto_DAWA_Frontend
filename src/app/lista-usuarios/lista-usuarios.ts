// lista-usuarios.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ServicioAutorizacion, Usuario } from '../autorizacion.service';

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-usuarios.html',
  styleUrls: ['./lista-usuarios.css']
})
export class ListaUsuarios implements OnInit {
  usuarios: Usuario[] = [];
  usuarioEditando: Usuario | null = null;
  mostrarModal: boolean = false;
  
  usuarioForm = {
    email: '',
    nombre: '',
    apellido: '',
    edad: 0,
    tipo: 'estudiante' as 'administrador' | 'instructor' | 'estudiante'
  };

  constructor(
    private servicioAutorizacion: ServicioAutorizacion,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.usuarios = this.servicioAutorizacion.obtenerTodosUsuarios();
  }

  editarUsuario(usuario: Usuario): void {
    this.usuarioEditando = usuario;
    this.usuarioForm = {
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido || '',
      edad: usuario.edad || 0,
      tipo: usuario.tipo
    };
    this.mostrarModal = true;
  }

  guardarEdicion(): void {
    if (this.usuarioEditando) {
      const usuarioActualizado: Usuario = {
        ...this.usuarioEditando,
        nombre: this.usuarioForm.nombre,
        apellido: this.usuarioForm.apellido,
        edad: this.usuarioForm.edad,
        tipo: this.usuarioForm.tipo
      };

      const resultado = this.servicioAutorizacion.actualizarUsuario(
        this.usuarioEditando.email,
        usuarioActualizado
      );

      if (resultado.exito) {
        alert(resultado.mensaje);
        this.cerrarModal();
        this.cargarUsuarios();
      } else {
        alert(resultado.mensaje);
      }
    }
  }

  eliminarUsuario(email: string): void {
    const confirmacion = confirm('¿Estás seguro de que deseas eliminar este usuario?');
    
    if (confirmacion) {
      const resultado = this.servicioAutorizacion.eliminarUsuario(email);
      
      if (resultado.exito) {
        alert(resultado.mensaje);
        this.cargarUsuarios();
      } else {
        alert(resultado.mensaje);
      }
    }
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.usuarioEditando = null;
    this.usuarioForm = {
      email: '',
      nombre: '',
      apellido: '',
      edad: 0,
      tipo: 'estudiante'
    };
  }

  obtenerClaseTipo(tipo: string): string {
    switch (tipo) {
      case 'administrador':
        return 'badge bg-danger';
      case 'instructor':
        return 'badge bg-warning text-dark';
      case 'estudiante':
        return 'badge bg-success';
      default:
        return 'badge bg-secondary';
    }
  }

  obtenerIconoTipo(tipo: string): string {
    switch (tipo) {
      case 'administrador':
        return 'bi-shield-fill-check';
      case 'instructor':
        return 'bi-person-video3';
      case 'estudiante':
        return 'bi-person-fill';
      default:
        return 'bi-person';
    }
  }

  volver(): void {
    this.router.navigate(['/admin']);
  }
}
