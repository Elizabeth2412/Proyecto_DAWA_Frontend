import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ServicioAlmacenamientoSession {
  private readonly prefijoClave = 'agropetech_archivo_';

  constructor() {}

  async guardarArchivoBlob(id: string, archivo: Blob): Promise<void> {
    try {
      // Convertir Blob a base64 para almacenar en sessionStorage
      const base64 = await this.blobToBase64(archivo);
      const datosArchivo = {
        contenido: base64,
        tipo: archivo.type,
        nombre: (archivo as any).name || 'archivo',
        tamano: archivo.size,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem(this.prefijoClave + id, JSON.stringify(datosArchivo));
    } catch (error) {
      console.error('Error al guardar archivo en sessionStorage:', error);
      throw new Error('No se pudo guardar el archivo');
    }
  }

  async obtenerArchivoBlob(id: string): Promise<Blob | null> {
    try {
      const datosAlmacenados = sessionStorage.getItem(this.prefijoClave + id);
      if (!datosAlmacenados) return null;

      const datos = JSON.parse(datosAlmacenados);
      const blob = await this.base64ToBlob(datos.contenido, datos.tipo);
      return blob;
    } catch (error) {
      console.error('Error al obtener archivo de sessionStorage:', error);
      return null;
    }
  }

  async borrarArchivo(id: string): Promise<void> {
    try {
      sessionStorage.removeItem(this.prefijoClave + id);
    } catch (error) {
      console.error('Error al eliminar archivo de sessionStorage:', error);
      throw new Error('No se pudo eliminar el archivo');
    }
  }

  async listarIds(): Promise<string[]> {
    const ids: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const clave = sessionStorage.key(i);
      if (clave && clave.startsWith(this.prefijoClave)) {
        ids.push(clave.replace(this.prefijoClave, ''));
      }
    }
    return ids;
  }

  // Verificar espacio disponible (aproximadamente)
  verificarEspacioDisponible(tamanoBytes: number): boolean {
    // sessionStorage tiene ~5MB = 5 * 1024 * 1024 bytes
    const espacioMaximo = 5 * 1024 * 1024; // 5MB en bytes
    const espacioUsado = this.calcularEspacioUsado();
    
    return (espacioUsado + tamanoBytes) <= espacioMaximo;
  }

  private calcularEspacioUsado(): number {
    let espacioTotal = 0;
    for (let i = 0; i < sessionStorage.length; i++) {
      const clave = sessionStorage.key(i);
      if (clave) {
        const valor = sessionStorage.getItem(clave);
        espacioTotal += clave.length + (valor ? valor.length : 0);
      }
    }
    return espacioTotal;
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remover el prefijo data:application/...
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private base64ToBlob(base64: string, tipo: string): Promise<Blob> {
    return new Promise((resolve) => {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      resolve(new Blob([bytes], { type: tipo }));
    });
  }

  // Limpiar todos los archivos almacenados (útil para logout)
  limpiarTodosLosArchivos(): void {
    const clavesAEliminar: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const clave = sessionStorage.key(i);
      if (clave && clave.startsWith(this.prefijoClave)) {
        clavesAEliminar.push(clave);
      }
    }
    
    clavesAEliminar.forEach(clave => sessionStorage.removeItem(clave));
  }
}