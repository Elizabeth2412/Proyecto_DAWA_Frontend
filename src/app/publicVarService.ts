// src/app/publicVarService.ts
import { Injectable } from '@angular/core'; 
import { BehaviorSubject, Observable } from 'rxjs'; 
import { Usuario } from './interfaces/usuario-interface';
@Injectable({ 
  providedIn: 'root'   
}) 
export class PublicVarService { 
  private data_inicial: Usuario = {
    email: '*',
    password: '',
    tipo: 'estudiante',
    nombre: '*',
    apellido: '',
    edad: 0
  }; 
 
  public logeado$ = new BehaviorSubject<boolean>(false); 
  public datosRegistro$ = new BehaviorSubject<any>(this.data_inicial); 
  public datosActualizar$ = new BehaviorSubject<any>(this.data_inicial); 
 
  constructor() { } 
  
  // Métodos para obtener observables
  getLogeadoObservable(): Observable<boolean> {
    return this.logeado$.asObservable();
  }
  
  getDatosRegistroObservable(): Observable<any> {
    return this.datosRegistro$.asObservable();
  }
  
  getDatosActualizarObservable(): Observable<any> {
    return this.datosActualizar$.asObservable();
  }
  
  // Métodos para actualizar valores
  actualizarEstadoLogin(estado: boolean): void {
    this.logeado$.next(estado);
  }
  
  actualizarDatosRegistro(datos: any): void {
    this.datosRegistro$.next(datos);
  }
  
  actualizarDatosActualizar(datos: any): void {
    this.datosActualizar$.next(datos);
  }
}