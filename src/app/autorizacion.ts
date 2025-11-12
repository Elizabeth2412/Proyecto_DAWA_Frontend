import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AutorizacionService {
  public loguedo = new BehaviorSubject<boolean>(false);
  public email: string = '';
  public password: string = '';

  constructor() {}

  isAuthorized(): boolean {
    return true;
  }

  iniciarSesion() {
    if (this.email === 'admin@gmail.com' && this.password === 'admin') {
      alert('Credenciales correctas');
      this.loguedo.next(true);
    } else {
      alert('Credenciales incorrectas');
    }
  }

  validarUsuario() {
    this.loguedo.next(true);
  }

  cerrarSesion() {
    this.loguedo.next(false);
    this.isAuthorized();
  }
}