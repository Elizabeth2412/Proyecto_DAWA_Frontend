// src/app/servicios/servicio-usuarios.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.development';
import { Usuario } from '../interfaces/usuario-interface';

@Injectable({
  providedIn: 'root'
})
export class ServicioUsuarios {
  private baseUrl = environment.apiURL;
  // --- Usuarios del sistema ---
  private usuarios: Usuario[] = [
    { email: 'elizabeth@gmail.com', password: 'admin123', tipo: 'administrador', nombre: 'Elizabeth', apellido: 'Franco', edad: 20 },
    { email: 'leslie@gmail.com', password: 'instructor123', tipo: 'instructor', nombre: 'Leslie', apellido: 'Vera', edad: 20 },
    { email: 'joshua@hotmail.com', password: 'estudiante123', tipo: 'estudiante', nombre: 'Joshúa', apellido: 'Castillo', edad: 20 },
    { email: 'jonacas2000@outlook.com', password: '123456', tipo: 'estudiante', nombre: 'Jonathan', apellido: 'Castro', edad: 20 },
    { email: 'juan@outlook.com', password: '123456', tipo: 'estudiante', nombre: 'Juan', apellido: 'Robles', edad: 20 }
  ];
  // --- Claves para almacenamiento ---
  private readonly claveUsuarios = 'usuarios_agropetech';

  constructor(private http: HttpClient) {
    this.cargarUsuariosDesdeStorage();
  }


  /**
   * Carga usuarios desde localStorage al iniciar
   */
  private cargarUsuariosDesdeStorage(): void {
    const usuariosGuardados = localStorage.getItem(this.claveUsuarios);
    if (usuariosGuardados) {
      this.usuarios = JSON.parse(usuariosGuardados);
    } else {
      this.guardarUsuariosEnStorage();
    }
  }
  /**
   * Guarda usuarios en localStorage
   */
  private guardarUsuariosEnStorage(): void {
    localStorage.setItem(this.claveUsuarios, JSON.stringify(this.usuarios));
  }
  /**
   * Registra un nuevo usuario
   */
  registrarUsuario(nuevoUsuario: {
    nombre: string;
    apellido: string;
    edad: number;
    correo: string;
    password: string;
  }): { exito: boolean; mensaje: string } {

    const existeUsuario = this.usuarios.find(u => u.email === nuevoUsuario.correo);
    
    if (existeUsuario) {
      return {
        exito: false,
        mensaje: 'Este correo ya está registrado. Por favor usa otro o inicia sesión.'
      };
    }
    // Validar campos obligatorios
    if (!nuevoUsuario.nombre || !nuevoUsuario.correo || !nuevoUsuario.password) {
      return {
        exito: false,
        mensaje: 'Por favor completa todos los campos obligatorios.'
      };
    }
    // Crear nuevo usuario (por defecto será estudiante)
    const usuario: Usuario = {
      email: nuevoUsuario.correo,
      password: nuevoUsuario.password,
      tipo: 'estudiante',
      nombre: nuevoUsuario.nombre,
      apellido: nuevoUsuario.apellido,
      edad: nuevoUsuario.edad
    };
    // Agregar a la lista
    this.usuarios.push(usuario);
    // Guardar en localStorage
    this.guardarUsuariosEnStorage();

    return {
      exito: true,
      mensaje: '¡Registro exitoso! Ahora puedes iniciar sesión.'
    };
  }
  /**
   * Obtiene todos los usuarios del sistema
   */
  obtenerTodosUsuarios(): Usuario[] {
    return [...this.usuarios];
  }

