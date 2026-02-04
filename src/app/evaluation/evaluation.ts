import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ServiceEvaluacion} from '../servicios/service-evaluacion';
import { ServicioAutorizacion } from '../autorizacion.service';
import { Questions } from '../interfaces/question-interface';
import { Evaluacion } from '../interfaces/evaluacion-interface';
import { A } from '@angular/cdk/keycodes';
import { Question } from '../question/question';
interface VisualizationEvaluation {
  title: string;
  duration: string;
  totalQuestions: number;
  questions: Questions[];
}

@Component({
  selector: 'app-evaluation',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIcon, Question],
  templateUrl: './evaluation.html',
  styleUrl: './evaluation.css',
})
export class Evaluation {

  constructor(
    private router: Router,
    private serviceEvaluacion: ServiceEvaluacion,
    private servicioAuth: ServicioAutorizacion
  ) { }

  static modoGlobal: 'formulario' | 'tabla' | 'preguntas' = 'tabla';

  isStarted = false;
  mostrarModalInicio = false;
  currentQuestion = 0;
  selectedAnswer: number | null = null;
  answers: { [key: number]: number } = {};
  esEstudiante: boolean = false;

  @Input() modo: 'tabla' | 'evaluacion' | 'formulario'| 'preguntas' = 'tabla';
  terminoBusqueda: string = '';
  filtroEstado: string = '';
  evaluacionesFiltradas: Evaluacion[] = [];
  evaluacionSeleccionada: Evaluacion | null = null;
  modoFormulario: 'crear' | 'editar' = 'crear';

  evaluaciones: Evaluacion[] = [];
  mostrarDialogoFormulario: boolean = false;

  evaluationData: VisualizationEvaluation = {
    title: 'Evaluacion del Modulo 1',
    duration: '15 minutos',
    totalQuestions: 3,
    questions: [
      {
        id: 1,
        text: "¿Qué es la agricultura sostenible?",
        options: [
          "Un sistema que busca producir más usando químicos",
          "Un enfoque que equilibra productividad, cuidado ambiental y bienestar social",
          "Una técnica para cultivar únicamente en invernaderos",
          "Un modelo basado solo en agricultura tradicional"
        ]
      },
      {
        id: 2,
        text: "¿Cuál es el objetivo principal del uso eficiente del agua en agricultura sostenible?",
        options: [
          "Aumentar el consumo de agua",
          "Reducir costos sin considerar el ambiente",
          "Optimizar recursos y disminuir el desperdicio hídrico",
          "Evitar el riego por completo"
        ]
      },
      {
        id: 3,
        text: "¿Cuál de las siguientes prácticas ayuda a conservar el suelo?",
        options: [
          "Monocultivo intensivo",
          "Labranza excesiva",
          "Rotación de cultivos",
          "Aplicación constante de agroquímicos"
        ]
      },
      {
        id: 4,
        text: "¿Qué se entiende por biodiversidad en la agricultura sostenible?",
        options: [
          "La reducción de especies para facilitar el cultivo",
          "Tener solo un tipo de planta en el terreno",
          "La variedad de especies que favorecen el equilibrio ecológico",
          "El uso de variedades genéticamente modificadas"
        ]
      },
      {
        id: 5,
        text: "¿Cuál es un beneficio de utilizar abonos orgánicos?",
        options: [
          "Contaminan los ríos",
          "Empobrecen el suelo",
          "Mejoran la estructura y fertilidad del suelo",
          "Eliminan toda la vida microbiana"
        ]
      },
      {
        id: 6,
        text: "¿Qué es el manejo integrado de plagas (MIP)?",
        options: [
          "Uso exclusivo de pesticidas químicos",
          "Un enfoque que combina métodos biológicos, culturales y químicos responsables",
          "Eliminar todas las plagas sin excepción",
          "Aplicar pesticidas semanalmente"
        ]
      },
      {
        id: 7,
        text: "¿Qué rol cumplen los polinizadores en la agricultura sostenible?",
        options: [
          "Reducir el rendimiento de los cultivos",
          "Aumentar la erosión del suelo",
          "Facilitar la reproducción de las plantas y mejorar la producción",
          "Controlar plagas de forma química"
        ]
      },
      {
        id: 8,
        text: "¿Cuál es una práctica sostenible en el uso del agua?",
        options: [
          "Riego por goteo",
          "Inundar completamente los cultivos",
          "Regar en las horas de mayor calor",
          "No medir el consumo de agua"
        ]
      },
      {
        id: 9,
        text: "¿Para qué sirve el compostaje en agricultura sostenible?",
        options: [
          "Para quemar residuos agrícolas",
          "Para producir fertilizante natural mediante descomposición",
          "Para eliminar microorganismos beneficiosos",
          "Para endurecer el suelo"
        ]
      },
      {
        id: 10,
        text: "¿Qué beneficio aporta la siembra de cultivos de cobertura?",
        options: [
          "Aumentar la erosión",
          "Disminuir la fertilidad",
          "Proteger el suelo y mejorar su calidad",
          "Incrementar el uso de químicos"
        ]
      },
      {
        id: 11,
        text: "¿Qué caracteriza a un sistema agroecológico?",
        options: [
          "Busca maximizar la producción ignorando el ecosistema",
          "Integra prácticas que imitan los procesos naturales",
          "Depende exclusivamente de maquinaria pesada",
          "Requiere grandes cantidades de fertilizantes sintéticos"
        ]
      }
    ]
  };

