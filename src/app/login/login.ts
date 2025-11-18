import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ServicioAutorizacion } from '../autorizacion.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit {
  showPassword: boolean = false;
  email: string = '';
  password: string = '';
  vacioEmail: boolean = false;
  vacioPassword: boolean = false;
  credencialesInvalidas: boolean = false;
  cargando: boolean = false; // Nuevo flag para pantalla de carga
mensajeCarga: string = ""; 
  constructor(
    private servicioAutorizacion: ServicioAutorizacion,
    private router: Router
  ) {}

  ngOnInit(): void {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  validateLogin(): void {
    this.reiniciarValidaciones();

    if (!this.validarCamposVacios()) {
      return;
    }

    // Mostrar pantalla de carga antes de validar
      this.mensajeCarga = "Se procederá a validar las credenciales de acceso...";

    this.cargando = true;

    // Simula un pequeño retardo para mostrar el mensaje de carga
    setTimeout(() => {
      this.procesarLogin();
    }, 1500);
  }

  private procesarLogin(): void {
    // Valida credenciales usando el servicio
    const usuario = this.servicioAutorizacion.validarCredenciales(this.email, this.password);

    if (usuario) {
      this.servicioAutorizacion.iniciarSesion(usuario);
      this.redireccionarSegunTipo(usuario.tipo);
    } else {
      this.mostrarErrorCredenciales();
    }

    this.cargando = false;
  }

  private reiniciarValidaciones(): void {
    this.vacioEmail = false;
    this.vacioPassword = false;
    this.credencialesInvalidas = false;
  }

  private validarCamposVacios(): boolean {
    let valido = true;

    if (!this.email.trim()) {
      this.vacioEmail = true;
      valido = false;
    }

    if (!this.password.trim()) {
      this.vacioPassword = true;
      valido = false;
    }

    if (!valido) {
      setTimeout(() => this.reiniciarValidaciones(), 3000);
    }

    return valido;
  }

  private mostrarErrorCredenciales(): void {
    this.credencialesInvalidas = true;
    setTimeout(() => {
      this.credencialesInvalidas = false;
    }, 3000);
  }

  private redireccionarSegunTipo(tipo: string): void {
    switch (tipo) {
      case 'administrador':
        this.router.navigate(['/admin']);
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

  registrar() {
    this.router.navigate(['/register']);
}

}
