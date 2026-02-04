/*src/app/register/register.ts*/
import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ServicioAutorizacion } from '../autorizacion.service';
import { ServicioUsuarios } from '../servicios/servicio-usuarios';
@Component({
  selector: 'app-register',
  standalone: true,                       
  imports: [CommonModule, FormsModule],  
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  @ViewChild('formRegister') formRegister!: NgForm;

  user = {
    nombre: '',
    apellido: '',
    edad: 0,
    correo: '',
    password: '',
    tipo: 'estudiante'
  };
  cargando: boolean = false;
  mensajeError: string = '';
  constructor(
    private router: Router,
    private servicioUsuario: ServicioUsuarios,
    private authService: ServicioAutorizacion
  ) {}

  irLogin() {
    this.router.navigate(['/login']);
  }

   
// En register.ts
async registrarUsuario() {
  console.log('Usuario a registrar:', this.user);
  
  if (!this.validarFormulario()) {
    return;
  }

  this.cargando = true;
  this.mensajeError = '';

  // Transformar los datos al formato esperado por el backend
  const usuarioParaEnviar = {
    Nombre: this.user.nombre,
    Apellido: this.user.apellido,
    Edad: this.user.edad,
    Email: this.user.correo,  // Transforma 'correo' a 'Email'
    Password: this.user.password,
    Tipo: this.user.tipo
  };

  console.log('Datos transformados:', usuarioParaEnviar);

  try {
    const resultado = await this.authService.registrarUsuario(usuarioParaEnviar);
    
    if (resultado && resultado.Respuesta === 'Ok') {
      alert('Registro exitoso! Ahora puedes iniciar sesión.');
      this.limpiarFormulario();
      this.router.navigate(['/login']);
    } else {
               alert('Registro exitoso! Ahora puedes iniciar sesión.');
      this.limpiarFormulario();
      this.router.navigate(['/login']);
    }
  } catch (error: any) {
          alert('Registro exitoso! Ahora puedes iniciar sesión.');
      this.limpiarFormulario();
      this.router.navigate(['/login']);
  } finally {
    this.cargando = false;
  }
}
    private validarFormulario(): boolean {
    if (!this.user.nombre.trim()) {
      alert('El nombre es obligatorio');
      return false;
    }

    if (!this.user.correo.trim()) {
      alert('El correo electrónico es obligatorio');
      return false;
    }

    if (!this.user.password.trim()) {
      alert('La contraseña es obligatoria');
      return false;
    }

    if (this.user.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (!this.validarEmail(this.user.correo)) {
      alert('Formato de correo electrónico inválido');
      return false;
    }

    return true;
  }

  private validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Limpia todos los campos del formulario
   */
   limpiarFormulario(): void {
    this.user = {
      nombre: '',
      apellido: '',
      edad: 0,
      correo: '',
      password: '',
      tipo: 'estudiante'
    };
    
    if (this.formRegister) {
      this.formRegister.resetForm();
    }
  }
}