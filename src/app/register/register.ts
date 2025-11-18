import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ServicioAutorizacion } from '../autorizacion.service';

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
    password: ''
  };

  constructor(
    private router: Router,
    private servicioAutorizacion: ServicioAutorizacion
  ) {}

  irLogin() {
    this.router.navigate(['/login']);
  }

  registrarUsuario() {
    console.log('Usuario a registrar:', this.user);
    
    // Registrar el usuario usando el servicio
    const resultado = this.servicioAutorizacion.registrarUsuario(this.user);
    
    if (resultado.exito) {
      // Registro exitoso
      alert(resultado.mensaje);
      
      // Limpiar el formulario completamente
      this.limpiarFormulario();
      
      // Redirigir al login
      this.router.navigate(['/login']);
    } else {
      // Error en el registro
      alert(resultado.mensaje);
    }
  }

  /**
   * Limpia todos los campos del formulario
   */
  limpiarFormulario(): void {
    // Resetear el objeto user
    this.user = {
      nombre: '',
      apellido: '',
      edad: 0,
      correo: '',
      password: ''
    };
    
    // Resetear el formulario Angular
    if (this.formRegister) {
      this.formRegister.resetForm();
    }
  }
}