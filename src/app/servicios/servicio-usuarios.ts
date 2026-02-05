// src/app/servicios/servicio-usuarios.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../environments/environment.development';
import { Usuario } from '../interfaces/usuario-interface';

@Injectable({
  providedIn: 'root'
})
export class ServicioUsuarios {
  private baseUrl = environment.apiURL;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los usuarios del sistema desde backend
   */
   obtenerTodosUsuarios(): Observable<Usuario[]> {
    const requestBody = {
      transaccion: 'CONSULTAR_USUARIO'
    };
    
    console.log('Obteniendo usuarios, URL:', `${this.baseUrl}/api/Usuario/GetUsuario`);
    console.log('Request body:', requestBody);
    
    return this.http.post<any>(`${this.baseUrl}/Usuario/GetUsuario`, requestBody).pipe(
      map(response => {
        console.log('Respuesta completa del backend:', response);
        
        // Verificar estructura de respuesta
        if (response && response.respuesta === 'Ok') {
          if (response.data && Array.isArray(response.data)) {
            // Mapear los datos de respuesta a la interfaz Usuario
            const usuariosMapeados = response.data.map((user: any) => ({
              email: user.email || '',
              tipo: user.tipo || 'estudiante',
              nombre: user.nombre || '',
              apellido: user.apellido || '',
              edad: user.edad || 0,
              id: user.id || 0
            })) as Usuario[];
            
            console.log('Usuarios mapeados:', usuariosMapeados);
            return usuariosMapeados;
          } else {
            console.warn('La propiedad data no es un array o no existe:', response.data);
          }
        } else {
          console.warn('Respuesta no exitosa del backend:', response);
        }
        return [];
      }),
      catchError(error => {
        console.error('Error al obtener usuarios:', error);
        return throwError(() => new Error('Error al cargar usuarios del servidor: ' + error.message));
      })
    );
  }

