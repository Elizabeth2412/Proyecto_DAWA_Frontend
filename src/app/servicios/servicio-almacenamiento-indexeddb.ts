import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ServicioAlmacenamientoIndexedDB {
  private nombreBD = 'agropetech_archivos_bd';
  private nombreAlmacen = 'archivos';
  private versionBD = 1;
  private promesaBD: Promise<IDBDatabase>;

  constructor() {
    this.promesaBD = this.abrirBaseDatos();
  }

  private abrirBaseDatos(): Promise<IDBDatabase> {
    return new Promise((resolver, rechazar) => {
      const solicitud = indexedDB.open(this.nombreBD, this.versionBD);
      solicitud.onerror = () => rechazar(solicitud.error);
      solicitud.onsuccess = () => resolver(solicitud.result);
      solicitud.onupgradeneeded = (evento: IDBVersionChangeEvent) => {
        const bd = (evento.target as IDBOpenDBRequest).result;
        if (!bd.objectStoreNames.contains(this.nombreAlmacen)) {
          bd.createObjectStore(this.nombreAlmacen, { keyPath: 'id' });
        }
      };
    });
  }

  async guardarArchivoBlob(id: string, archivo: Blob): Promise<void> {
    const bd = await this.promesaBD;
    return new Promise((resolver, rechazar) => {
      const transaccion = bd.transaction(this.nombreAlmacen, 'readwrite');
      const almacen = transaccion.objectStore(this.nombreAlmacen);
      const elemento = { id, archivo, creado: Date.now() };
      const solicitud = almacen.put(elemento);
      solicitud.onsuccess = () => resolver();
      solicitud.onerror = () => rechazar(solicitud.error);
    });
  }

  async obtenerArchivoBlob(id: string): Promise<Blob | null> {
    const bd = await this.promesaBD;
    return new Promise((resolver, rechazar) => {
      const transaccion = bd.transaction(this.nombreAlmacen, 'readonly');
      const almacen = transaccion.objectStore(this.nombreAlmacen);
      const solicitud = almacen.get(id);
      solicitud.onsuccess = () => {
        const resultado = solicitud.result;
        resolver(resultado ? resultado.archivo as Blob : null);
      };
      solicitud.onerror = () => rechazar(solicitud.error);
    });
  }

  async borrarArchivo(id: string): Promise<void> {
    const bd = await this.promesaBD;
    return new Promise((resolver, rechazar) => {
      const transaccion = bd.transaction(this.nombreAlmacen, 'readwrite');
      const almacen = transaccion.objectStore(this.nombreAlmacen);
      const solicitud = almacen.delete(id);
      solicitud.onsuccess = () => resolver();
      solicitud.onerror = () => rechazar(solicitud.error);
    });
  }

  async listarIds(): Promise<string[]> {
    const bd = await this.promesaBD;
    return new Promise((resolver, rechazar) => {
      const transaccion = bd.transaction(this.nombreAlmacen, 'readonly');
      const almacen = transaccion.objectStore(this.nombreAlmacen);
      const solicitud = almacen.getAllKeys();
      solicitud.onsuccess = () => resolver(solicitud.result as string[]);
      solicitud.onerror = () => rechazar(solicitud.error);
    });
  }
}