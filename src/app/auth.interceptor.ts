import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  let clonedRequest = req;

  const token = localStorage.getItem('token');
  if (token) {
    clonedRequest = clonedRequest.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  clonedRequest = clonedRequest.clone({
    setHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error:', error);

      if (error.status === 0) {
        console.error('Error de conexión: CORS o servidor no disponible');
      } 
      else if (error.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuarioActual');
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
