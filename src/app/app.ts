import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ServicioAutorizacion } from './autorizacion.service';
import { Header } from "./header/header";
import { Footer } from "./footer/footer";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, Header, Footer],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  titulo: string = 'Proyecto_Frontend';
  estaLogueado: boolean = false;

  constructor(private servicioAutorizacion: ServicioAutorizacion) {}

  ngOnInit(): void {
    this.servicioAutorizacion
      .obtenerObservableLogueado()
      .subscribe((logueado) => {
        this.estaLogueado = logueado;
      });
  }
  
}
