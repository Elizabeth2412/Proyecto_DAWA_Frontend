import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ServicioArchivos {

  constructor() { }

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

  visualizarArchivoDesdeBlob(blob: Blob, nombreArchivo: string): void {
    const url = URL.createObjectURL(blob);
    
    if (blob.type.includes('pdf') || nombreArchivo.toLowerCase().endsWith('.pdf')) {
      // Para PDF: abrir en nueva pestaña con embed
      this.abrirPDFEnNuevaPestana(url, nombreArchivo);
    } else if (blob.type.includes('presentation') || nombreArchivo.toLowerCase().endsWith('.pptx')) {
      // Para PPTX: ofrecer descarga o usar alternativa
      this.manejarVisualizacionPPTX(blob, nombreArchivo, url);
    } else {
      // Para otros tipos, ofrecer descarga
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
              // Revocar la URL cuando se cierre la ventana
              window.addEventListener('beforeunload', function() {
                URL.revokeObjectURL('${url}');
              });
            </script>
          </body>
        </html>
      `);
      ventana.document.close();
    } else {
      // Si no se puede abrir ventana, ofrecer descarga
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
      // Intentar con Google Docs Viewer como alternativa
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
      
      // Si no se abre correctamente, ofrecer descarga después de 2 segundos
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

  private descargarArchivoDesdeUrl(url: string, nombreArchivo: string): void {
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    enlace.style.display = 'none';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    
    // Revocar la URL después de un tiempo
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
    
    // Revocar la URL después de un tiempo
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  obtenerTamañoArchivoLegible(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const tamanos = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamanos[i];
  }

  // Nuevo método para obtener el tipo de archivo legible
  obtenerTipoArchivoLegible(tipo: string, nombreArchivo: string): string {
    if (tipo === 'pdf' || nombreArchivo.toLowerCase().endsWith('.pdf')) {
      return 'PDF Document';
    } else if (tipo === 'pptx' || nombreArchivo.toLowerCase().endsWith('.pptx')) {
      return 'PowerPoint Presentation';
    } else {
      return 'Archivo';
    }
  }
}