  ngOnInit(): void {
    this.modo = Evaluation.modoGlobal;

    const usuario = this.servicioAuth.obtenerUsuarioActual();
    this.esEstudiante = !!(usuario && usuario.tipo === 'estudiante');

    const state = history.state;
    if (state?.abrirModalInicio) {
      this.modo = 'evaluacion';
      this.abrirModal();
      history.replaceState({}, '');
    } else if (this.modo === 'tabla') {
      this.cargarEvaluaciones();
    }
  }


  /**
   * Abre el modal de inicio de evaluación.
   */
  abrirModal(): void {
    this.mostrarModalInicio = true;
    document.body.style.overflow = 'hidden';
  }


  /**
   * Cierra el modal de inicio de evaluación.
   */
  cerrarModal(): void {
    this.mostrarModalInicio = false;
    document.body.style.overflow = 'auto';

    if (this.modo === 'evaluacion') {
      this.router.navigate(['/estudiante']);
    }
  }


  /**
   * Inicia la evaluación solo si el usuario es estudiante y cierra el modal de inicio.
   */
  startEvaluation() {
    if (this.esEstudiante) {
      this.mostrarModalInicio = false;
      this.isStarted = true;
      document.body.style.overflow = 'auto';
      this.modo = 'evaluacion';
    }else{
      alert('Solo los estudiantes pueden iniciar la evaluación.');
    }
  }


  /**
   * Selecciona una respuesta para la pregunta actual.
   * @param optionIndex  Índice de la opción seleccionada.
   */
  selectAnswer(optionIndex: number): void {
    this.selectedAnswer = optionIndex;
    this.answers[this.currentQuestion] = optionIndex;
  }

  /**
   * Navega a una pregunta específica.
   * @param index  Índice de la pregunta a la que se desea navegar.
   */
  goToQuestion(index: number): void {
    this.currentQuestion = index;
    this.selectedAnswer = this.answers[index] !== undefined ? this.answers[index] : null;
  }


  /**
   * Navega a la siguiente pregunta.
   */
  nextQuestion(): void {
    if (this.currentQuestion < this.evaluationData.totalQuestions - 1) {
      this.goToQuestion(this.currentQuestion + 1);
    }
  }


  /**
   * Navega a la pregunta anterior.
   */
  previousQuestion(): void {
    if (this.currentQuestion > 0) {
      this.goToQuestion(this.currentQuestion - 1);
    }
  }

