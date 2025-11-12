import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Usuario {
  email: string;
  password: string;
  tipo: 'administrador' | 'instructor' | 'estudiante';
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class AutorizacionService {
  private usuarios: Usuario[] = [
    { email: 'admin@agropetech.com', password: 'admin123', tipo: 'administrador', nombre: 'Administrador Principal' },
    { email: 'instructor@agropetech.com', password: 'instructor123', tipo: 'instructor', nombre: 'Instructor Demo' },
    { email: 'estudiante@agropetech.com', password: 'estudiante123', tipo: 'estudiante', nombre: 'Estudiante Demo' }
  ];

  private usuarioActualKey = 'usuarioActual';
  private logueado = new BehaviorSubject<boolean>(this.estaLogueado());
  public usuarioActual = new BehaviorSubject<Usuario | null>(this.obtenerUsuarioActual());

  constructor() {
    // Inicializar con datos de localStorage si existen
    this.verificarStorage();
  }

  private verificarStorage(): void {
    const usuarioStorage = localStorage.getItem(this.usuarioActualKey);
    if (usuarioStorage) {
      this.logueado.next(true);
    }
  }

  validarCredenciales(email: string, password: string): Usuario | null {
    const usuario = this.usuarios.find(u => u.email === email && u.password === password);
    return usuario || null;
  }

  iniciarSesion(usuario: Usuario): void {
    localStorage.setItem(this.usuarioActualKey, JSON.stringify(usuario));
    this.logueado.next(true);
    this.usuarioActual.next(usuario);
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.usuarioActualKey);
    this.logueado.next(false);
    this.usuarioActual.next(null);
  }

  estaLogueado(): boolean {
    return localStorage.getItem(this.usuarioActualKey) !== null;
  }

  obtenerUsuarioActual(): Usuario | null {
    const usuarioStorage = localStorage.getItem(this.usuarioActualKey);
    return usuarioStorage ? JSON.parse(usuarioStorage) : null;
  }

  obtenerTipoUsuario(): string | null {
    const usuario = this.obtenerUsuarioActual();
    return usuario ? usuario.tipo : null;
  }

  getLogueado() {
    return this.logueado.asObservable();
  }
}