import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-product-transfert-modal',
  imports: [],
  templateUrl: './product-transfert-modal.html',
  styleUrl: './product-transfert-modal.css',
})
export class ProductTransfertModal {
  @Output() fermer = new EventEmitter<void>();
}
