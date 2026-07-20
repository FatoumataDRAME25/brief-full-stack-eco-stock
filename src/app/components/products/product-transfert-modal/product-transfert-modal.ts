import { Warehouse, WarehouseService } from './../../warehouse/services/warehouse.service';
import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { Product, ProductService } from '../services/product.service';
import { FormControl, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-transfert-modal',
  imports: [FormsModule],
  templateUrl: './product-transfert-modal.html',
  styleUrl: './product-transfert-modal.css',
})
export class ProductTransfertModal implements OnInit{
  @Output() fermer = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Product>();

  // Le produit à transférer, fourni par le parent (product-detail)
  @Input() product :Product | null = null;

  private productService = inject(ProductService);
  private warehouseService = inject(WarehouseService);

  // Liste des entrepôts disponibles, pour remplir le <select>
  warehouses = this.warehouseService.warehouses;

  // Stocke l'id de l'entrepôt choisi dans le <select> (relié via [(ngModel)])
  selectedWarehouseId : number | null = null
  errorMessage: string | null = null;



  ngOnInit(): void {
    this.warehouseService.refreshWarehouses()
  }

  onTransfer(): void{
    if(this.product === null || this.selectedWarehouseId === null ) {
      return
    }

    if (this.product.etat === 'perime') {
    this.errorMessage = "Un produit périmé ne peut pas changer d'entrepôt.";
    return;
  }

    this.productService.transfer(this.product.id, this.selectedWarehouseId).subscribe({
      next: (response) => {
        this.saved.emit(response.product);
        this.fermer.emit()
      },
      error: (err) => {
        this.errorMessage = err.error?.error ?? 'Une erreur est survenue lors du transfert.';

      }
    })
  }

   // Recuperation du nom de l'entrepot auquel appartient le produit
  getWarehouseName(warehouseId: number): string {
      const found = this.warehouses().find((w) => w.id === warehouseId);
      if(found){
        return found.nom;
      } else{
        return 'Inconnu'
      }
  }
}
