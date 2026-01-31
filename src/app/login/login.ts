/*src/app/login/login.ts*/
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
  errorMessage: string = "";

  constructor(
    private servicioAutorizacion: ServicioAutorizacion,
    private router: Router
  ) {}

  ngOnInit(): void {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
  async validateLogin(): Promise<void> {
  this.reiniciarValidaciones();

  if (!this.validarCamposVacios()) {
    return;
  }

  this.cargando = true;
  this.mensajeCarga = 'Validando credenciales...';
  this.errorMessage = '';

  try {
    const loginExitoso = await this.servicioAutorizacion.login(
      this.email,
      this.password
    );

    if (!loginExitoso) {
      throw new Error('Credenciales incorrectas');
    }

    const usuario = this.servicioAutorizacion.obtenerUsuarioActual();

    if (!usuario) {
      throw new Error('No se pudo obtener el usuario');
    }

    //  LIMPIAR ESTADO DEL LOGIN
    this.email = '';
    this.password = '';
    this.cargando = false;

    //  REDIRECCIÓN INMEDIATA
    switch (usuario.tipo) {
      case 'administrador':
        this.router.navigateByUrl('/admin-dashboard');
        break;
      case 'instructor':
        this.router.navigateByUrl('/instructor');
        break;
      case 'estudiante':
        this.router.navigateByUrl('/estudiante');
        break;
      default:
        this.router.navigateByUrl('/pagina-principal');
    }

  } catch (error: any) {
    console.error(error);

    this.cargando = false;
    this.credencialesInvalidas = true;
    this.errorMessage = error?.message || 'Error al iniciar sesión';

    setTimeout(() => {
      this.credencialesInvalidas = false;
    }, 3000);
  }
}


  private reiniciarValidaciones(): void {
    this.vacioEmail = false;
    this.vacioPassword = false;
    this.credencialesInvalidas = false;
    this.errorMessage = "";
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

  registrar(): void {
    this.router.navigate(['/register']);
  }
}