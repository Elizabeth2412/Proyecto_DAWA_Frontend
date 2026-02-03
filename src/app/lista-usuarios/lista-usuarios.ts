// lista-usuarios.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ServicioAutorizacion } from '../autorizacion.service';
import { ServicioUsuarios } from '../servicios/servicio-usuarios';
import { Usuario } from '../interfaces/usuario-interface';

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
  cargando: boolean = false;
  
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
    private servicioUsuario: ServicioUsuarios,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.servicioAutorizacion.obtenerUsuarioActual();
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.servicioUsuario.obtenerTodosUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.usuariosFiltrados = [...usuarios];
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        alert('Error al cargar usuarios: ' + error.message);
        this.usuarios = [];
        this.usuariosFiltrados = [];
        this.cargando = false;
      }
    });
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
    if (!this.usuarioEditando) return;

    // Validaciones
    if (this.usuarioActual && this.usuarioEditando.email === this.usuarioActual.email) {
      if (this.usuarioForm.tipo !== this.usuarioActual.tipo) {
        alert('No puedes cambiar tu propio rol de administrador.');
        return;
      }
    }

    if (!this.usuarioForm.nombre.trim()) {
      alert('Por favor, ingresa un nombre válido.');
      return;
    }

    const usuarioActualizado = {
      Email: this.usuarioEditando.email,
      Nombre: this.usuarioForm.nombre,
      Apellido: this.usuarioForm.apellido,
      Edad: this.usuarioForm.edad,
      Tipo: this.usuarioForm.tipo,
      Transaccion: 'ACTUALIZAR_USUARIO'
    };

    this.servicioUsuario.actualizarUsuarioBackend(usuarioActualizado).subscribe({
      next: (response: any) => {
        if (response && response.Respuesta === 'Ok') {
          alert(response.Leyenda || 'Usuario actualizado correctamente');
          this.cerrarModalEdicion();
          this.cargarUsuarios();
        } else {
          alert(response?.Leyenda || 'Error al actualizar usuario');
        }
      },
      error: (error) => {
        console.error('Error al actualizar usuario:', error);
        alert('Error al actualizar usuario: ' + (error.error?.Leyenda || error.message));
      }
    });
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

    const usuarioData = {
      Email: this.nuevoUsuario.email,
      Password: this.nuevoUsuario.password,
      Tipo: this.nuevoUsuario.tipo,
      Nombre: this.nuevoUsuario.nombre,
      Apellido: this.nuevoUsuario.apellido,
      Edad: this.nuevoUsuario.edad,
      Transaccion: 'INSERTAR_USUARIO'
    };

    this.servicioUsuario.registrarUsuarioBackend(usuarioData).subscribe({
      next: (response: any) => {
        if (response && response.Respuesta === 'Ok') {
          alert(response.Leyenda || 'Usuario registrado correctamente');
          this.cerrarModalNuevo();
          this.cargarUsuarios();
        } else {
          alert(response?.Leyenda || 'Error al registrar usuario');
        }
      },
      error: (error) => {
        console.error('Error al registrar usuario:', error);
        alert('Error al registrar usuario: ' + (error.error?.Leyenda || error.message));
      }
    });
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
      this.servicioUsuario.eliminarUsuarioBackend(email).subscribe({
        next: (response: any) => {
          if (response && response.Respuesta === 'Ok') {
            alert(response.Leyenda || 'Usuario eliminado correctamente');
            this.cargarUsuarios();
          } else {
            alert(response?.Leyenda || 'Error al eliminar usuario');
          }
        },
        error: (error) => {
          console.error('Error al eliminar usuario:', error);
          alert('Error al eliminar usuario: ' + (error.error?.Leyenda || error.message));
        }
      });
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