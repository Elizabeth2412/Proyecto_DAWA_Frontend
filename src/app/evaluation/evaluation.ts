import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';


interface Question {
  id: number;
  text: string;
  options: string[];
}

interface VisualizationEvaluation {
  title: string;
  duration: string;
  totalQuestions: number;
  questions: Question[];
}

@Component({
  selector: 'app-evaluation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './evaluation.html',
  styleUrl: './evaluation.css',
})


export class Evaluation {

  constructor(private router: Router) {}

  isStarted = false;
  mostrarModalInicio = false;
  currentQuestion = 0;
  selectedAnswer : number | null = null;
  answers: { [key: number]: number } = {};

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

  abrirModal(): void {
    this.mostrarModalInicio = true;
    document.body.style.overflow = 'hidden'; 
  }

  cerrarModal(): void {
    this.mostrarModalInicio = false;
    document.body.style.overflow = 'auto'; 
  }

  startEvaluation() {
    this.mostrarModalInicio = false;
    this.isStarted = true;
    document.body.style.overflow = 'auto';
  }

  selectAnswer(optionIndex: number): void {
    this.selectedAnswer = optionIndex;
    this.answers[this.currentQuestion] = optionIndex;
  }

  goToQuestion(index: number): void {
    this.currentQuestion = index;
    this.selectedAnswer = this.answers[index] !== undefined ? this.answers[index] : null;
  }    

  nextQuestion(): void {
    if (this.currentQuestion < this.evaluationData.totalQuestions - 1) {
      this.goToQuestion(this.currentQuestion + 1);
    }
  }

  previousQuestion(): void {
    if (this.currentQuestion > 0) {
      this.goToQuestion(this.currentQuestion - 1);
    }
  }

  getQuestionStatus(index: number): string {
    if (this.answers[index] !== undefined) {
      return 'answered';
    } else if (index === this.currentQuestion) {
      return 'current';
    } else {
      return 'pending';
    }
  }

  getAnsweredCount(): number {
    return Object.keys(this.answers).length;
  }

  finishEvaluation(): void {
    const confirmed = confirm(
      `Has contestado ${this.getAnsweredCount()} de ${this.evaluationData.totalQuestions} preguntas.\n¿Deseas finalizar la evaluación?`
    );
    if (confirmed) {
      alert('Evaluación finalizada. ¡Gracias por participar!');
      console.log('Respuestas:', this.answers);
      this.router.navigate(['/estudiante']);
    }
  }

  createRange(length: number): number[] {
    return Array.from({ length }, (_, i) => i);
  }

}

