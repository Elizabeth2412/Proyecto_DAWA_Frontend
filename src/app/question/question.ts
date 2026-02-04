import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { Evaluacion } from '../interfaces/evaluacion-interface';
import { Pregunta } from '../interfaces/pregunta-interface';
import { Opcion } from '../interfaces/opcion-interface';
import { ServicioPregunta } from '../servicios/servicio-pregunta';
import { ServicioOpcion } from '../servicios/servicio-opcion';

/** Estructura local que agrupa una Pregunta con sus Opciones ya cargadas */
interface PreguntaConOpciones {
    pregunta: Pregunta;
    opciones: Opcion[];
}

/** Estado del formulario dentro del modal crear/editar */
interface FormPregunta {
    texto: string;
    opciones: { texto: string; esCorrecta: boolean; id: number | null }[];
}

@Component({
    selector: 'app-preguntas',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIcon],
    templateUrl: './question.html',
    styleUrl: './question.css'
})
export class Question implements OnInit, OnChanges {
    @Input() evaluacionId!: number;
    @Input() evaluacion: Evaluacion | null = null;
    @Output() volverClick = new EventEmitter<void>();

    preguntasConOpciones: PreguntaConOpciones[] = [];
    cargando = true;
    errorCarga: string | null = null;

    mostrarModal = false;
    modoModal: 'crear' | 'editar' = 'crear';
    preguntaEditando: PreguntaConOpciones | null = null;

    form: FormPregunta = { texto: '', opciones: [] };

    mostrarConfirmDelete = false;
    preguntaAEliminar: number | null = null;

    constructor(
        private servicioPregunta: ServicioPregunta,
        private servicioOpcion: ServicioOpcion
    ) { }

    ngOnInit(): void {
        console.log('Question ngOnInit - evaluacionId:', this.evaluacionId);
        if (this.evaluacionId) {
            this.cargarPreguntas();
        } else {
            console.error('No se recibió evaluacionId');
            this.errorCarga = 'No se pudo cargar las preguntas: ID de evaluación no válido';
            this.cargando = false;
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['evaluacionId'] && !changes['evaluacionId'].firstChange) {
            console.log('Question ngOnChanges - nuevo evaluacionId:', this.evaluacionId);
            this.cargarPreguntas();
        }
    }

    /**
     * Emite el evento para volver a la vista de evaluaciones
     */
    onVolverClick(): void {
        this.volverClick.emit();
    }

    /**
     * Carga todas las preguntas de la evaluación y luego, para cada una,
     * carga sus opciones en paralelo.
     */
    cargarPreguntas(): void {
        this.cargando = true;
        this.errorCarga = null;
        this.preguntasConOpciones = []; 

        console.log('Cargando preguntas para evaluación:', this.evaluacionId);

        this.servicioPregunta.obtenerPorEvaluacion(this.evaluacionId).subscribe({
            next: (preguntas) => {
                console.log('Preguntas recibidas:', preguntas);
                
                const preguntasArray = Array.isArray(preguntas) ? preguntas : [];
                
                if (preguntasArray.length === 0) {
                    this.preguntasConOpciones = [];
                    this.cargando = false;
                    return;
                }

                let completadas = 0;
                const preguntasTemp: PreguntaConOpciones[] = [];

                preguntasArray.forEach((preg) => {
                    this.servicioOpcion.obtenerPorPregunta(preg.id).subscribe({
                        next: (opciones) => {
                            console.log(`Opciones para pregunta ${preg.id}:`, opciones);
                            const opcionesArray = Array.isArray(opciones) ? opciones : [];
                            preguntasTemp.push({ 
                                pregunta: preg, 
                                opciones: opcionesArray 
                            });
                            completadas++;

                            if (completadas === preguntasArray.length) {
                                this.preguntasConOpciones = preguntasTemp.sort((a, b) => a.pregunta.id - b.pregunta.id);
                                console.log('Preguntas con opciones cargadas:', this.preguntasConOpciones);
                                this.cargando = false;
                            }
                        },
                        error: (err) => {
                            console.error(`Error al cargar opciones de pregunta ${preg.id}:`, err);
                            preguntasTemp.push({ pregunta: preg, opciones: [] });
                            completadas++;
                            if (completadas === preguntasArray.length) {
                                this.preguntasConOpciones = preguntasTemp.sort((a, b) => a.pregunta.id - b.pregunta.id);
                                this.cargando = false;
                            }
                        }
                    });
                });
            },
            error: (err) => {
                console.error('Error al cargar preguntas:', err);
                this.errorCarga = 'No se pudo cargar las preguntas. Intenta de nuevo.';
                this.preguntasConOpciones = []; 
                this.cargando = false;
            }
        });
    }

