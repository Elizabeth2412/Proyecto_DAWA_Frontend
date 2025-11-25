import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicioArchivos, Archivo } from '../servicios/servicio-archivos';
import { DialogoArchivoComponent } from '../dialogo-archivo/dialogo-archivo';
import { ServicioCursos } from '../servicios/servicio-cursos';

@Component({
  selector: 'app-crud-archivos',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogoArchivoComponent],
  templateUrl: './crud-archivos.html',
  styleUrls: ['./crud-archivos.css']
})
export class CrudArchivos implements OnInit {
  archivoSeleccionado: Archivo | null = null;
  mostrarDialogo: boolean = false;

  archivos: Archivo[] = [];
  archivosFiltrados: Archivo[] = [];
  terminoBusqueda: string = '';
  filtroEstado: string = '';

  constructor(
    private servicioArchivos: ServicioArchivos,
    private servicioCursos: ServicioCursos
  ) {}

  ngOnInit(): void {
    this.cargarArchivos();
  }

  cargarArchivos(): void {
    // Obtener todos los cursos para sincronizar archivos
    const cursos = this.servicioCursos.obtenerCursos();
    
    // Sincronizar archivos desde cursos (solo una vez)
    this.servicioArchivos.sincronizarArchivosDesdeCursos(cursos);
    
    // Obtener todos los archivos (sin duplicados)
    this.archivos = this.servicioArchivos.obtenerTodosLosArchivos();
    this.archivosFiltrados = [...this.archivos];
    
    console.log('Archivos cargados:', this.archivos.length);
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
    // Recargar para reflejar cambios
    this.cargarArchivos();
  }

  eliminarArchivo(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este archivo? Esta acción eliminará el archivo de todos los cursos donde esté asignado.')) {
      // Usar el método completo que elimina tanto del listado como de los cursos
      this.servicioArchivos.eliminarArchivoCompleto(id);
      
      // Recargar la lista actualizada
      this.archivos = this.servicioArchivos.obtenerTodosLosArchivos();
      this.filtrarArchivos();
      
      alert('Archivo eliminado exitosamente de todos los cursos.');
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