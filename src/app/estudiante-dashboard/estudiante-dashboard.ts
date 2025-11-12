import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AutorizacionService } from '../autorizacion';

@Component({
  selector: 'app-estudiante-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estudiante-dashboard.html',
  styleUrls: ['./estudiante-dashboard.css']
})
export class EstudianteDashboard {
  constructor(
    private servicioAutorizacion: AutorizacionService,
    private enrutador: Router
  ) {}

  cerrarSesion(): void {
    this.servicioAutorizacion.cerrarSesion();
    this.enrutador.navigate(['/login']);
  }
}
