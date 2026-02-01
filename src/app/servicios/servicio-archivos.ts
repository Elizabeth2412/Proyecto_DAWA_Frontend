// src/app/servicios/servicio-archivos.ts 
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServicioCursos } from './servicio-cursos';
import { Archivo } from '../interfaces/archivo-interface';
import { Curso } from '../interfaces/curso-interface';
import { environment } from '../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ServicioArchivos {
  private baseUrl = environment.apiURL;
  private archivos: Archivo[] = [];

  constructor(
    private http: HttpClient,
    private servicioCursos: ServicioCursos
  ) {}

  // Métodos que llaman al backend
  obtenerTodosLosArchivos(): Promise<Archivo[]> {
    return new Promise((resolve, reject) => {
      this.obtenerArchivos()
        .then((response: any) => {
          if (response.Respuesta === 'Ok' && response.Data) {
            const archivos = response.Data.map((archivo: any) => ({
              id: archivo.id,
              nombre: archivo.nombre,
              tipo: archivo.tipo,
              tamano: archivo.tamano,
              fechaSubida: new Date(archivo.fechaSubida),
              descripcion: archivo.descripcion || '',
              usuario: archivo.usuario,
              estado: archivo.estado || 'Disponible',
              archivoId: archivo.archivoId
            }));
            resolve(archivos);
          } else {
            reject(new Error(response.Leyenda || 'Error al obtener archivos'));
          }
        })
        .catch(reject);
    });
  }

  obtenerArchivos(): Promise<any> {
    return new Promise((resolve, reject) => {
      const archivo = {
        Transaccion: 'CONSULTAR_ARCHIVO'
      };
      
      console.log('Obteniendo archivos desde:', `${this.baseUrl}/Archivo/GetArchivo`);
      
      this.http.post(`${this.baseUrl}/Archivo/GetArchivo`, archivo).subscribe({
        next: (response: any) => {
          console.log('Respuesta de obtener archivos:', response);
          
          // El backend devuelve 'respuesta' (minúscula) o 'Respuesta' (mayúscula)
          const respuesta = response.respuesta || response.Respuesta;
          const leyenda = response.leyenda || response.Leyenda;
          const data = response.data || response.Data;
          
          if (response && respuesta === 'Ok') {
            resolve({
              Respuesta: 'Ok',
              Leyenda: leyenda,
              Data: data || []
            });
          } else {
            reject(new Error(leyenda || 'Error al obtener archivos'));
          }
        },
        error: (error) => {
          console.error('Error HTTP al obtener archivos:', error);
          reject(new Error(`Error de conexión: ${error.message}`));
        }
      });
    });
  }

  subirArchivo(archivo: File, descripcion: string, usuario: string): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('descripcion', descripcion);
    formData.append('usuario', usuario);
    
    return this.http.post(`${this.baseUrl}/Archivo/SetArchivo`, formData);
  }

  obtenerArchivosPorUsuario(usuario: string): Observable<any> {
    const archivo = {
      Usuario: usuario,
      Transaccion: 'ARCHIVOS_POR_USUARIO'
    };
    
    return this.http.post(`${this.baseUrl}/Archivo/GetArchivo`, archivo);
  }

  obtenerArchivoPorId(id: number): Promise<Archivo | undefined> {
    return new Promise((resolve, reject) => {
      this.obtenerTodosLosArchivos()
        .then(archivos => {
          const archivo = archivos.find(a => a.id === id);
          resolve(archivo);
        })
        .catch(reject);
    });
  }

  agregarArchivo(archivoData: Omit<Archivo, 'id'>): Promise<number> {
    return new Promise((resolve, reject) => {
      const nuevoId = this.archivos.length > 0 ? Math.max(...this.archivos.map(a => a.id)) + 1 : 1;
      const nuevoArchivo: Archivo = {
        ...archivoData,
        id: nuevoId
      };
      this.archivos.push(nuevoArchivo);
      this.guardarArchivos();
      resolve(nuevoId);
    });
  }

  agregarArchivoConArchivo(file: File, descripcion: string, usuario: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('Archivo', file);
      formData.append('Descripcion', descripcion || `Archivo: ${this.eliminarExtension(file.name)}`);
      formData.append('Usuario', usuario);

      console.log('Enviando archivo al backend:', {
        nombre: file.name,
        tamaño: file.size,
        usuario: usuario,
        descripcion: descripcion
      });

      this.http.post(`${this.baseUrl}/Archivo/SetArchivo`, formData).subscribe({
        next: (response: any) => {
          console.log('Respuesta completa del servidor:', response);
          
          const respuesta = response.respuesta || response.Respuesta;
          const leyenda = response.leyenda || response.Leyenda;
          
          if (respuesta === 'Ok') {
            resolve({
              Respuesta: 'Ok',
              Leyenda: leyenda,
              Data: response.data || response.Data
            });
          } else {
            reject(new Error(leyenda || 'Error al subir archivo'));
          }
        },
        error: (error) => {
          console.error('Error HTTP detallado:', error);
          
          if (error.status === 0) {
            reject(new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.'));
          } else if (error.status === 415) {
            reject(new Error('Tipo de archivo no soportado. Solo se permiten PDF y PPTX.'));
          } else if (error.status === 413) {
            reject(new Error('El archivo es demasiado grande. Tamaño máximo: 50MB'));
          } else {
            reject(new Error(`Error ${error.status}: ${error.message}`));
          }
        }
      });
    });
  }

  actualizarArchivoCompleto(id: number, archivoActualizado: Partial<Archivo>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.obtenerArchivoPorId(id)
        .then(archivo => {
          if (!archivo) {
            reject(new Error('Archivo no encontrado'));
            return;
          }

          const archivoActualizadoCompleto = { ...archivo, ...archivoActualizado };
          this.http.post(`${this.baseUrl}/Archivo/ActualizarArchivo`, archivoActualizadoCompleto).subscribe({
            next: (response: any) => {
              const respuesta = response.respuesta || response.Respuesta;
              if (respuesta === 'Ok') {
                resolve();
              } else {
                const leyenda = response.leyenda || response.Leyenda;
                reject(new Error(leyenda || 'Error al actualizar archivo'));
              }
            },
            error: (error) => reject(error)
          });
        })
        .catch(reject);
    });
  }

  eliminarArchivoCompleto(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.delete(`${this.baseUrl}/Archivo/EliminarArchivo/${id}`).subscribe({
        next: (response: any) => {
          const respuesta = response.respuesta || response.Respuesta;
          if (respuesta === 'Ok') {
            resolve();
          } else {
            const leyenda = response.leyenda || response.Leyenda;
            reject(new Error(leyenda || 'Error al eliminar archivo'));
          }
        },
        error: (error) => reject(error)
      });
    });
  }

  descargarArchivo(id: number, nombreArchivo: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.baseUrl}/Archivo/DescargarArchivo/${id}`, {
        responseType: 'blob'
      }).subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = nombreArchivo;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          resolve();
        },
        error: (error) => reject(error)
      });
    });
  }

  // Métodos de utilidad para cursos
  actualizarArchivoEnCursos(archivoActualizado: Archivo): void {
    const cursos = this.servicioCursos.obtenerCursos();

    cursos.forEach(curso => {
      const indice = curso.archivos.findIndex(a => a.id === archivoActualizado.id);
      if (indice !== -1) {
        curso.archivos[indice] = { ...curso.archivos[indice], ...archivoActualizado };
        this.servicioCursos.actualizarCurso(curso);
      }
    });
  }

  eliminarArchivoDeCursos(idArchivo: number): void {
    const cursos = this.servicioCursos.obtenerCursos();

    cursos.forEach(curso => {
      const archivoExiste = curso.archivos.some(a => a.id === idArchivo);
      if (archivoExiste) {
        curso.archivos = curso.archivos.filter(a => a.id !== idArchivo);
        this.servicioCursos.actualizarCurso(curso);
      }
    });
  }

  obtenerCursosConArchivo(idArchivo: number): Curso[] {
    const cursos = this.servicioCursos.obtenerCursos();
    return cursos.filter(curso =>
      curso.archivos.some(archivo => archivo.id === idArchivo)
    );
  }

  // Métodos para procesar archivos
  async procesarArchivoSeleccionado(evento: any): Promise<{ archivo: File | null; error: string | null }> {
    const archivo = evento.target.files[0];

    if (!archivo) {
      return { archivo: null, error: 'No se seleccionó ningún archivo.' };
    }

    if (!this.esArchivoValido(archivo)) {
      this.limpiarInputArchivo();
      return { archivo: null, error: 'Por favor, selecciona un archivo PDF o PPTX válido.' };
    }

    return { archivo, error: null };
  }

  esArchivoValido(archivo: File): boolean {
    const tiposPermitidos = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    const extensionesPermitidas = ['.pdf', '.pptx'];

    const extension = '.' + (archivo.name.split('.').pop()?.toLowerCase() || '');
    return tiposPermitidos.includes(archivo.type) ||
      (!!extension && extensionesPermitidas.includes(extension));
  }

  // Métodos de formato y visualización
  eliminarExtension(nombreArchivo: string): string {
    return nombreArchivo.replace(/\.[^/.]+$/, "");
  }

  obtenerTamanoLegible(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const tamanos = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamanos[i];
  }

  obtenerTipoArchivoLegible(tipo: string, nombreArchivo: string): string {
    if (tipo === 'pdf' || nombreArchivo.toLowerCase().endsWith('.pdf')) {
      return 'PDF Document';
    } else if (tipo === 'pptx' || nombreArchivo.toLowerCase().endsWith('.pptx')) {
      return 'PowerPoint Presentation';
    } else {
      return 'Archivo';
    }
  }

  obtenerTipoArchivoLegibleParaArchivo(archivo: Archivo): string {
    if (archivo.tipo === 'PDF' || archivo.nombre.toLowerCase().endsWith('.pdf')) {
      return 'PDF Document';
    } else if (archivo.tipo === 'PPTX' || archivo.nombre.toLowerCase().endsWith('.pptx')) {
      return 'PowerPoint Presentation';
    } else {
      return 'Archivo';
    }
  }

  formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  obtenerTamanoArchivoLegible(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const tamanos = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamanos[i];
  }

  // Métodos de compatibilidad (para cursos) - este es el método que NO debe estar en el servicio
  obtenerArchivosLista(): Archivo[] {
    return [...this.archivos];
  }

  obtenerArchivoPorIdLocal(id: number): Archivo | undefined {
    return this.archivos.find(archivo => archivo.id === id);
  }

  sincronizarArchivosDesdeCursos(cursos: Curso[]): void {
    const archivosDeCursos: Archivo[] = [];

    cursos.forEach(curso => {
      curso.archivos.forEach(archivo => {
        const existe = this.archivos.some(a =>
          a.id === archivo.id ||
          (a.nombre === archivo.nombre && a.tipo === archivo.tipo && a.usuario === archivo.usuario)
        );

        if (!existe) {
          archivosDeCursos.push(archivo);
        } else {
          const indice = this.archivos.findIndex(a => a.id === archivo.id);
          if (indice !== -1) {
            this.archivos[indice] = { ...this.archivos[indice], ...archivo };
          }
        }
      });
    });

    archivosDeCursos.forEach(archivo => {
      const nuevoArchivo: Archivo = {
        ...archivo,
        id: archivo.id
      };

      if (!this.archivos.some(a => a.id === nuevoArchivo.id)) {
        this.archivos.push(nuevoArchivo);
      }
    });

    this.guardarArchivos();
  }

  // Métodos privados
  private cargarArchivosDesdeStorage(): void {
    const archivosGuardados = localStorage.getItem('archivos');
    if (archivosGuardados) {
      this.archivos = JSON.parse(archivosGuardados).map((archivo: any) => ({
        ...archivo,
        fechaSubida: new Date(archivo.fechaSubida)
      }));
      this.limpiarDuplicados();
    }
  }

  private guardarArchivos(): void {
    localStorage.setItem('archivos', JSON.stringify(this.archivos));
  }

  private limpiarInputArchivo(): void {
    const inputArchivo = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (inputArchivo) inputArchivo.value = '';
  }

  private abrirPDFEnNuevaPestana(url: string, nombreArchivo: string): void {
    const ventana = window.open('', '_blank');
    if (ventana) {
      ventana.document.write(`
        <html>
          <head>
            <title>Visualizador de PDF - ${nombreArchivo}</title>
            <style>
              body { margin: 0; padding: 20px; background: #f5f5f7; }
              .contenedor { max-width: 100%; height: calc(100vh - 40px); }
              embed { width: 100%; height: 100%; border: none; }
            </style>
          </head>
          <body>
            <div class="contenedor">
              <embed src="${url}" type="application/pdf">
            </div>
          </body>
        </html>
      `);
      ventana.document.close();
    } else {
      this.descargarArchivoDesdeUrl(url, nombreArchivo);
    }
  }

  private descargarArchivoDesdeUrl(url: string, nombreArchivo: string): void {
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    enlace.style.display = 'none';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private limpiarDuplicados(): void {
    const archivosUnicos: Archivo[] = [];
    const idsVistos = new Set<number>();

    for (const archivo of this.archivos) {
      if (!idsVistos.has(archivo.id)) {
        idsVistos.add(archivo.id);
        archivosUnicos.push(archivo);
      }
    }

    this.archivos = archivosUnicos;
    this.guardarArchivos();
  }
}