  /**
   * Obtiene el estado de una pregunta (respondida, actual o pendiente).
   * @param index  Índice de la pregunta.
   * @returns El estado de la pregunta como una cadena.
   */
  getQuestionStatus(index: number): string {
    if (this.answers[index] !== undefined) {
      return 'answered';
    } else if (index === this.currentQuestion) {
      return 'current';
    } else {
      return 'pending';
    }
  }

  /**
   * Obtiene el número de preguntas respondidas.
   * @returns El número de preguntas respondidas.
   */
  getAnsweredCount(): number {
    return Object.keys(this.answers).length;
  }


  /**
   * Finaliza la evaluación con confirmación del usuario.
   */
  finishEvaluation(): void {
    const confirmed = confirm(
      `Has contestado ${this.getAnsweredCount()} de ${this.evaluationData.totalQuestions} preguntas.\n¿Deseas finalizar la evaluación?`
    );
    if (confirmed) {
      alert('Evaluación finalizada. ¡Gracias por participar!');
      this.router.navigate(['/estudiante']);
    }
  }

  /**
   * Crea un rango de números desde 0 hasta length - 1.
   * @param length 
   * @returns Un array de números desde 0 hasta length - 1.
   */
  createRange(length: number): number[] {
    return Array.from({ length }, (_, i) => i);
  }

  /**
   * Carga las evaluaciones desde el servicio.
   */
  cargarEvaluaciones(): void {
    this.serviceEvaluacion.obtenerEvaluaciones().subscribe({
      next: (evaluaciones) => {
        this.evaluacionesFiltradas = evaluaciones;  
      },
      error: (error) => {
        console.error('Error al cargar evaluaciones:', error);
      }
    });
  }

  /**
   * Filtra las evaluaciones según el término de búsqueda y el estado seleccionado.
   */
  filtrarEvaluaciones(): void {
    this.serviceEvaluacion.filtrarEvaluaciones(this.terminoBusqueda, this.filtroEstado)
    .subscribe({
      next: (evaluaciones) => {
        this.evaluacionesFiltradas = evaluaciones;
      },
      error: (err) => {
        console.error('Error cargando evaluaciones filtradas:', err);
        this.evaluacionesFiltradas = [];
      }
    });
  }

  /**
   * Abre el diálogo para crear una nueva evaluación.
   */
  abrirDialogoNuevo(): void {
    this.modoFormulario = 'crear';
    this.evaluacionSeleccionada = {
      id: 0,
      cursoId: 0,
      titulo: '',
      modulo: '',
      totalPreguntas: 0,
      duracion: '',
      fechaCreacion: new Date(),
      estado: 'Activa'
    };
    this.mostrarDialogoFormulario = true;
  }


  /**
   * Crea una nueva evaluación.
   * @param evaluacion  Evaluación a crear.
   */
  crearEvaluacion(evaluacion: Evaluacion): void {
    this.serviceEvaluacion.crearEvaluacion(evaluacion).subscribe({
      next: () => {
        alert('Evaluación creada exitosamente');
       
        this.filtrarEvaluaciones();
        this.modo = 'tabla';
      },
      error: (err) => {
        console.error('Error al crear evaluación:', err);
        alert('No se pudo crear la evaluación');
      }
    });
  }



  /**
   * Muestra los detalles de una evaluación.
   * @param evaluacion  Evaluación a visualizar.
   */
  verEvaluacion(evaluacion: Evaluacion): void {
    this.evaluacionSeleccionada = evaluacion;

    this.evaluationData = {
      title: evaluacion.titulo,
      duration: evaluacion.duracion,
      totalQuestions: evaluacion.totalPreguntas,
      questions: evaluacion.preguntas || this.evaluationData.questions
    };

    this.isStarted = false;
    this.modo = 'tabla';
    this.abrirModal();
  }

  /**
   * Permite visualizar el formulario de edición de una evaluación.
   * @param evaluacion Evaluación a editar.
   */
  editarEvaluacion(evaluacion: Evaluacion): void {
    this.modoFormulario = 'editar';
    this.evaluacionSeleccionada = { ...evaluacion };
    this.modo = 'tabla';
    this.mostrarDialogoFormulario = true;
  }


