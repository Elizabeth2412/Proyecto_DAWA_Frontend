import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ServiceEvaluacion } from '../servicios/service-evaluacion';
import { ServicioCursos } from '../servicios/servicio-cursos';
import { ServicioAutorizacion } from '../autorizacion.service';
import { Questions } from '../interfaces/question-interface';
import { Curso } from '../interfaces/curso-interface';
import { Evaluacion } from '../interfaces/evaluacion-interface';
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
export class Evaluation implements OnInit {

  constructor(
    private router: Router,
    private serviceEvaluacion: ServiceEvaluacion,
    private servicioAuth: ServicioAutorizacion,
    private servicioCursos: ServicioCursos
  ) { }

  static modoGlobal: 'formulario' | 'tabla' | 'preguntas' = 'tabla';

  // Estados de la evaluación
  isStarted = false;
  mostrarModalInicio = false;
  currentQuestion = 0;
  selectedAnswer: number | null = null;
  answers: { [key: number]: number } = {};
  esEstudiante: boolean = false;
  cursosDisponibles: Curso[] = [];
  cargandoEvaluacion: boolean = false;

  // Modos y filtros
  @Input() modo: 'tabla' | 'evaluacion' | 'formulario' | 'preguntas' = 'tabla';
  terminoBusqueda: string = '';
  filtroEstado: string = '';
  evaluacionesFiltradas: Evaluacion[] = [];
  evaluacionSeleccionada: Evaluacion | null = null;
  modoFormulario: 'crear' | 'editar' = 'crear';

  evaluaciones: Evaluacion[] = [];
  mostrarDialogoFormulario: boolean = false;

  evaluationData: VisualizationEvaluation = {
    title: '',
    duration: '',
    totalQuestions: 0,
    questions: []
  };

  ngOnInit(): void {
    this.modo = Evaluation.modoGlobal;

    // Verificar tipo de usuario
    const usuario = this.servicioAuth.obtenerUsuarioActual();
    this.esEstudiante = !!(usuario && usuario.tipo === 'estudiante');

    // Manejar navegación desde otro componente
    const state = history.state;
    if (state?.abrirModalInicio && state?.evaluacionId) {
      this.modo = 'evaluacion';
      this.cargarYMostrarEvaluacion(state.evaluacionId);
      history.replaceState({}, '');
    } else if (this.modo === 'tabla') {
      this.cargarEvaluaciones();
    }

    this.cargarCursosDisponibles();
  }

  /**
   * Carga una evaluación específica y abre el modal
   * @param evaluacionId ID de la evaluación a cargar
   */
  cargarYMostrarEvaluacion(evaluacionId: number): void {
    this.cargandoEvaluacion = true;
    
    this.serviceEvaluacion.obtenerEvaluacionConPreguntas(evaluacionId).subscribe({
      next: (evaluacionCompleta) => {
        this.evaluacionSeleccionada = evaluacionCompleta;
        this.prepararDatosEvaluacion(evaluacionCompleta);
        this.abrirModal();
        this.cargandoEvaluacion = false;
      },
      error: (error) => {
        console.error('Error al cargar evaluación:', error);
        alert('No se pudo cargar la evaluación. Por favor intenta de nuevo.');
        this.cargandoEvaluacion = false;
        this.router.navigate(['/estudiante']);
      }
    });
  }

  /**
   * Prepara los datos de la evaluación para la visualización
   * @param evaluacion Evaluación completa con preguntas
   */
  private prepararDatosEvaluacion(evaluacion: Evaluacion): void {
    const preguntasMapeadas = this.mapearPreguntasAFormato(evaluacion.preguntas || []);

    this.evaluationData = {
      title: evaluacion.titulo,
      duration: evaluacion.duracion,
      totalQuestions: preguntasMapeadas.length,
      questions: preguntasMapeadas
    };
  }


