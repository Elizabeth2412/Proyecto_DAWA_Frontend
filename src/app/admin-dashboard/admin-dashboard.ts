import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AutorizacionService } from '../autorizacion';
import { ServicioAutorizacion, Usuario } from '../autorizacion.service';
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard implements OnInit {

  usuarioActual: Usuario | null = null;

  constructor(
    private autorizacionService: AutorizacionService,
    private usuariologueado: ServicioAutorizacion,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.usuariologueado.obtenerUsuarioActual();
  }

  cerrarSesion(): void {
    this.autorizacionService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