  /**
   * Actualiza una evaluación ya seleccionada anteriormente.
   * @param evaluacion  Evaluación a actualizar.
   */
  actualizarEvaluacion(evaluacion: Evaluacion): void {
    this.serviceEvaluacion.actualizarEvaluacion(evaluacion).subscribe({
      next: () => {
        alert('Evaluación actualizada exitosamente');
        this.filtrarEvaluaciones();
        this.cerrarDialogoFormulario();
        this.modo = 'tabla';
      },
      error: (err) => {
        console.error('Error al actualizar evaluación:', err);
        alert('No se pudo actualizar la evaluación');
      }
    });
  }

  /**
   * Elimina una evaluación pidiendo primero la confirmación del usuario.
   * @param id  ID de la evaluación a eliminar.
   */
  eliminarEvaluacion(id: number): void {
    const confirmado = confirm(
      '¿Estás seguro de eliminar esta evaluación?\n\nEsta acción no se puede deshacer.'
    );

    if (!confirmado) return;

    console.log('Eliminando evaluación con id:', id);

    this.serviceEvaluacion.eliminarEvaluacion(id).subscribe({
      next: () => {
        alert('Evaluación eliminada exitosamente');
        this.filtrarEvaluaciones();
      },
      error: (err) => {
        console.error('Error al eliminar evaluación:', err);
        alert('No se pudo eliminar la evaluación');
      }
    });
  }


  /**
   * Guarda el formulario de creación o edición de evaluación.
   */
  guardarFormulario(): void {
    if (!this.evaluacionSeleccionada) {
      console.error('No hay evaluación seleccionada');
      return;
    }

    // Validación
    if (!this.evaluacionSeleccionada.titulo.trim()) {
      alert('El título es obligatorio');
      return;
    }

    if (!this.evaluacionSeleccionada.modulo) {
      alert('El módulo es obligatorio');
      return;
    }

    if (!this.evaluacionSeleccionada.duracion.trim()) {
      alert('La duración es obligatoria');
      return;
    }

    if (this.evaluacionSeleccionada.totalPreguntas <= 0) {
      alert('El número de preguntas debe ser mayor a 0');
      return;
    }

    if (this.modoFormulario === 'crear') {
      this.crearEvaluacion(this.evaluacionSeleccionada);
    } else {
      this.actualizarEvaluacion(this.evaluacionSeleccionada);
    }

    this.evaluaciones = this.serviceEvaluacion.evaluaciones;
    this.filtrarEvaluaciones();
    this.cerrarDialogoFormulario();
  }

  /**
   * Cierra el diálogo del formulario de evaluación.
   */
  cerrarDialogoFormulario(): void {
    this.mostrarDialogoFormulario = false;
    this.evaluacionSeleccionada = null;
  }

  /**
   * Vuelve a la vista de tabla de evaluaciones.
   */
  volverATabla(): void {
    this.modo = 'tabla';
    this.isStarted = false;
    this.currentQuestion = 0;
    this.selectedAnswer = null;
    this.answers = {};
    this.evaluacionSeleccionada = null;
  }


  /**
 * NUEVA FUNCIÓN: Redirige a la vista de preguntas de una evaluación específica.
 * @param evaluacion Evaluación cuyas preguntas se desean gestionar.
 */
  irAPreguntas(evaluacion: Evaluacion): void {
    this.evaluacionSeleccionada = evaluacion;
    this.modo = 'preguntas';
    Evaluation.modoGlobal = 'preguntas';
  }

  /**
   * NUEVA FUNCIÓN: Vuelve de la vista de preguntas a la tabla de evaluaciones.
   */
  volverDePreguntas(): void {
    this.modo = 'tabla';
    Evaluation.modoGlobal = 'tabla';
    this.evaluacionSeleccionada = null;
  }
}