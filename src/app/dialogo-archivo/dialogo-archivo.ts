// src/app/dialogo-archivo/dialogo-archivo.ts (SIMPLIFICADO)
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicioArchivos } from '../servicios/servicio-archivos';
import { ServicioAutorizacion } from '../autorizacion.service';
import { Archivo } from '../interfaces/archivo-interface';

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
  archivoSeleccionado: File | null = null;
  cargando: boolean = false;

  constructor(
    public servicioArchivos: ServicioArchivos,
    private servicioAutorizacion: ServicioAutorizacion
  ) {}

  ngOnInit(): void {
    if (this.archivo) {
      // Modificar archivo existente
      this.datosArchivo = { ...this.archivo };
    } else {
      // Crear nuevo archivo
      const usuario = this.servicioAutorizacion.obtenerUsuarioActual();
      this.datosArchivo = {
        nombre: '',
        tipo: 'PDF',
        tamano: 0,
        descripcion: '',
        estado: 'Disponible',
        usuario: usuario?.email || 'elizabeth@gmail.com'
      };
    }
  }

  onArchivoSeleccionado(evento: any): void {
    const archivo = evento.target.files[0];
    if (archivo && this.servicioArchivos.esArchivoValido(archivo)) {
      this.archivoSeleccionado = archivo;
      
      // Rellenar automáticamente los campos
      this.datosArchivo.nombre = this.eliminarExtension(archivo.name);
      this.datosArchivo.tipo = archivo.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'PPTX';
      this.datosArchivo.tamano = archivo.size;
      
      // Generar descripción automática
      if (!this.datosArchivo.descripcion || this.datosArchivo.descripcion === '') {
        this.datosArchivo.descripcion = this.generarDescripcionAutomatica(archivo.name);
      }
      
    } else {
      alert('Por favor, selecciona un archivo PDF o PPTX válido.');
      this.limpiarInputArchivo();
    }
  }

  private eliminarExtension(nombreArchivo: string): string {
    return nombreArchivo.replace(/\.[^/.]+$/, "");
  }

  private generarDescripcionAutomatica(nombreArchivo: string): string {
    const nombreSinExtension = this.eliminarExtension(nombreArchivo);
    const tipo = nombreArchivo.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Presentación';
    return `${tipo}: ${nombreSinExtension}`;
  }

  private limpiarInputArchivo(): void {
    const inputArchivo = document.querySelector('#inputArchivo') as HTMLInputElement;
    if (inputArchivo) inputArchivo.value = '';
  }
async guardar(): Promise<void> {
  // Validaciones básicas
  if (!this.datosArchivo.nombre?.trim()) {
    alert('El nombre del archivo es obligatorio.');
    return;
  }

  if (!this.datosArchivo.descripcion?.trim()) {
    alert('La descripción del archivo es obligatoria.');
    return;
  }

  // Verificar que haya archivo seleccionado para nuevo
  if (!this.archivoSeleccionado && !this.archivo) {
    alert('Debes seleccionar un archivo para subir.');
    return;
  }

  // Verificar permisos del usuario
  const usuario = this.servicioAutorizacion.obtenerUsuarioActual();
  if (!usuario) {
    alert('Usuario no autenticado. Por favor, inicia sesión nuevamente.');
    return;
  }

  // Verificar que el usuario tenga permisos para subir archivos
  if (usuario.tipo !== 'instructor' && usuario.tipo !== 'administrador') {
    alert('Solo instructores y administradores pueden subir archivos.');
    return;
  }

  this.cargando = true;

  try {
    if (this.archivo && this.archivo.id) {
      // Actualizar archivo existente
      await this.servicioArchivos.actualizarArchivoCompleto(this.archivo.id, this.datosArchivo);
      alert('Archivo actualizado exitosamente.');
    } else if (this.archivoSeleccionado) {
      // Crear nuevo archivo
      const response = await this.servicioArchivos.agregarArchivoConArchivo(
        this.archivoSeleccionado,
        this.datosArchivo.descripcion || '',
        usuario.email
      );
      
      console.log('Respuesta exitosa del servidor:', response);
      alert('Archivo subido exitosamente. ' + (response.Leyenda || ''));
    }
    
    this.cerrarDialogo();
    
  } catch (error: any) {
    console.error('Error completo al guardar archivo:', error);
    
    // Mensaje más amigable para el usuario
    let mensajeError = error.message || 'Error desconocido al guardar el archivo';
    
    // Si el error es del tipo que esperamos (con mensaje claro)
    if (typeof error === 'string') {
      mensajeError = error;
    } else if (error.error && error.error.message) {
      mensajeError = error.error.message;
    }
    
    alert(`Error: ${mensajeError}`);
  } finally {
    this.cargando = false;
  }
}

  limpiarArchivo(): void {
    this.archivoSeleccionado = null;
    this.limpiarInputArchivo();
    
    if (!this.archivo) {
      this.datosArchivo.nombre = '';
      this.datosArchivo.tipo = 'PDF';
      this.datosArchivo.tamano = 0;
      this.datosArchivo.descripcion = '';
    }
  }

  cerrarDialogo(): void {
    this.cerrar.emit();
  }
}