import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Archivo, ServicioArchivos } from '../servicios/servicio-archivos';

@Component({
  selector: 'app-dialogo-archivo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dialogo-archivo.html',
  styleUrls: ['./dialogo-archivo.css']
})
export class DialogoArchivoComponent {
  @Input() archivo: Archivo | null = null;
  @Output() cerrar = new EventEmitter<void>();

  datosArchivo: Partial<Archivo> = {};

  constructor(public servicioArchivos: ServicioArchivos) {} // Cambiado a public

  ngOnInit(): void {
    if (this.archivo) {
      // Modificar archivo existente
      this.datosArchivo = { ...this.archivo };
    } else {
      // Crear nuevo archivo
      this.datosArchivo = {
        nombre: '',
        tipo: 'PDF',
        tamano: 0,
        descripcion: '',
        estado: 'Disponible',
        usuario: 'elizabeth@gmail.com'
      };
    }
  }

  guardar(): void {
    if (this.archivo && this.archivo.id) {
      // Modificar archivo existente
      this.servicioArchivos.actualizarArchivo(this.archivo.id, this.datosArchivo);
    } else {
      // Crear nuevo archivo
      this.servicioArchivos.agregarArchivo({
        nombre: this.datosArchivo.nombre!,
        tipo: this.datosArchivo.tipo!,
        tamano: this.datosArchivo.tamano!,
        descripcion: this.datosArchivo.descripcion!,
        usuario: 'elizabeth@gmail.com',
        estado: this.datosArchivo.estado!,
        fechaSubida: new Date()
      } as Omit<Archivo, 'id'>);
    }

    this.cerrarDialogo();
  }

  cerrarDialogo(): void {
    this.cerrar.emit();
  }
}