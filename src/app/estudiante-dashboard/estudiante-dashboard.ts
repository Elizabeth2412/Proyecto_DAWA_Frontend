import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServicioAutorizacion, Usuario } from '../autorizacion.service';

@Component({
  selector: 'app-estudiante-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estudiante-dashboard.html',
  styleUrls: ['./estudiante-dashboard.css']
})
export class EstudianteDashboard {
    usuarioActual: Usuario | null = null;

  constructor(
    private servicioAutorizacion: ServicioAutorizacion,
        private usuariologueado: ServicioAutorizacion,
    private enrutador: Router
  ) {}
  ngOnInit(): void {
    this.usuarioActual = this.usuariologueado.obtenerUsuarioActual();
  }
  cerrarSesion(): void {
    this.servicioAutorizacion.cerrarSesion();
    this.enrutador.navigate(['/login']);
  }
}
