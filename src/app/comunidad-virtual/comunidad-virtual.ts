import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
/**
 * Interface que contiene los datos de Foro
 */
export interface Foro {
  id: number;
  titulo: string;
  contenido: string;
  autor: string;
  fechaHora: string;
  replicas: number;
  image?: string | null;
}

@Component({
  selector: 'app-comunidad-virtual',
  imports: [FormsModule,CommonModule],
  templateUrl: './comunidad-virtual.html',
  styleUrl: './comunidad-virtual.css',
})
export class ComunidadVirtual {


  constructor(private router: Router) {}

  forosFiltrados: Foro[] = [];
  txtBusqueda: string = '';
  
  isNewForoOpen:   boolean = false;
  isEditForoOpen:  boolean = false;
  isDeleteForoOpen:boolean = false;
  
  foroSelect: Foro | null = null;
  
  nuevoForo = {
    titulo: '',
    contenido: '',
    image: null as string | null
  };

  ngOnInit(): void {
    this.forosFiltrados = [...this.forosList];
  }

  /**
   * Filtra los foros según el término de búsqueda ingresado por el usuario.
   * Busca coincidencias tanto en el título como en el contenido del foro.
   */
  buscarForo(): void {
    const term = this.txtBusqueda.toLowerCase();
    this.forosFiltrados = this.forosList.filter(forum =>
      forum.titulo.toLowerCase().includes(term) ||
      forum.contenido.toLowerCase().includes(term)
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
      titulo: forum.titulo,
      contenido: forum.contenido,
      image: forum.image || null
    };
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
    this.foroSelect = null;
    this.resetForm();
  }

  /**
   * Limpia todos los campos del formulario de nuevo foro
   */
  resetForm(): void {
    this.nuevoForo = {
      titulo: '',
      contenido: '',
      image: null
    };
  }

  /**
   * Maneja la carga de una imagen seleccionada por el usuario y la convierte a base64
   * @param event Evento del input file que contiene el archivo seleccionado
   */
  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.nuevoForo.image = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Crea un nuevo foro con los datos del formulario y lo agrega al inicio de la lista.
   * Valida que los campos requeridos no estén vacíos antes de crear.
   */
  createForum(): void {
    if (!this.nuevoForo.titulo || !this.nuevoForo.contenido) {
      return;
    }

    const foro: Foro = {
      id: this.forosList.length + 1,
      titulo: this.nuevoForo.titulo,
      contenido: this.nuevoForo.contenido,
      autor: "Usuario Actual",
      fechaHora: this.formatDate(new Date()),
      replicas: 0,
      image: this.nuevoForo.image
    };

    this.forosList.unshift(foro);
    this.buscarForo();
    this.cerrarVentanas();
  }

  /**
   * Edita el foro, en sus campos titulo y contenido
   * @returns 
   */
  editForum(): void {
    if (!this.foroSelect || !this.nuevoForo.titulo || !this.nuevoForo.contenido) {
      return;
    }

    const index = this.forosList.findIndex(f => f.id === this.foroSelect!.id);
    if (index !== -1) {
      this.forosList[index] = {
        ...this.forosList[index],
        titulo: this.nuevoForo.titulo,
        contenido: this.nuevoForo.contenido,
        image: this.nuevoForo.image
      };
    }

    this.buscarForo();
    this.cerrarVentanas();
  }

  /**
   * Eliminar un foro.
   * @returns void
   */
  deleteForo(): void {
    if (!this.foroSelect) return;

    this.forosList = this.forosList.filter(f => f.id !== this.foroSelect!.id);
    this.buscarForo();
    this.cerrarVentanas();
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

  /**
   * Lista principal de todos los foros disponibles en la plataforma
   */
  forosList: Foro[] = [
    {
      id: 1,
      titulo: "¿Cómo combatir el gusano cogollero en maíz sin químicos agresivos?",
      contenido: "Hola grupo. Tengo un lote de 5 hectáreas de maíz híbrido en etapa V4 y hoy amaneció con un 20% de incidencia de daño en hoja (ventanita). Se ve aserrín fresco en el cogollo, pero quiero evitar piretroides porque tengo colmenas de abejas cerca. ¿Alguien ha tenido éxito controlando esto solo con aplicaciones de Bacillus thuringiensis y trampas de feromonas en esta etapa, o ya es muy tarde?",
      autor: "Roberto Méndez",
      fechaHora: "15 Nov 2025 14:30",
      replicas: 12,
      image: null
    },
    {
      id: 2,
      titulo: "Suplementación para ganado lechero en época seca",
      contenido: "Saludos colegas. La sequía golpeó fuerte el pasto estrella en mi zona y mis vacas (cruce Holstein) bajaron de 18 a 12 litros promedio esta semana. Tengo acceso a comprar silo de maíz y algo de cascarilla de soya, pero me da miedo causar una acidosis si cambio la dieta de golpe. ¿Qué proporción de fibra seca me sugieren incluir para estabilizar el rumen mientras recupero potreros?",
      autor: "Sofía Castillo",
      fechaHora: "14 Nov 2025 09:15",
      replicas: 8,
      image: null
    },
    {
      id: 3,
      titulo: "Dudas sobre instalación de riego por goteo en aguacate",
      contenido: "Estoy diseñando el riego para 2 hectáreas de Hass en un terreno arcilloso con un desnivel de casi 15 metros entre la bomba y la parte alta. Me preocupa que la presión no sea uniforme. ¿Valen la pena los goteros autocompensantes de botón (PCJ) en este caso? Estoy entre usar de 4L/h o de 8L/h, pero no quiero encharcar la raíz por el tipo de suelo que drena lento.",
      autor: "Miguel Ángel Torres",
      fechaHora: "13 Nov 2025 16:45",
      replicas: 5,
      image: null
    }
  ];
}
