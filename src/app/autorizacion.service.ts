// src/app/autorizacion.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { ServicioUsuarios } from './servicios/servicio-usuarios';
import { Usuario } from './interfaces/usuario-interface';
@Injectable({
  providedIn: 'root'
})
export class ServicioAutorizacion {
  private readonly claveUsuarioActual = 'usuarioActual';
  private readonly claveToken = 'token';
  // --- Estados reactivos ---
  private logueado = new BehaviorSubject<boolean>(this.estaLogueado());
  private usuarioActual$ = new BehaviorSubject<Usuario | null>(this.obtenerUsuarioActual());
  // --- Estado de sesión observable para el header ---

  private estadoSesion = new BehaviorSubject<boolean>(this.obtenerUsuarioActual() !== null);
  cambioEstado$ = this.estadoSesion.asObservable();

  constructor(
    private servicioUsuarios: ServicioUsuarios,
    private router: Router
  ) {}
  /**
   * Valida las credenciales del usuario
   */
validarCredenciales(email: string, password: string): Observable<Usuario | null> {
  return this.servicioUsuarios.validarCredenciales(email, password);
}

    /**
   * Inicia sesión con un usuario válido
   */
  iniciarSesion(usuario: Usuario): void {
    localStorage.setItem(this.claveUsuarioActual, JSON.stringify(usuario));
    this.logueado.next(true);
    this.usuarioActual$.next(usuario);
    this.estadoSesion.next(true);
    
    // Redirigir según tipo de usuario
    this.redirigirSegunTipo(usuario.tipo);
  }
    /**
   * Cierra la sesión del usuario actual
   */
  cerrarSesion(): void {
    localStorage.removeItem(this.claveUsuarioActual);
    localStorage.removeItem(this.claveToken);
    this.logueado.next(false);
    this.usuarioActual$.next(null);
    this.estadoSesion.next(false);
    this.router.navigate(['/login']);
  }
  /**
   * Verifica si hay un usuario logueado
   */
  estaLogueado(): boolean {
    return localStorage.getItem(this.claveUsuarioActual) !== null;
  }
  /**
   * Obtiene el usuario actual desde localStorage
   */
  obtenerUsuarioActual(): Usuario | null {
    const usuarioAlmacenamiento = localStorage.getItem(this.claveUsuarioActual);
    return usuarioAlmacenamiento ? JSON.parse(usuarioAlmacenamiento) : null;
  }
  /**
   * Obtiene el tipo de usuario actual
   */
  obtenerTipoUsuario(): string | null {
    const usuario = this.obtenerUsuarioActual();
    return usuario ? usuario.tipo : null;
  }
  /**
   * Observable del estado de logueado
   */
  obtenerObservableLogueado(): Observable<boolean> {
    return this.logueado.asObservable();
  }
  /**
   * Observable del usuario actual
   */
  obtenerObservableUsuarioActual(): Observable<Usuario | null> {
    return this.usuarioActual$.asObservable();
  }
  /**
   * Obtiene todos los usuarios (delegado a ServicioUsuarios)
   */
obtenerTodosUsuarios(): Observable<Usuario[]> {
  return this.servicioUsuarios.obtenerTodosUsuarios();
}
login(email: string, password: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    this.servicioUsuarios.loginBackend({ email, password }).subscribe({
      next: (response: any) => {
        console.log('Respuesta del login:', response);

        // ✅ USAR nombres correctos (minúsculas)
        if (response?.respuesta === 'Ok' && response.data?.usuario) {

          const usuarioData = response.data.usuario;

          const usuario: Usuario = {
            email: usuarioData.email || usuarioData.Email || email,
            password: password,
            tipo: usuarioData.tipo || usuarioData.Tipo || 'estudiante',
            nombre: usuarioData.nombre || usuarioData.Nombre || '',
            apellido: usuarioData.apellido || usuarioData.Apellido || '',
            edad: usuarioData.edad || usuarioData.Edad || 0,
            id: usuarioData.id || usuarioData.Id || 0
          };

          // ✅ Guardar token correctamente
          if (response.data.token) {
            localStorage.setItem(this.claveToken, response.data.token);
          }

          this.iniciarSesion(usuario);
          resolve(true);

        } else {
          reject('Credenciales inválidas');
        }
      },
      error: (error) => {
        console.error('Error login backend:', error);
        reject('Error de conexión con el servidor');
      }
    });
  });
}

  // Determinar tipo de usuario desde el rol del backend
  private determinarTipoUsuario(rolBackend: string): 'administrador' | 'instructor' | 'estudiante' {
    switch (rolBackend?.toLowerCase()) {
      case 'admin':
      case 'administrador':
        return 'administrador';
      case 'instructor':
      case 'profesor':
        return 'instructor';
      default:
        return 'estudiante';
    }
  }


  private redirigirSegunTipo(tipo: string): void {
    switch (tipo) {
      case 'administrador':
        this.router.navigate(['/dashboard']);
        break;
      case 'instructor':
        this.router.navigate(['/instructor']);
        break;
      case 'estudiante':
        this.router.navigate(['/estudiante']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }


  // Registro con backend
  registrarUsuarioBackend(usuarioData: any): Observable<any> {
    return this.servicioUsuarios.registrarUsuarioBackend(usuarioData);
  }

  // Método de registro unificado
  registrarUsuario(usuarioData: any, usarBackend: boolean = true): Promise<any> {
    
      return new Promise((resolve, reject) => {
        this.registrarUsuarioBackend(usuarioData).subscribe({
          next: (response) => resolve(response),
          error: (error) => reject(error)
        });
      });
    
    
  }
}