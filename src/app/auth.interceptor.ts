//src/app/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Clonar la request con headers
  let clonedRequest = req.clone({
    setHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  // Agregar token si existe
  const token = localStorage.getItem('token');
  if (token) {
    clonedRequest = clonedRequest.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error en interceptor:', error);
      
      // Manejo específico para errores de conexión
      if (error.status === 0) {
        console.error('Error de conexión. Verifica:');
        console.error('1. ¿El backend está corriendo?');
        console.error('2. ¿La URL es correcta?');
        console.error('3. ¿Hay problemas de CORS?');
        
        // Puedes mostrar un mensaje más amigable
        // alert('No se puede conectar con el servidor. Verifica tu conexión.');
      }
      
      if (error.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuarioActual');
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
