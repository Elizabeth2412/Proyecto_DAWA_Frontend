import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Archivo, ServicioArchivos } from '../servicios/servicio-archivos';
import { ServicioAlmacenamientoSession } from '../servicios/servicio-almacenamiento-session';

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
  modoEdicionArchivo: boolean = false;

  constructor(
    public servicioArchivos: ServicioArchivos,
    private almacenamientoSession: ServicioAlmacenamientoSession
  ) {}

  ngOnInit(): void {
    if (this.archivo) {
      // Modificar archivo existente
      this.datosArchivo = { ...this.archivo };
      this.modoEdicionArchivo = true;
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
      this.modoEdicionArchivo = false;
    }
  }

  onArchivoSeleccionado(evento: any): void {
    const archivo = evento.target.files[0];
    if (archivo && this.servicioArchivos.esArchivoValido(archivo)) {
      
      // Verificar espacio disponible
      if (!this.almacenamientoSession.verificarEspacioDisponible(archivo.size)) {
        alert('El archivo es demasiado grande para el almacenamiento temporal. Por favor, use un archivo más pequeño.');
        this.limpiarInputArchivo();
        return;
      }
      
      this.archivoSeleccionado = archivo;
      
      // Rellenar automáticamente los campos
      this.datosArchivo.nombre = this.eliminarExtension(archivo.name);
      this.datosArchivo.tipo = archivo.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'PPTX';
      this.datosArchivo.tamano = archivo.size;
      
      // Generar descripción automática basada en el tipo de archivo
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

  this.cargando = true;
  
  try {
    if (this.archivoSeleccionado) {
      // Procesar archivo nuevo o actualizado
      await this.procesarArchivoConAlmacenamiento();
    } else {
      // Guardar solo datos sin archivo nuevo
      await this.guardarSoloDatos();
    }
    
    this.cerrarDialogo();
    alert(this.archivo ? 'Archivo actualizado exitosamente.' : 'Archivo creado exitosamente.');
    
  } catch (error: any) {
    console.error('Error al guardar archivo:', error);
    
    // Mensajes de error más específicos
    if (error.message.includes('Espacio insuficiente')) {
      alert('Error: El archivo es demasiado grande para el almacenamiento temporal. Por favor, use un archivo más pequeño.');
    } else if (error.message.includes('No se pudo guardar el archivo')) {
      alert('Error: No se pudo guardar el archivo. Por favor, intente con un archivo diferente.');
    } else {
      alert('Error al procesar el archivo. Por favor, intente nuevamente.');
    }
  } finally {
    this.cargando = false;
  }
}
private async procesarArchivoConAlmacenamiento(): Promise<void> {
  if (!this.archivoSeleccionado) return;

  const idArchivo = `archivo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  try {
    // Verificar espacio y guardar archivo en sessionStorage
    await this.almacenamientoSession.verificarYGuardarArchivo(idArchivo, this.archivoSeleccionado);

    if (this.archivo && this.archivo.id) {
      // Modificar archivo existente - eliminar archivo anterior si existe
      if (this.archivo.archivoId) {
        try {
          await this.almacenamientoSession.borrarArchivo(this.archivo.archivoId);
        } catch (error) {
          console.warn('No se pudo eliminar el archivo anterior:', error);
          // Continuar aunque falle la eliminación del archivo anterior
        }
      }
    // Actualizar archivo con nuevo archivo (usando método completo)
    const archivoActualizado = {
      ...this.datosArchivo,
      archivoId: idArchivo,
      fechaSubida: new Date(),
      tamano: this.archivoSeleccionado.size
    };
      // Actualizar archivo con nuevo archivo
      this.servicioArchivos.actualizarArchivoCompleto(this.archivo.id, archivoActualizado);
    } else {
      // Crear nuevo archivo
      this.servicioArchivos.agregarArchivo({
        nombre: this.datosArchivo.nombre!,
        tipo: this.datosArchivo.tipo!,
        tamano: this.datosArchivo.tamano!,
        descripcion: this.datosArchivo.descripcion!,
        usuario: 'elizabeth@gmail.com',
        estado: this.datosArchivo.estado!,
        fechaSubida: new Date(),
        archivoId: idArchivo
      } as Omit<Archivo, 'id'>);
    }
  } catch (error) {
    console.error('Error al procesar archivo con almacenamiento:', error);
    throw error; // Re-lanzar el error para manejarlo en el método guardar()
  }
}
  private async guardarSoloDatos(): Promise<void> {
    if (this.archivo && this.archivo.id) {
      // Modificar solo datos del archivo existente
      this.servicioArchivos.actualizarArchivoCompleto(this.archivo.id, this.datosArchivo);
    } else {
      // Crear nuevo archivo sin archivo físico
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
  }

  private procesarArchivo(): Promise<void> {
    return new Promise((resolve) => {
      // Simular procesamiento del archivo
      setTimeout(() => {
        console.log('Archivo procesado:', this.archivoSeleccionado);
        resolve();
      }, 1000);
    });
  }

  limpiarArchivo(): void {
    this.archivoSeleccionado = null;
    this.limpiarInputArchivo();
    
    // Limpiar campos relacionados con el archivo solo si es nuevo
    if (!this.archivo) {
      this.datosArchivo.nombre = '';
      this.datosArchivo.tipo = 'PDF';
      this.datosArchivo.tamano = 0;
      this.datosArchivo.descripcion = '';
    }
  }

  // Método para descargar/visualizar archivo existente
  async manejarArchivoExistente(): Promise<void> {
    if (!this.archivo?.archivoId) {
      alert('No hay archivo asociado para visualizar.');
      return;
    }

    try {
      const blob = await this.almacenamientoSession.obtenerArchivoBlob(this.archivo.archivoId);
      if (!blob) {
        alert('Archivo no encontrado en el almacenamiento.');
        return;
      }
      this.servicioArchivos.visualizarArchivoDesdeBlob(blob, this.archivo.nombre);
    } catch (error) {
      console.error('Error al manejar archivo existente:', error);
      alert('Error al cargar el archivo.');
    }
  }

  cerrarDialogo(): void {
    this.cerrar.emit();
  }
}