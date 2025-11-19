import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paginal-principal',
  imports: [CommonModule],
  templateUrl: './paginal-principal.html',
  styleUrl: './paginal-principal.css',
})
export class PaginalPrincipal {
  faqOpen = [false, false, false, false, false];

  toggleFaq(index: number) {
    this.faqOpen[index] = !this.faqOpen[index];
  }
}
