import { Injectable } from '@angular/core';
import { ServicioAlmacenamientoSession } from './servicio-almacenamiento-session';
import { Curso, ServicioCursos } from './servicio-cursos';

export interface Archivo {
  id: number;
  nombre: string;
  tipo: string;
  tamano: number;
  fechaSubida: Date;
  descripcion: string;
  usuario: string;
  estado: 'Disponible' | 'NoDisponible';
  archivoId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServicioArchivos {
  private archivos: Archivo[] = [];
  private readonly ARCHIVOS = 'archivos_agropetech';

  constructor(
    private almacenamientoSession: ServicioAlmacenamientoSession,
    private servicioCursos: ServicioCursos
  ) {
    this.cargarArchivos();
    this.inicializarDatos();
  }

  //  MÉTODOS DE CARGA Y GUARDADO 

  private cargarArchivos(): void {
    const archivosGuardados = localStorage.getItem(this.ARCHIVOS);
    if (archivosGuardados) {
      this.archivos = JSON.parse(archivosGuardados).map((archivo: any) => ({
        ...archivo,
        fechaSubida: new Date(archivo.fechaSubida)
      }));
      this.limpiarDuplicados();
    }
  }

  private inicializarDatos(): void {
    if (this.archivos.length === 0) {
      this.archivos = [
        {
          id: 101,
          nombre: "Manual Riego por Goteo",
          tipo: "PDF",
          tamano: 855000,
          fechaSubida: new Date('2025-09-20'),
          descripcion: "Guía práctica para sistemas de riego localizado.",
          usuario: "leslie@gmail.com",
          estado: "Disponible"
        },
        {
          id: 102,
          nombre: "Poda Tomate",
          tipo: "PDF",
          tamano: 855000,
          fechaSubida: new Date('2025-09-20'),
          descripcion: "Tutorial sobre las técnicas de poda para cultivo de tomate.",
          usuario: "leslie@gmail.com",
          estado: "Disponible"
        },
        {
          id: 103,
          nombre: "Plantilla Ficha Suelo",
          tipo: "PDF",
          tamano: 855000,
          fechaSubida: new Date('2025-09-20'),
          descripcion: "Cálculo para el registro de análisis de suelos.",
          usuario: "leslie@gmail.com",
          estado: "Disponible"
        },
        {
          id: 104,
          nombre: "Presentación Sanidad",
          tipo: "PPTX",
          tamano: 855000,
          fechaSubida: new Date('2025-09-20'),
          descripcion: "Archivos sobre el control de plagas y enfermedades comunes.",
          usuario: "leslie@gmail.com",
          estado: "NoDisponible"
        },
        {
          id: 105,
          nombre: "Certificado Curso Base",
          tipo: "PPTX",
          tamano: 855000,
          fechaSubida: new Date('2025-09-20'),
          descripcion: "Certificados de módulos básicos.",
          usuario: "leslie@gmail.com",
          estado: "Disponible"
        }
      ];
      this.guardarArchivos();
    }
  }

  private guardarArchivos(): void {
    localStorage.setItem(this.ARCHIVOS, JSON.stringify(this.archivos));
  }

  //  MÉTODOS CRUD BÁSICOS 

  obtenerArchivos(): Archivo[] {
    return [...this.archivos];
  }

  obtenerArchivosPorId(id: number): Archivo | undefined {
    return this.archivos.find(archivo => archivo.id === id);
  }

  agregarArchivo(archivo: Omit<Archivo, 'id'>): void {
    const nuevoId = this.archivos.length > 0 ? Math.max(...this.archivos.map(a => a.id)) + 1 : 1;
    const nuevoArchivo: Archivo = {
      ...archivo,
      id: nuevoId
    };
    this.archivos.push(nuevoArchivo);
    this.guardarArchivos();
  }

  actualizarArchivo(id: number, archivoActualizado: Partial<Archivo>): void {
    const indice = this.archivos.findIndex(archivo => archivo.id === id);
    if (indice !== -1) {
      this.archivos[indice] = { ...this.archivos[indice], ...archivoActualizado };
      this.guardarArchivos();
    }
  }

  eliminarArchivo(id: number): void {
    this.archivos = this.archivos.filter(archivo => archivo.id !== id);
    this.guardarArchivos();
  }

  //  MÉTODOS DE PROCESAMIENTO DE ARCHIVOS 

  async procesarArchivoSeleccionado(evento: any): Promise<{ archivo: File | null; error: string | null }> {
    const archivo = evento.target.files[0];

    if (!archivo) {
      return { archivo: null, error: 'No se seleccionó ningún archivo.' };
    }

    if (!this.esArchivoValido(archivo)) {
      this.limpiarInputArchivo();
      return { archivo: null, error: 'Por favor, selecciona un archivo PDF o PPTX válido.' };
    }

    if (!this.almacenamientoSession.verificarEspacioDisponible(archivo.size)) {
      this.limpiarInputArchivo();
      return { archivo: null, error: 'El archivo es demasiado grande para el almacenamiento temporal. Por favor, use un archivo más pequeño.' };
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

  private limpiarInputArchivo(): void {
    const inputArchivo = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (inputArchivo) inputArchivo.value = '';
  }

  //  MÉTODOS DE SUBIDA Y DESCARGA 

  async subirArchivo(
    archivoSeleccionado: File,
    cursoSeleccionado: any,
    modoEdicion: boolean,
    cursoEditando: any,
    ArchivoEditando: Archivo | null,
    usuario: string
  ): Promise<{
    exito: boolean;
    mensaje: string;
    Archivo?: Archivo;
    necesitaActualizar?: boolean;
  }> {

    if (!cursoSeleccionado && !modoEdicion) {
      return {
        exito: false,
        mensaje: 'Por favor, selecciona un curso antes de subir Archivos.'
      };
    }

    try {
      const idArchivo = `archivo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      await this.almacenamientoSession.guardarArchivoBlob(idArchivo, archivoSeleccionado);

      const nuevaArchivo: Archivo = {
        id: Date.now(),
        nombre: this.eliminarExtension(archivoSeleccionado.name),
        tipo: archivoSeleccionado.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'PPTX',
        tamano: archivoSeleccionado.size,
        fechaSubida: new Date(),
        descripcion: `Archivo: ${this.eliminarExtension(archivoSeleccionado.name)}`,
        usuario: usuario,
        estado: 'Disponible',
        archivoId: idArchivo
      };

      if (modoEdicion && cursoEditando && ArchivoEditando) {
        await this.actualizarArchivoExistente(ArchivoEditando, idArchivo);
        return {
          exito: true,
          mensaje: `Archivo "${nuevaArchivo.id}" actualizado exitosamente.`,
          necesitaActualizar: true
        };
      } else {
        return {
          exito: true,
          mensaje: `Archivo "${nuevaArchivo.nombre}" agregada exitosamente al curso "${cursoSeleccionado?.titulo}".`,
          Archivo: nuevaArchivo,
          necesitaActualizar: false
        };
      }

    } catch (error) {
      console.error('Error al subir archivo:', error);
      return {
        exito: false,
        mensaje: 'Error al subir el archivo. Por favor, intente nuevamente.'
      };
    }
  }

  private async actualizarArchivoExistente(
    ArchivoEditando: Archivo,
    nuevoArchivoId: string
  ): Promise<void> {
    if (ArchivoEditando.archivoId) {
      try {
        await this.almacenamientoSession.borrarArchivo(ArchivoEditando.archivoId);
      } catch (error) {
        console.warn('No se pudo eliminar el archivo anterior:', error);
      }
    }
  }

  async eliminarArchivoDeArchivo(Archivo: Archivo): Promise<{ exito: boolean; mensaje: string }> {
    try {
      if (Archivo.archivoId) {
        await this.almacenamientoSession.borrarArchivo(Archivo.archivoId);
      }

      return {
        exito: true,
        mensaje: 'Archivo de Archivo eliminado exitosamente.'
      };
    } catch (error) {
      console.error('Error al eliminar archivo de Archivo:', error);
      return {
        exito: false,
        mensaje: 'Error al eliminar el archivo de la Archivo. Por favor, intente nuevamente.'
      };
    }
  }

  //  MÉTODOS DE VISUALIZACIÓN 

  async visualizarArchivo(archivo: Archivo): Promise<{ exito: boolean; mensaje: string }> {
    if (!archivo.archivoId) {
      return { exito: false, mensaje: 'No hay archivo asociado para previsualizar.' };
    }

    try {
      const blob = await this.almacenamientoSession.obtenerArchivoBlob(archivo.archivoId);
      if (!blob) {
        return { exito: false, mensaje: 'Archivo no encontrado.' };
      }

      this.visualizarArchivoDesdeBlob(blob, archivo.nombre);
      return { exito: true, mensaje: 'Archivo cargado correctamente.' };

    } catch (error) {
      console.error('Error al visualizar archivo:', error);
      return { exito: false, mensaje: 'Error al cargar el archivo para visualización.' };
    }
  }

  visualizarArchivoDesdeBlob(blob: Blob, nombreArchivo: string): void {
    const url = URL.createObjectURL(blob);

    if (blob.type.includes('pdf') || nombreArchivo.toLowerCase().endsWith('.pdf')) {
      this.abrirPDFEnNuevaPestana(url, nombreArchivo);
    } else if (blob.type.includes('presentation') || nombreArchivo.toLowerCase().endsWith('.pptx')) {
      this.manejarVisualizacionPPTX(blob, nombreArchivo, url);
    } else {
      this.mostrarOpcionesDescarga(url, nombreArchivo);
    }
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
              .advertencia { 
                background: #fff3cd; 
                border: 1px solid #ffeaa7; 
                padding: 10px; 
                margin-bottom: 10px; 
                border-radius: 5px;
                color: #856404;
              }
            </style>
          </head>
          <body>
            <div class="advertencia">
              <strong>Nota:</strong> Si el PDF no se muestra, puede ser debido a la configuración de tu navegador. 
              Puedes <a href="${url}" download="${nombreArchivo}">descargar el archivo</a> para verlo localmente.
            </div>
            <div class="contenedor">
              <embed src="${url}" type="application/pdf">
            </div>
            <script>
              window.addEventListener('beforeunload', function() {
                URL.revokeObjectURL('${url}');
              });
            </script>
          </body>
        </html>
      `);
      ventana.document.close();
    } else {
      this.descargarArchivoDesdeUrl(url, nombreArchivo);
    }
  }

  private manejarVisualizacionPPTX(blob: Blob, nombreArchivo: string, url: string): void {
    const opcion = window.confirm(
      `Para ver el archivo PPTX "${nombreArchivo}", necesitas descargarlo y abrirlo con Microsoft PowerPoint o un visor compatible.\n\n` +
      `¿Quieres descargar el archivo ahora?\n\n` +
      `Presiona "Aceptar" para descargar o "Cancelar" para intentar abrirlo en el visor online (puede no funcionar).`
    );

    if (opcion) {
      this.descargarArchivoDesdeBlob(blob, nombreArchivo);
    } else {
      this.intentarGoogleDocsViewer(blob, nombreArchivo, url);
    }
  }

  private intentarGoogleDocsViewer(blob: Blob, nombreArchivo: string, url: string): void {
    const usarGoogleDocs = window.confirm(
      `El visor online de Microsoft Office no puede acceder a archivos locales.\n\n` +
      `Alternativa: Puedes subir el archivo a Google Drive y abrirlo allí, o descargarlo y usar PowerPoint.\n\n` +
      `¿Prefieres descargar el archivo ahora?`
    );

    if (usarGoogleDocs) {
      const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
      const ventana = window.open(googleDocsUrl, '_blank');

      setTimeout(() => {
        if (!ventana || ventana.closed) {
          this.descargarArchivoDesdeBlob(blob, nombreArchivo);
        }
      }, 2000);
    } else {
      this.descargarArchivoDesdeBlob(blob, nombreArchivo);
    }
  }

  private mostrarOpcionesDescarga(url: string, nombreArchivo: string): void {
    const confirmar = window.confirm(
      `El archivo "${nombreArchivo}" no se puede previsualizar directamente. ¿Desea descargarlo?`
    );

    if (confirmar) {
      this.descargarArchivoDesdeUrl(url, nombreArchivo);
    }
  }

  //  MÉTODOS DE DESCARGA 

  async descargarArchivoDeArchivo(Archivo: Archivo): Promise<{ exito: boolean; mensaje: string }> {
    if (!Archivo.archivoId) {
      return { exito: false, mensaje: 'No hay archivo para descargar.' };
    }

    try {
      const blob = await this.almacenamientoSession.obtenerArchivoBlob(Archivo.archivoId);
      if (!blob) {
        return { exito: false, mensaje: 'Archivo no encontrado.' };
      }

      this.descargarArchivoDesdeBlob(blob, Archivo.archivoId);
      return { exito: true, mensaje: 'Descarga iniciada correctamente.' };

    } catch (error) {
      console.error('Error al descargar archivo:', error);
      return { exito: false, mensaje: 'Error al cargar el archivo para descarga.' };
    }
  }

  descargarArchivoDesdeBlob(blob: Blob, nombreArchivo: string): void {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    enlace.style.display = 'none';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    setTimeout(() => URL.revokeObjectURL(url), 1000);
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

  //  MÉTODOS DE INTEGRACIÓN CON CURSOS 

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

  actualizarArchivoCompleto(id: number, archivoActualizado: Partial<Archivo>): void {
    this.actualizarArchivo(id, archivoActualizado);
    const archivoCompleto = this.obtenerArchivosPorId(id);
    if (archivoCompleto) {
      this.actualizarArchivoEnCursos({ ...archivoCompleto, ...archivoActualizado });
    }
  }

  eliminarArchivoCompleto(id: number): void {
    this.eliminarArchivo(id);
    this.eliminarArchivoDeCursos(id);
    const archivo = this.obtenerArchivosPorId(id);
    if (archivo?.archivoId) {
      this.almacenamientoSession.borrarArchivo(archivo.archivoId)
        .catch(error => console.warn('No se pudo eliminar el archivo físico:', error));
    }
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

  obtenerTodosLosArchivos(): Archivo[] {
    const archivosUnicos = this.archivos.filter((archivo, index, self) =>
      index === self.findIndex(a => a.id === archivo.id)
    );
    return archivosUnicos;
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

  eliminarExtension(nombreArchivo: string): string {
    return nombreArchivo.replace(/\.[^/.]+$/, "");
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

  obtenerTipoArchivoLegible(tipo: string, nombreArchivo: string): string {
    if (tipo === 'pdf' || nombreArchivo.toLowerCase().endsWith('.pdf')) {
      return 'PDF Document';
    } else if (tipo === 'pptx' || nombreArchivo.toLowerCase().endsWith('.pptx')) {
      return 'PowerPoint Presentation';
    } else {
      return 'Archivo';
    }
  }

  obtenerTamanoLegible(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const tamanos = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamanos[i];
  }

  private archivoExiste(archivo: Archivo): boolean {
    return this.archivos.some(a =>
      a.id === archivo.id ||
      (a.nombre === archivo.nombre && a.tipo === archivo.tipo && a.usuario === archivo.usuario)
    );
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