  /**
   * Obtiene un usuario por su email desde backend
   */
  obtenerUsuarioPorEmail(email: string): Observable<Usuario | null> {
    const requestBody = {
      email: email,
      transaccion: 'BUSCAR_USUARIO'
    };
    
    return this.http.post<any>(`${this.baseUrl}/api/Usuario/GetUsuario`, requestBody).pipe(
      map(response => {
        if (response && response.respuesta === 'Ok' && response.data && response.data.length > 0) {
          const userData = response.data[0];
          return {
            email: userData.email || email,
            tipo: userData.tipo || 'estudiante',
            nombre: userData.nombre || '',
            apellido: userData.apellido || '',
            edad: userData.edad || 0,
            id: userData.id || 0
          } as Usuario;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error al obtener usuario:', error);
        return throwError(() => new Error('Error al buscar usuario: ' + error.message));
      })
    );
  }
  /**
   * Actualiza un usuario existente en backend
   */
  actualizarUsuarioBackend(usuarioData: any): Observable<any> {
    const usuario = {
      ...usuarioData,
      Transaccion: 'ACTUALIZAR_USUARIO'
    };
    
    return this.http.post(`${this.baseUrl}/Usuario/SetUsuario`, usuario);
  }

  /**
   * Elimina un usuario del sistema en backend
   */
  eliminarUsuarioBackend(email: string): Observable<any> {
    const usuario = {
      Email: email,
      Transaccion: 'ELIMINAR_USUARIO'
    };
    
    return this.http.post(`${this.baseUrl}/Usuario/SetUsuario`, usuario);
  }

  /**
   * Obtiene usuarios por tipo desde backend
   */
  obtenerUsuariosPorTipo(tipo: 'administrador' | 'instructor' | 'estudiante'): Observable<Usuario[]> {
    return this.obtenerTodosUsuarios().pipe(
      map(usuarios => usuarios.filter(u => u.tipo === tipo))
    );
  }

  /**
   * Obtiene estadísticas de usuarios
   */
  obtenerEstadisticasUsuarios(): Observable<{
    total: number;
    administradores: number;
    instructores: number;
    estudiantes: number;
  }> {
    return this.obtenerTodosUsuarios().pipe(
      map(usuarios => ({
        total: usuarios.length,
        administradores: usuarios.filter(u => u.tipo === 'administrador').length,
        instructores: usuarios.filter(u => u.tipo === 'instructor').length,
        estudiantes: usuarios.filter(u => u.tipo === 'estudiante').length
      }))
    );
  }

  /**
   * Cambia el tipo de usuario
   */
  cambiarTipoUsuario(email: string, nuevoTipo: 'administrador' | 'instructor' | 'estudiante'): Observable<any> {
    return this.obtenerUsuarioPorEmail(email).pipe(
      map(usuario => {
        if (!usuario) {
          throw new Error('Usuario no encontrado');
        }
        
        const usuarioActualizado = {
          Email: email,
          Nombre: usuario.nombre,
          Apellido: usuario.apellido,
          Edad: usuario.edad,
          Tipo: nuevoTipo,
          Transaccion: 'ACTUALIZAR_USUARIO'
        };
        
        return this.actualizarUsuarioBackend(usuarioActualizado);
      })
    );
  }

  /**
   * Verifica si un email ya está registrado
   */
  existeUsuario(email: string): Observable<boolean> {
    return this.obtenerUsuarioPorEmail(email).pipe(
      map(usuario => usuario !== null),
      catchError(() => [false])
    );
  }

  /**
   * Obtiene el número total de usuarios
   */
  obtenerTotalUsuarios(): Observable<number> {
    return this.obtenerTodosUsuarios().pipe(
      map(usuarios => usuarios.length)
    );
  }

  /**
   * Valida las credenciales del usuario (para login)
   * Este método ya no se necesita porque se usa el backend directamente
   * Se mantiene solo para compatibilidad
   */
  validarCredenciales(email: string, password: string): Observable<Usuario | null> {
    console.log('Validando credenciales en backend para:', email);
    
    const usuario = {
      Email: email,
      Password: password,
      Transaccion: 'VALIDAR_USUARIO'
    };
    
    return this.http.post<any>(`${this.baseUrl}/Usuario/ValidarLogin`, usuario).pipe(
      map(response => {
        if (response && response.Respuesta === 'Ok' && response.Data && response.Data.Usuario) {
          const userData = response.Data.Usuario;
          return {
            email: userData.Email || email,
            password: password, // Guardar temporalmente
            tipo: userData.Tipo || 'estudiante',
            nombre: userData.Nombre || '',
            apellido: userData.Apellido || '',
            edad: userData.Edad || 0,
            id: userData.Id || 0
          } as Usuario;
        }
        return null;
      })
    );
  }
  
  // Método para login usando JWT (método principal)
  loginBackend(credentials: { email: string, password: string }): Observable<any> {
    const usuario = {
      Email: credentials.email,
      Password: credentials.password,
      Transaccion: 'VALIDAR_USUARIO'
    };
    
    return this.http.post(`${this.baseUrl}/Usuario/ValidarLogin`, usuario, {
      timeout: 10000
    });
  }

  // Método para obtener información del usuario desde backend
  getUsuarioInfoBackend(email: string): Observable<any> {
    const usuario = {
      Email: email,
      Transaccion: 'BUSCAR_USUARIO'
    };
    
    return this.http.post(`${this.baseUrl}/Usuario/GetUsuario`, usuario);
  }

  // Método para registrar usuario en backend
  registrarUsuarioBackend(usuarioData: any): Observable<any> {
    const usuario = {
      ...usuarioData,
      Transaccion: 'INSERTAR_USUARIO'
    };
    
    return this.http.post(`${this.baseUrl}/Usuario/RegistrarUsuario`, usuario);
  }

  /**
   * Busca usuarios por nombre o email
   */
  buscarUsuarios(termino: string): Observable<Usuario[]> {
    return this.obtenerTodosUsuarios().pipe(
      map(usuarios => {
        const terminoLower = termino.toLowerCase();
        return usuarios.filter(u => 
          u.nombre.toLowerCase().includes(terminoLower) ||
          u.email.toLowerCase().includes(terminoLower) ||
          (u.apellido && u.apellido.toLowerCase().includes(terminoLower))
        );
      })
    );
  }
}