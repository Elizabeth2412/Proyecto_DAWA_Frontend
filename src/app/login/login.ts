import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';

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

  constructor(
  ) {}

  ngOnInit(): void {
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  validateLogin(): void {
    this.vacioEmail = false;
    this.vacioPassword = false;

    // Verifica campos vacíos
    if (!this.email.trim()) {
      this.vacioEmail = true;
    }

    if (!this.password.trim()) {
      this.vacioPassword = true;
    }

    // Si hay campos vacíos, no continuar
    if (this.vacioEmail || this.vacioPassword) {
      setTimeout(() => {
        this.vacioEmail = false;
        this.vacioPassword = false;
      }, 3000);
      return;
    }
    
    alert('Se procederá a validar las credenciales de acceso.');
  }

}
