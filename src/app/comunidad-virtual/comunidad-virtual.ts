import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Foro } from '../interfaces/foro-interface';
import { ServicioForos } from '../servicios/servicio-foros';
import { ServicioAutorizacion } from '../autorizacion.service';
/**
 * Interface que contiene los datos de Foro
 */

@Component({
  selector: 'app-comunidad-virtual',
  imports: [FormsModule,CommonModule],
  templateUrl: './comunidad-virtual.html',
  styleUrl: './comunidad-virtual.css',
})
export class ComunidadVirtual {


  constructor(private router: Router,private servicioForos: ServicioForos,private servicioAutorizacion: ServicioAutorizacion) {}
  foros: Foro[] = [];
  forosFiltrados: Foro[] = [];
  txtBusqueda: string = '';
  
  isNewForoOpen:   boolean = false;
  isEditForoOpen:  boolean = false;
  isDeleteForoOpen:boolean = false;
  
  foroSelect: Foro | null = null;
  archivoSeleccionado: File | null = null

  isDetalleForoOpen: boolean = false;
  imagenPreview: string | null = null;

  nuevoForo = {
    titulo: '',
    contenido: ''
  };

  ngOnInit(): void {
    this.cargarForos();
  }

  /*
    * Carga la lista de foros desde el servicio y los asigna a la variable de foros filtrados
  */
  cargarForos(): void {
    this.servicioForos.listar().subscribe(res => {
      if (res.respuesta === 'Ok' && res.data) {
        // Mapear datos del backend a la interfaz Foro
        this.foros = res.data.map((p: any) => ({
          Id: p.id,
          Titulo: p.titulo,
          Contenido: p.contenido,
          Autor: p.nombreAutor || 'Anónimo',
          FechaHora: this.formatDate(new Date(p.fechaCreacion)),
          Replicas: p.numeroRespuestas || 0,
          UrlImagen: p.urlImagen
        }));
        this.forosFiltrados = [...this.foros];
      }
    });
  }
  
  /**
   * Filtra los foros según el término de búsqueda ingresado por el usuario.
   * Busca coincidencias tanto en el título como en el contenido del foro.
   */
  buscarForo(): void {
    const term = this.txtBusqueda.toLowerCase().trim();
    
    if (!term) {
      this.forosFiltrados = [...this.foros];
      return;
    }
    
    this.forosFiltrados = this.foros.filter(foro =>
      foro.Titulo.toLowerCase().includes(term) ||
      foro.Contenido.toLowerCase().includes(term)
    );
  }

  /**
   * Abre el modal para crear un nuevo foro y resetea el formulario
   */
  view_newForo(): void {
    this.resetForm();
    this.isNewForoOpen = true;
  }

  /**
   * Abre el modal de edición y carga los datos del foro seleccionado en el formulario
   * @param forum Foro que se desea editar
   */
  view_editForo(forum: Foro): void {
    this.foroSelect = forum;
    this.nuevoForo = {
      titulo: forum.Titulo,
      contenido: forum.Contenido
    };
    this.archivoSeleccionado = null;
    this.isEditForoOpen = true;
  }

  /**
   * Abre el modal de confirmación para eliminar un foro
   * @param forum Foro que se desea eliminar
   */
  view_deleteForo(forum: Foro): void {
    this.foroSelect = forum;
    this.isDeleteForoOpen = true;
  }

  /**
   * Cierra todos los modales abiertos, limpia el foro seleccionado y resetea el formulario
   */
  cerrarVentanas(): void {
    this.isNewForoOpen = false;
    this.isEditForoOpen = false;
    this.isDeleteForoOpen = false;
    this.isDetalleForoOpen = false;
    this.foroSelect = null;
    this.resetForm();
  }

  /**
   * Limpia todos los campos del formulario de nuevo foro
   */
  resetForm(): void {
    this.nuevoForo = {
      titulo: '',
      contenido: ''
    };
    this.archivoSeleccionado = null;
    this.imagenPreview = null;
  }

