// src/app/crud-archivos/crud-archivos.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicioArchivos } from '../servicios/servicio-archivos';
import { DialogoArchivoComponent } from '../dialogo-archivo/dialogo-archivo';
import { ServicioAutorizacion } from '../autorizacion.service';
import { MatIcon } from "@angular/material/icon";
import { Archivo } from '../interfaces/archivo-interface';

@Component({
  selector: 'app-crud-archivos',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogoArchivoComponent, MatIcon],
  templateUrl: './crud-archivos.html',
  styleUrls: ['./crud-archivos.css']
})
export class CrudArchivos implements OnInit {
  // Propiedades del COMPONENTE (no del servicio)
  archivoSeleccionado: Archivo | null = null;
  mostrarDialogo: boolean = false;
  archivos: Archivo[] = [];
  archivosFiltrados: Archivo[] = [];
  terminoBusqueda: string = '';
  filtroEstado: string = '';
  cargando: boolean = false;

  constructor(
    private servicioArchivos: ServicioArchivos,
    private servicioAutorizacion: ServicioAutorizacion
  ) {}

  ngOnInit(): void {
    this.cargarArchivos();
  }

  // ESTOS MÉTODOS PERTENECEN AL COMPONENTE, NO AL SERVICIO
  async cargarArchivos(): Promise<void> {
    this.cargando = true;
    
    try {
      const archivos = await this.servicioArchivos.obtenerTodosLosArchivos();
      
      this.archivos = archivos.map(archivo => ({
        ...archivo,
        fechaSubida: new Date(archivo.fechaSubida)
      }));
      
      this.archivosFiltrados = [...this.archivos];
      console.log(`Archivos cargados: ${this.archivos.length}`);
      
    } catch (error: any) {
      console.error('Error al cargar archivos:', error);
      alert('Error al cargar los archivos: ' + error.message);
      this.archivos = [];
      this.archivosFiltrados = [];
    } finally {
      this.cargando = false;
    }
  }

  filtrarArchivos(): void {
    this.archivosFiltrados = this.archivos.filter(archivo => {
      const coincideBusqueda = !this.terminoBusqueda || 
        archivo.nombre.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        archivo.descripcion.toLowerCase().includes(this.terminoBusqueda.toLowerCase());
      
      const coincideEstado = !this.filtroEstado || archivo.estado === this.filtroEstado;
      
      return coincideBusqueda && coincideEstado;
    });
  }

  abrirDialogoNuevo(): void {
    const usuario = this.servicioAutorizacion.obtenerUsuarioActual();
    if (!usuario || (usuario.tipo !== 'instructor' && usuario.tipo !== 'administrador')) {
      alert('Solo los instructores o administradores pueden subir archivos');
      return;
    }
    
    this.archivoSeleccionado = null;
    this.mostrarDialogo = true;
  }

  abrirDialogoModificar(archivo: Archivo): void {
    this.archivoSeleccionado = archivo;
    this.mostrarDialogo = true;
  }

  cerrarDialogo(): void {
    this.mostrarDialogo = false;
    this.archivoSeleccionado = null;
    this.cargarArchivos();
  }

  async eliminarArchivo(id: number): Promise<void> {
    if (!confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
      return;
    }

    try {
      await this.servicioArchivos.eliminarArchivoCompleto(id);
      alert('Archivo eliminado exitosamente');
      await this.cargarArchivos();
    } catch (error: any) {
      console.error('Error al eliminar archivo:', error);
      alert('Error al eliminar el archivo: ' + error.message);
    }
  }

  obtenerTamanoLegible(bytes: number): string {
    return this.servicioArchivos.obtenerTamanoLegible(bytes);
  }

  get archivosDisponible(): number {
    return this.archivos.filter(a => a.estado === 'Disponible').length;
  }

  get espacioTotalUtilizado(): string {
    const totalBytes = this.archivos.reduce((sum, archivo) => sum + archivo.tamano, 0);
    return this.obtenerTamanoLegible(totalBytes);
  }
}