    /**
     * Abre el modal en modo "crear" con el formulario limpio.
     * Por defecto se crean 4 opciones vacías (A, B, C, D).
     */
    abrirModalCrear(): void {
        this.modoModal = 'crear';
        this.preguntaEditando = null;
        this.form = {
            texto: '',
            opciones: [
                { texto: '', esCorrecta: false, id: null },
                { texto: '', esCorrecta: false, id: null },
                { texto: '', esCorrecta: false, id: null },
                { texto: '', esCorrecta: false, id: null }
            ]
        };
        this.mostrarModal = true;
    }

    /**
     * Abre el modal en modo "editar" pre-cargando los datos de la pregunta.
     * @param item PreguntaConOpciones a editar.
     */
    abrirModalEditar(item: PreguntaConOpciones): void {
        console.log('Abriendo modal editar con item:', item);
        
        this.modoModal = 'editar';
        this.preguntaEditando = item;
        
        const opciones = Array.isArray(item.opciones) ? item.opciones : [];
        
        this.form = {
            texto: item.pregunta.texto || '',
            opciones: opciones.length > 0 
                ? opciones.map(opt => ({
                    texto: opt.texto || '',
                    esCorrecta: opt.esCorrecta || false,
                    id: opt.id || null
                }))
                : [
                    { texto: '', esCorrecta: false, id: null },
                    { texto: '', esCorrecta: false, id: null }
                ]
        };
        
        console.log('Form cargado:', this.form);
        this.mostrarModal = true;
    }

    /** Cierra el modal sin guardar. */
    cerrarModal(): void {
        this.mostrarModal = false;
        this.preguntaEditando = null;
    }

    /**
     * Añade una nueva opción vacía al formulario.
     */
    agregarOpcion(): void {
        this.form.opciones.push({ texto: '', esCorrecta: false, id: null });
    }

    /**
     * Elimina una opción del formulario por índice.
     * No permite quedarse con menos de 2 opciones.
     * @param index Índice de la opción a eliminar.
     */
    eliminarOpcion(index: number): void {
        if (this.form.opciones.length <= 2) return;
        this.form.opciones.splice(index, 1);
    }

    /**
     * Marca una opción como correcta y desmarca las demás.
     * @param index Índice de la opción que será la correcta.
     */
    marcarCorrecta(index: number): void {
        this.form.opciones.forEach((opt, i) => {
            opt.esCorrecta = (i === index);
        });
    }

    /** Retorna true si el formulario es válido para guardar. */
    get formularioValido(): boolean {
        const textoValido = this.form.texto.trim().length > 0;
        const opcionesConTexto = this.form.opciones.filter(o => o.texto.trim().length > 0);
        const tiene2Opciones = opcionesConTexto.length >= 2;
        const tieneCorrecta = this.form.opciones.some(o => o.esCorrecta);
        return textoValido && tiene2Opciones && tieneCorrecta;
    }

    /** Retorna true si hay al menos una opción marcada como correcta. */
    get tieneOpcionCorrecta(): boolean {
        return this.form.opciones.some(o => o.esCorrecta);
    }

    guardarPregunta(): void {
        if (!this.formularioValido) return;

        if (this.modoModal === 'crear') {
            this.crearPregunta();
        } else {
            this.editarPregunta();
        }
    }

    private crearPregunta(): void {
        const nuevaPregunta: Pregunta = {
            id: 0,
            evaluacionId: this.evaluacionId,
            texto: this.form.texto.trim(),
            estado: 'Activa',
            usuarioId: 1,
            transaccion: null
        };

        this.servicioPregunta.crear(nuevaPregunta).subscribe({
            next: (preguntaCreada: any) => {
                this.crearOpcionesBulk(preguntaCreada.id, this.form.opciones);
            },
            error: (err) => {
                console.error('Error al crear pregunta:', err);
                alert('No se pude crear la pregunta. Intenta de nuevo.');
            }
        });
    }

    /**
     * Crea todas las opciones de una pregunta de forma secuencial.
     * Se hace secuencial (no paralelo) para evitar condiciones de carrera en el backend.
     */
    private crearOpcionesBulk(preguntaId: number, opciones: FormPregunta['opciones']): void {
        const opcionesValidas = opciones.filter(o => o.texto.trim().length > 0);
        let creadas = 0;

        opcionesValidas.forEach((opt) => {
            const nuevaOpcion: Opcion = {
                id: 0,
                preguntaId: preguntaId,
                texto: opt.texto.trim(),
                esCorrecta: opt.esCorrecta,
                estado: 'Activa',
                usuarioId: null,
                transaccion: null
            };

            this.servicioOpcion.crear(nuevaOpcion).subscribe({
                next: () => {
                    creadas++;
                    if (creadas === opcionesValidas.length) {
                        alert('Pregunta creada exitosamente');
                        this.cerrarModal();
                        this.cargarPreguntas(); 
                    }
                },
                error: (err) => {
                    console.error('Error al crear opción:', err);
                    alert('La pregunta se creó pero falló al crear una opción. Revisa en editar.');
                    this.cerrarModal();
                    this.cargarPreguntas();
                }
            });
        });
    }