  /**
   * Obtiene un usuario por su email
   */
  obtenerUsuarioPorEmail(email: string): Usuario | undefined {
    return this.usuarios.find(u => u.email === email);
  }
  /**
   * Actualiza un usuario existente
   */
  actualizarUsuario(email: string, usuarioActualizado: Usuario): { exito: boolean; mensaje: string } {
    const index = this.usuarios.findIndex(u => u.email === email);
    
    if (index === -1) {
      return {
        exito: false,
        mensaje: 'Usuario no encontrado.'
      };
    }
    // Actualizar usuario manteniendo el email original
    this.usuarios[index] = {
      ...usuarioActualizado,
      email: email  // El email no cambia
    };
    // Guardar cambios
    this.guardarUsuariosEnStorage();

    return {
      exito: true,
      mensaje: 'Usuario actualizado correctamente.'
    };
  }
  /**
   * Elimina un usuario del sistema
   */
  eliminarUsuario(email: string): { exito: boolean; mensaje: string } {
    const index = this.usuarios.findIndex(u => u.email === email);
    
    if (index === -1) {
      return {
        exito: false,
        mensaje: 'Usuario no encontrado.'
      };
    }

    this.usuarios.splice(index, 1);
    this.guardarUsuariosEnStorage();

    return {
      exito: true,
      mensaje: 'Usuario eliminado correctamente.'
    };
  }
  /**
   * Obtiene usuarios por tipo
   */
  obtenerUsuariosPorTipo(tipo: 'administrador' | 'instructor' | 'estudiante'): Usuario[] {
    return this.usuarios.filter(u => u.tipo === tipo);
  }
  /**
   * Obtiene estadísticas de usuarios
   */
  obtenerEstadisticasUsuarios(): {
    total: number;
    administradores: number;
    instructores: number;
    estudiantes: number;
  } {
    return {
      total: this.usuarios.length,
      administradores: this.usuarios.filter(u => u.tipo === 'administrador').length,
      instructores: this.usuarios.filter(u => u.tipo === 'instructor').length,
      estudiantes: this.usuarios.filter(u => u.tipo === 'estudiante').length
    };
  }
  /**
   * Cambia el tipo de usuario
   */
  cambiarTipoUsuario(email: string, nuevoTipo: 'administrador' | 'instructor' | 'estudiante'): { exito: boolean; mensaje: string } {
    const usuario = this.obtenerUsuarioPorEmail(email);
    
    if (!usuario) {
      return {
        exito: false,
        mensaje: 'Usuario no encontrado.'
      };
    }

    const usuarioActualizado: Usuario = {
      ...usuario,
      tipo: nuevoTipo
    };

    return this.actualizarUsuario(email, usuarioActualizado);
  }
  /**
   * Cambia la contraseña de un usuario
   */
  cambiarPassword(email: string, nuevaPassword: string): { exito: boolean; mensaje: string } {
    const usuario = this.obtenerUsuarioPorEmail(email);
    
    if (!usuario) {
      return {
        exito: false,
        mensaje: 'Usuario no encontrado.'
      };
    }

    const usuarioActualizado: Usuario = {
      ...usuario,
      password: nuevaPassword
    };

    return this.actualizarUsuario(email, usuarioActualizado);
  }
  /**
   * Verifica si un email ya está registrado
   */
  existeUsuario(email: string): boolean {
    return this.usuarios.some(u => u.email === email);
  }
  /**
   * Busca usuarios por nombre o email
   */
  buscarUsuarios(termino: string): Usuario[] {
    const terminoLower = termino.toLowerCase();
    return this.usuarios.filter(u => 
      u.nombre.toLowerCase().includes(terminoLower) ||
      u.email.toLowerCase().includes(terminoLower) ||
      (u.apellido && u.apellido.toLowerCase().includes(terminoLower))
    );
  }
  /**
   * Obtiene el número total de usuarios
   */
  obtenerTotalUsuarios(): number {
    return this.usuarios.length;
  }
  /**
 * Valida las credenciales del usuario (para login)
 */
  validarCredenciales(email: string, password: string): Usuario | null {
    console.log('Validando credenciales para:', email);
    console.log('Usuarios disponibles:', this.usuarios.map(u => ({ email: u.email })));
    
    const usuario = this.usuarios.find(u => u.email === email && u.password === password);
    
    console.log('Usuario encontrado:', usuario);
    
    return usuario || null;
  }
  
  // Método para login usando JWT
  loginBackend(credentials: { email: string, password: string }): Observable<any> {
    const usuario = {
      Email: credentials.email,
      Password: credentials.password,
      Transaccion: 'VALIDAR_USUARIO'
    };
    
    return this.http.post(`${this.baseUrl}/Usuario/ValidarLogin`, usuario);
  }

  // Método para obtener información del usuario desde backend
  getUsuarioInfoBackend(email: string): Observable<any> {
    const usuario = {
      Email: email,
      Transaccion: 'BUSCAR_USUARIO'
    };
    
    return this.http.post(`${this.baseUrl}/Usuario/GetUsuario`, usuario);
  }

  // Método para registrar usuario en backend
  registrarUsuarioBackend(usuarioData: any): Observable<any> {
    const usuario = {
      ...usuarioData,
      Transaccion: 'INSERTAR_USUARIO'
    };
    
    return this.http.post(`${this.baseUrl}/Usuario/RegistrarUsuario`, usuario);
  }

  // Método para actualizar usuario en backend
  actualizarUsuarioBackend(usuarioData: any): Observable<any> {
    const usuario = {
      ...usuarioData,
      Transaccion: 'ACTUALIZAR_USUARIO'
    };
    
    return this.http.post(`${this.baseUrl}/Usuario/SetUsuario`, usuario);
  }

  // Método para eliminar usuario en backend
  eliminarUsuarioBackend(email: string): Observable<any> {
    const usuario = {
      Email: email,
      Transaccion: 'ELIMINAR_USUARIO'
    };
    
    return this.http.post(`${this.baseUrl}/Usuario/SetUsuario`, usuario);
  }

}