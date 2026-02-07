// src/app/servicios/servicio-autorizacion.ts
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Usuario } from './interfaces/usuario-interface';
import { environment } from './environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ServicioAutorizacion {
  private readonly claveUsuarioActual = 'usuarioActual';
  private readonly claveToken = 'token';
  private baseUrl = environment.apiURL;

  // Estados reactivos
  private logueado = new BehaviorSubject<boolean>(this.estaLogueado());
  private usuarioActual$ = new BehaviorSubject<Usuario | null>(this.obtenerUsuarioActual());

  constructor(
    private http: HttpClient,  // ✅ Solo HTTP y Router
    private router: Router
  ) {}

  // ========== MÉTODOS DE AUTENTICACIÓN ==========

  /**
   * Login con credenciales 
   */
  async login(email: string, password: string): Promise<Boolean> {
    const credenciales = {
      email,
      password,
      transaccion: 'VALIDAR_USUARIO'
    };

    const request$ =this.http.post<any>(`${this.baseUrl}/Usuario/validarLogin`, credenciales)
    .pipe(
      map(response => {
        // 1. Validar si la respuesta es Ok (Manejamos mayúsculas/minúsculas por seguridad)
        const esOk = (response?.respuesta === 'Ok' || response?.Respuesta === 'Ok');
          
        if (esOk && response.data) {
          // 2. Normalizar datos (Backend C# suele enviar Data/Usuario, JS prefiere data/usuario)
          const data = response.data || response.Data;
          const usuarioData = data.usuario || data.Usuario;
          const token = data.token || data.Token;

        if (usuarioData) {
          const usuario: Usuario = {
            id: usuarioData.id || usuarioData.Id || 0,
            email: usuarioData.email || usuarioData.Email || email,
            password: '', // Por seguridad no guardamos el pass en memoria
            tipo: usuarioData.tipo || usuarioData.Tipo || 'estudiante',
            nombre: usuarioData.nombre || usuarioData.Nombre || '',
            apellido: usuarioData.apellido || usuarioData.Apellido || '',
            edad: usuarioData.edad || usuarioData.Edad || 0
          };

          // 3. Guardar Token y Sesión
          if (token) {
            localStorage.setItem(this.claveToken, token);
          }
              
          // Esto guarda el usuario en localStorage/memoria
          this.iniciarSesion(usuario); 

          return true; // Login exitoso
        }
      }
      return false; // Falló la validación de datos
      })
    );
    try {
      // Esperamos a que termine la petición HTTP
      return await lastValueFrom(request$);
    } catch (error) {
      console.error('Error en login request:', error);
      return false;
    }
  }

  /**
   * Registro de nuevo usuario - llama directamente al backend
   */
  registrarUsuario(usuarioData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/Usuario/Registrar`, usuarioData);
  }

  /**
   * Inicia sesión con un usuario válido
   */
  iniciarSesion(usuario: Usuario): void {
    localStorage.setItem(this.claveUsuarioActual, JSON.stringify(usuario));
    this.logueado.next(true);
    this.usuarioActual$.next(usuario);
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
    this.router.navigate(['/login']);
  }

  // ========== MÉTODOS DE SESIÓN ==========

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
   * Obtiene el token actual
   */
  obtenerToken(): string | null {
    return localStorage.getItem(this.claveToken);
  }

  /**
   * Obtiene el tipo de usuario actual
   */
  obtenerTipoUsuario(): string | null {
    const usuario = this.obtenerUsuarioActual();
    return usuario?.tipo || null;
  }

  // ========== OBSERVABLES ==========

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

  // ========== MÉTODOS PRIVADOS ==========

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
}