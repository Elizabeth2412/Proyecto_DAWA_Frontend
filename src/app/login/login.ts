import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit {
  loginForm!: FormGroup;
  showPassword: boolean = false;
  selectedLanguage: string = 'en';

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      console.log('Login attempt:', { email, password });
      this.login(email, password);
    } else {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  private login(email: string, password: string): void {
    alert(`Login attempt with email: ${email}`);
    // Ejemplo de navegación:
    // this.router.navigate(['/dashboard']);
  }

  socialLogin(provider: 'google' | 'apple' | 'facebook'): void {
    console.log(`Social login with: ${provider}`);
    switch (provider) {
      case 'google':
        this.loginWithGoogle();
        break;
      case 'apple':
        this.loginWithApple();
        break;
      case 'facebook':
        this.loginWithFacebook();
        break;
    }
  }

  private loginWithGoogle(): void {
    alert('Login with Google - Implement OAuth');
  }

  private loginWithApple(): void {
    alert('Login with Apple - Implement Sign in with Apple');
  }

  private loginWithFacebook(): void {
    alert('Login with Facebook - Implement Facebook Login');
  }

  onLanguageChange(): void {
    console.log('Language changed to:', this.selectedLanguage);
  }
}