    private editarPregunta(): void {
        if (!this.preguntaEditando) return;

        const preguntaActualizada: Pregunta = {
            ...this.preguntaEditando.pregunta,
            texto: this.form.texto.trim()
        };

        this.servicioPregunta.actualizar(preguntaActualizada).subscribe({
            next: () => {
                this.actualizarOpciones();
            },
            error: (err) => {
                console.error('Error al actualizar pregunta:', err);
                alert('No se pudo actualizar la pregunta.');
            }
        });
    }

    /**
     * Lógica de actualización de opciones al editar:
     * - Opciones que ya tienen ID → se actualizan
     * - Opciones sin ID (nuevas) → se crean
     * - Opciones que existían pero ya no están en el form → se eliminan
     */
    private actualizarOpciones(): void {
        if (!this.preguntaEditando) return;

        const preguntaId = this.preguntaEditando.pregunta.id;
        
        const opcionesOriginales = Array.isArray(this.preguntaEditando.opciones) 
            ? this.preguntaEditando.opciones 
            : [];
            
        const opcionesForm = this.form.opciones.filter(o => o.texto.trim().length > 0);

        const idsEnForm = opcionesForm.filter(o => o.id !== null).map(o => o.id!);

        const aEliminar = opcionesOriginales.filter(o => !idsEnForm.includes(o.id));

        aEliminar.forEach((opt) => {
            this.servicioOpcion.eliminar(opt.id).subscribe({
                error: (err) => console.error('Error al eliminar opción:', err)
            });
        });

        let pendientes = opcionesForm.length;
        let completadas = 0;

        if (pendientes === 0) {
            this.finalizarEdicion();
            return;
        }

        opcionesForm.forEach((opt) => {
            if (opt.id !== null) {
                const opcionActualizada: Opcion = {
                    id: opt.id,
                    preguntaId: preguntaId,
                    texto: opt.texto.trim(),
                    esCorrecta: opt.esCorrecta,
                    estado: 'Activa',
                    usuarioId: 1,
                    transaccion: null
                };

                this.servicioOpcion.actualizar(opcionActualizada).subscribe({
                    next: () => {
                        completadas++;
                        if (completadas === pendientes) this.finalizarEdicion();
                    },
                    error: (err) => {
                        console.error('Error al actualizar opción:', err);
                        completadas++;
                        if (completadas === pendientes) this.finalizarEdicion();
                    }
                });
            } else {
                const nuevaOpcion: Opcion = {
                    id: 0,
                    preguntaId: preguntaId,
                    texto: opt.texto.trim(),
                    esCorrecta: opt.esCorrecta,
                    estado: 'Activa',
                    usuarioId: null,
                    transaccion: null
                };

                this.servicioOpcion.crear(nuevaOpcion).subscribe({
                    next: () => {
                        completadas++;
                        if (completadas === pendientes) this.finalizarEdicion();
                    },
                    error: (err) => {
                        console.error('Error al crear opción:', err);
                        completadas++;
                        if (completadas === pendientes) this.finalizarEdicion();
                    }
                });
            }
        });
    }

    private finalizarEdicion(): void {
        alert('Pregunta actualizada exitosamente');
        this.cerrarModal();
        this.cargarPreguntas();
    }

    /**
     * Abre la confirmación personalizada de eliminación.
     * @param preguntaId ID de la pregunta a eliminar.
     */
    confirmarEliminar(preguntaId: number): void {
        this.preguntaAEliminar = preguntaId;
        this.mostrarConfirmDelete = true;
    }

    /** Cancela la confirmación de eliminación. */
    cancelarEliminar(): void {
        this.mostrarConfirmDelete = false;
        this.preguntaAEliminar = null;
    }

    /**
     * Ejecuta la eliminación de la pregunta.
     * El backend debería hacer cascade y eliminar las opciones asociadas.
     */
    ejecutarEliminar(): void {
        if (this.preguntaAEliminar === null) return;

        this.servicioPregunta.eliminar(this.preguntaAEliminar).subscribe({
            next: () => {
                alert('Pregunta eliminada exitosamente');
                this.mostrarConfirmDelete = false;
                this.preguntaAEliminar = null;
                this.cargarPreguntas();
            },
            error: (err) => {
                console.error('Error al eliminar pregunta:', err);
                alert('No se pudo eliminar la pregunta.');
                this.mostrarConfirmDelete = false;
                this.preguntaAEliminar = null;
            }
        });
    }

    /**
     * Retorna la letra de la opción según su índice (A, B, C, D...).
     */
    letra(index: number): string {
        return String.fromCharCode(65 + index);
    }

    /**
     * Retorna la opción correcta de una lista de opciones.
     */
    opcionCorrecta(opciones: Opcion[]): Opcion | undefined {
        return opciones.find(o => o.esCorrecta);
    }
}