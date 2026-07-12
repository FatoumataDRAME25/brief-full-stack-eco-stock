import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-warehouse-card',
  imports: [CommonModule, RouterLink],
  templateUrl: './warehouse-card.html',
  styleUrl: './warehouse-card.css',
})
export class WarehouseCard {
  @Input() id=0;
  @Input() nom: string = '';
  @Input() localisation: string = '';
  @Input() capacite: number = 0;
  @Input() totalProduits: number = 0;

}
