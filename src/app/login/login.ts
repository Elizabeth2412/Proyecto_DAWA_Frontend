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
  cargando: boolean = false;
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

    this.mensajeCarga = "Se procederá a validar las credenciales de acceso...";
    this.cargando = true;

    setTimeout(() => {
      this.procesarLogin();
    }, 1500);
  }
private procesarLogin(): void {
  this.mensajeCarga = "Validando credenciales...";
  
  const usuario = this.servicioAutorizacion.validarCredenciales(this.email, this.password);

  if (usuario) {
    this.mensajeCarga = " Acceso concedido. Redirigiendo...";
    
    setTimeout(() => {
      this.servicioAutorizacion.iniciarSesion(usuario);
      
      // Redireccionar según el tipo de usuario
      switch (usuario.tipo) {
        case 'administrador':
          this.router.navigate(['/admin-dashboard']);
          break;
        case 'instructor':
          this.router.navigate(['/instructor']);
          break;
        case 'estudiante':
          this.router.navigate(['/estudiante']);
          break;
        default:
          this.router.navigate(['/pagina-principal']);
      }
      
      this.cargando = false;
    }, 1500);

  } else {
    this.mensajeCarga = " Error: credenciales incorrectas.";

    setTimeout(() => {
      this.cargando = false;
      this.mostrarErrorCredenciales();
    }, 1500);
  }
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

  // CORREGIDO: Este método ya existía pero no se estaba usando correctamente
  private redireccionarSegunTipo(tipo: string): void {
    switch (tipo) {
      case 'administrador':
        this.router.navigate(['/admin-dashboard']);
        break;
      case 'instructor':
        this.router.navigate(['/instructor']);
        break;
      case 'estudiante':
        this.router.navigate(['/estudiante']);
        break;
      default:
        this.router.navigate(['/pagina-principal']);
    }
  }

  // CORREGIDO: Este método debe estar alineado con la clase
  registrar(): void {
    this.router.navigate(['/register']);
  }
}