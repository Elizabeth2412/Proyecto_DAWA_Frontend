import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServicioAutorizacion } from '../autorizacion.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header implements OnInit {
  usuarioLogueado: boolean = false;

  constructor(
    private servicioAutorizacion: ServicioAutorizacion,
    private router: Router
  ) {}

  ngOnInit(): void {
    // usar obtenerUsuarioActual()
    this.usuarioLogueado = this.servicioAutorizacion.obtenerUsuarioActual() !== null;

    // . Mantiene sincronización con cambios de sesión
    this.servicioAutorizacion.cambioEstado$.subscribe(estado => {
      this.usuarioLogueado = estado;
    });
  }

  manejarSesion(): void {
    if (this.usuarioLogueado) {
      this.servicioAutorizacion.cerrarSesion();
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
