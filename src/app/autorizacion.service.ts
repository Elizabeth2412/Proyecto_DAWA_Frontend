import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Usuario {
  email: string;
  password: string;
  tipo: 'administrador' | 'instructor' | 'estudiante';
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServicioAutorizacion {
  private usuarios: Usuario[] = [
    { email: 'admin@agropetech.com', password: 'admin123', tipo: 'administrador', nombre: 'Administrador Principal' },
    { email: 'instructor@agropetech.com', password: 'instructor123', tipo: 'instructor', nombre: 'Instructor Demo' },
    { email: 'estudiante@agropetech.com', password: 'estudiante123', tipo: 'estudiante', nombre: 'Estudiante Demo' }
  ];

  private readonly claveUsuarioActual = 'usuarioActual';
  private logueado = new BehaviorSubject<boolean>(this.estaLogueado());
  private usuarioActual$ = new BehaviorSubject<Usuario | null>(this.obtenerUsuarioActual());

  // 🔧 Estado de sesión observable
  private estadoSesion = new BehaviorSubject<boolean>(this.obtenerUsuarioActual() !== null);
  cambioEstado$ = this.estadoSesion.asObservable();

  constructor() {}

  validarCredenciales(email: string, password: string): Usuario | null {
    return this.usuarios.find(u => u.email === email && u.password === password) || null;
  }

  iniciarSesion(usuario: Usuario): void {
    localStorage.setItem(this.claveUsuarioActual, JSON.stringify(usuario));
    this.logueado.next(true);
    this.usuarioActual$.next(usuario);

    // 🔧 Emitir cambio de estado para el header
    this.estadoSesion.next(true);
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.claveUsuarioActual);
    this.logueado.next(false);
    this.usuarioActual$.next(null);

    // 🔧 Emitir cambio de estado para el header
    this.estadoSesion.next(false);
  }

  estaLogueado(): boolean {
    return localStorage.getItem(this.claveUsuarioActual) !== null;
  }

  obtenerUsuarioActual(): Usuario | null {
    const usuarioAlmacenamiento = localStorage.getItem(this.claveUsuarioActual);
    return usuarioAlmacenamiento ? JSON.parse(usuarioAlmacenamiento) : null;
  }

  obtenerTipoUsuario(): string | null {
    const usuario = this.obtenerUsuarioActual();
    return usuario ? usuario.tipo : null;
  }

  obtenerObservableLogueado(): Observable<boolean> {
    return this.logueado.asObservable();
  }

  obtenerObservableUsuarioActual(): Observable<Usuario | null> {
    return this.usuarioActual$.asObservable();
  }
}
