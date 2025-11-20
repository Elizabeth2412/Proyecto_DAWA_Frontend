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
  usuariosFiltrados: Usuario[] = [];
  usuarioActual: Usuario | null = null;
  usuarioEditando: Usuario | null = null;
  mostrarModalEdicion: boolean = false;
  mostrarModalNuevo: boolean = false;
  
  // Filtros
  terminoBusqueda: string = '';
  filtroRol: string = '';

  // Formularios
  usuarioForm = {
    email: '',
    nombre: '',
    apellido: '',
    edad: 0,
    tipo: 'estudiante' as 'administrador' | 'instructor' | 'estudiante'
  };

  nuevoUsuario = {
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    edad: 0,
    tipo: 'estudiante' as 'administrador' | 'instructor' | 'estudiante'
  };

  constructor(
    private servicioAutorizacion: ServicioAutorizacion,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.usuarioActual = this.servicioAutorizacion.obtenerUsuarioActual();
  }

  cargarUsuarios(): void {
    this.usuarios = this.servicioAutorizacion.obtenerTodosUsuarios();
    this.usuariosFiltrados = [...this.usuarios];
  }

  filtrarUsuarios(): void {
    this.usuariosFiltrados = this.usuarios.filter(usuario => {
      const coincideBusqueda = !this.terminoBusqueda || 
        usuario.nombre.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        usuario.email.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        (usuario.apellido && usuario.apellido.toLowerCase().includes(this.terminoBusqueda.toLowerCase()));
      
      const coincideRol = !this.filtroRol || usuario.tipo === this.filtroRol;
      
      return coincideBusqueda && coincideRol;
    });
  }

  contarUsuariosPorRol(rol: string): number {
    return this.usuarios.filter(usuario => usuario.tipo === rol).length;
  }

  // Funciones para el modal de edición
  editarUsuario(usuario: Usuario): void {
    this.usuarioEditando = usuario;
    this.usuarioForm = {
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido || '',
      edad: usuario.edad || 0,
      tipo: usuario.tipo
    };
    this.mostrarModalEdicion = true;
  }

  guardarEdicion(): void {
    if (this.usuarioEditando) {
      // Validaciones
      if (!this.usuarioForm.nombre.trim()) {
        alert('Por favor, ingresa un nombre válido.');
        return;
      }

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
        this.cerrarModalEdicion();
        this.cargarUsuarios();
      } else {
        alert(resultado.mensaje);
      }
    }
  }

  cerrarModalEdicion(): void {
    this.mostrarModalEdicion = false;
    this.usuarioEditando = null;
    this.usuarioForm = {
      email: '',
      nombre: '',
      apellido: '',
      edad: 0,
      tipo: 'estudiante'
    };
  }

  // Funciones para el modal de nuevo usuario
  abrirDialogoNuevoUsuario(): void {
    this.nuevoUsuario = {
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      edad: 0,
      tipo: 'estudiante'
    };
    this.mostrarModalNuevo = true;
  }

  registrarNuevoUsuario(): void {
    // Validaciones
    if (!this.nuevoUsuario.nombre.trim()) {
      alert('Por favor, ingresa un nombre válido.');
      return;
    }

    if (!this.nuevoUsuario.email.trim()) {
      alert('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    if (!this.nuevoUsuario.password || this.nuevoUsuario.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const resultado = this.servicioAutorizacion.registrarUsuario({
      nombre: this.nuevoUsuario.nombre,
      apellido: this.nuevoUsuario.apellido,
      correo: this.nuevoUsuario.email,
      password: this.nuevoUsuario.password,
      edad: this.nuevoUsuario.edad
    });

    if (resultado.exito) {
      alert(resultado.mensaje);
      this.cerrarModalNuevo();
      this.cargarUsuarios();
    } else {
      alert(resultado.mensaje);
    }
  }

  cerrarModalNuevo(): void {
    this.mostrarModalNuevo = false;
    this.nuevoUsuario = {
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      edad: 0,
      tipo: 'estudiante'
    };
  }

  eliminarUsuario(email: string): void {
    // No permitir eliminarse a sí mismo
    if (this.usuarioActual && this.usuarioActual.email === email) {
      alert('No puedes eliminar tu propia cuenta.');
      return;
    }

    const confirmacion = confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.');
    
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
    this.router.navigate(['/admin-dashboard']);
  }
}