  /**
   * Crea un nuevo foro con los datos del formulario y lo agrega al inicio de la lista.
   * Valida que los campos requeridos no estén vacíos antes de crear.
   */
  createForum(): void {
    if (!this.nuevoForo.titulo || !this.nuevoForo.contenido) {
      return;
    }
    const usuario = this.servicioAutorizacion.obtenerUsuarioActual();
    if (!usuario || !usuario.id) {
      alert('Debe iniciar sesión para crear un foro');
      return;
    }
    console.log('👤 Usuario obtenido:', usuario);
    console.log('👤 ID del usuario:', usuario?.id);
    const fd = new FormData();
    fd.append('publicacion.Titulo', this.nuevoForo.titulo);
    fd.append('publicacion.Contenido', this.nuevoForo.contenido);
    fd.append('publicacion.UsuarioCreacionId', usuario.id.toString());

    if (this.archivoSeleccionado) {
      fd.append('archivo.Archivo', this.archivoSeleccionado);
    }
    // 🔍 LOG 2: Verificar FormData
  console.log('📦 FormData a enviar:');
  fd.forEach((value, key) => {
    console.log(`  ${key}:`, value);
  });

    this.servicioForos.crear(fd).subscribe({
      next: (res) => {
        if (res.respuesta === 'Ok') {
          this.cargarForos();
          this.cerrarVentanas();
        } else {
          console.error('Error al crear:', res.leyenda);
          alert(res.leyenda);
        }
      },
      error: (err) => {
        console.error('Error:', err);
        alert('Error al crear el foro');
      }
    });
  }

  /**
   * Edita el foro, en sus campos titulo y contenido
   * @returns 
   */
  editForum(): void {
    if (!this.foroSelect || !this.isForoValido()) {return;}

    const fd = new FormData();

    fd.append('publicacion.Id', this.foroSelect.Id.toString());
    fd.append('publicacion.Titulo', this.foroSelect.Titulo);
    fd.append('publicacion.Contenido', this.foroSelect.Contenido);
    fd.append('publicacion.UsuarioModificacionId', '1');//id del usuario logueado
    
    // Si hay imagen actual y NO hay nueva imagen, mantener la actual
    if (this.foroSelect.UrlImagen && !this.archivoSeleccionado) {
      fd.append('publicacion.UrlImagen', this.foroSelect.UrlImagen);
    }

    // Si hay nueva imagen, enviarla
    if (this.archivoSeleccionado) {
      fd.append('archivo.Archivo', this.archivoSeleccionado);
      // Enviar URL anterior para que el backend la elimine
      if (this.foroSelect.UrlImagen) {
        fd.append('publicacion.UrlImagen', this.foroSelect.UrlImagen);
      }
    }

    this.servicioForos.actualizar(fd).subscribe({
      next: (res) => {
        if (res.respuesta === 'Ok') {
          this.cargarForos();
          this.cerrarVentanas();
        } else {
          console.error('Error al actualizar:', res.leyenda);
          alert(res.leyenda);
        }
      },
      error: (err) => {
        console.error('Error:', err);
        alert('Error al actualizar el foro');
      }
    });
  }

  /**
   * Eliminar un foro.
   * @returns void
   */
  deleteForo(): void {
    if (!this.foroSelect) return;

    const body = {
      id: this.foroSelect.Id,
      usuarioEliminacionId: 1, // ← ID del usuario logueado
      urlImagen: this.foroSelect.UrlImagen // Para eliminar imagen de MinIO
    };

    this.servicioForos.eliminar(body).subscribe({
      next: (res) => {
        if (res.respuesta === 'Ok') {
          this.cargarForos();
          this.cerrarVentanas();
        } else {
          console.error('Error al eliminar:', res.leyenda);
          alert(res.leyenda);
        }
      },
      error: (err) => {
        console.error('Error:', err);
        alert('Error al eliminar el foro');
      }
    });
  }

   /**
    * Abre el modal de detalle del foro
    */
  view_detalleForo(foro: Foro): void {
    this.foroSelect = foro;
    this.isDetalleForoOpen = true;
  }
  /**
   * Maneja la selección de imagen y genera preview
   */
  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado = file;
      
      // Generar preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Elimina la imagen seleccionada
   */
  removeImage(fileInput: HTMLInputElement): void {
    this.archivoSeleccionado = null;
    this.imagenPreview = null;
    fileInput.value = '';
  }

  /**
   * Verifica si los campos del formulario de nuevoForo no esta vacio y/o en blanco
   * @returns Si es valido el foro
   */
  isForoValido(): boolean {
    return this.nuevoForo.titulo.trim() !== '' && this.nuevoForo.contenido.trim() !== '';
  }

  /**
   * Se encarga de darle formato a la hora y fecha que recibe.
   * @param date Fecha a la que se le dara formato
   * @returns Fecha con formato adecuado
   */
  private formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Intl.DateTimeFormat('es-ES', options).format(date);
  }
}
function obtenerUsuarioActual() {
  throw new Error('Function not implemented.');
}