  /**
   * Mapea las preguntas del backend al formato esperado por la interfaz
   * @param preguntas Array de preguntas desde el backend
   * @returns Array de preguntas en formato Questions
   */
  private mapearPreguntasAFormato(preguntas: any[]): Questions[] {
    return preguntas.map((pregunta) => ({
      id: pregunta.id,
      text: pregunta.texto,
      options: pregunta.opciones || []
    }));
  }

  /**
   * Abre el modal de inicio de evaluación.
   */
  abrirModal(): void {
    this.mostrarModalInicio = true;
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
   * Carga los cursos disponibles desde el servicio.
   */
  cargarCursosDisponibles(): void {
    this.servicioCursos.obtenerCursos().subscribe({
      next: (cursos) => {
        this.cursosDisponibles = cursos || [];
      },
      error: (error) => {
        console.error('Error al cargar cursos:', error);
        this.cursosDisponibles = [];
      }
    });
  }

  /**
   * Inicia la evaluación solo si el usuario es estudiante y hay preguntas disponibles.
   */
  startEvaluation(): void {
    if (!this.esEstudiante) {
      alert('Solo los estudiantes pueden iniciar la evaluación.');
      return;
    }

    // Validar que la evaluación tenga preguntas
    if (!this.evaluationData.questions || this.evaluationData.questions.length === 0) {
      alert('Esta evaluación no tiene preguntas disponibles. Por favor contacta al administrador.');
      return;
    }

    // Validar que todas las preguntas tengan opciones
    const preguntasSinOpciones = this.evaluationData.questions.filter(
      q => !q.options || q.options.length === 0
    );

    if (preguntasSinOpciones.length > 0) {
      alert('Algunas preguntas no tienen opciones disponibles. Por favor contacta al administrador.');
      return;
    }

    this.mostrarModalInicio = false;
    this.isStarted = true;
    document.body.style.overflow = 'auto';
    this.modo = 'evaluacion';
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
      this.resetearEvaluacion();
      this.router.navigate(['/estudiante']);
    }
  }

  /**
   * Resetea el estado de la evaluación
   */
  private resetearEvaluacion(): void {
    this.isStarted = false;
    this.currentQuestion = 0;
    this.selectedAnswer = null;
    this.answers = {};
    this.evaluacionSeleccionada = null;
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
        this.evaluacionesFiltradas = [];
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
   * Muestra los detalles de una evaluación cargando sus preguntas desde la BD.
   * @param evaluacion  Evaluación a visualizar.
   */
  verEvaluacion(evaluacion: Evaluacion): void {
    this.cargandoEvaluacion = true;

    // Cargar la evaluación completa con sus preguntas desde el backend
    this.serviceEvaluacion.obtenerEvaluacionConPreguntas(evaluacion.id).subscribe({
      next: (evaluacionCompleta) => {
        this.evaluacionSeleccionada = evaluacionCompleta;
        this.prepararDatosEvaluacion(evaluacionCompleta);

        this.isStarted = false;
        this.modo = 'tabla';
        this.abrirModal();
        this.cargandoEvaluacion = false;
      },
      error: (error) => {
        console.error('Error al cargar evaluación completa:', error);
        alert('No se pudo cargar la evaluación. Por favor intenta de nuevo.');
        this.cargandoEvaluacion = false;
      }
    });
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
    this.resetearEvaluacion();
  }

  /**
   * Redirige a la vista de preguntas de una evaluación específica.
   * @param evaluacion Evaluación cuyas preguntas se desean gestionar.
   */
  irAPreguntas(evaluacion: Evaluacion): void {
    this.evaluacionSeleccionada = evaluacion;
    this.modo = 'preguntas';
    Evaluation.modoGlobal = 'preguntas';
  }

  /**
   * Vuelve de la vista de preguntas a la tabla de evaluaciones.
   */
  volverDePreguntas(): void {
    this.modo = 'tabla';
    Evaluation.modoGlobal = 'tabla';
    this.evaluacionSeleccionada = null;
    this.cargarEvaluaciones();
  }

  


  
}