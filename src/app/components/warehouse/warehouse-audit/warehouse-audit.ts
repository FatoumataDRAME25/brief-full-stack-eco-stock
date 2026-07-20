import { Product, ProductService } from '../../products/services/product.service';
import { WarehouseForm } from '../warehouse-form/warehouse-form';
import { WarehouseService } from './../services/warehouse.service';
import { Warehouse } from './../services/warehouse.service';
import { Component, computed, inject, OnInit, signal} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-warehouse-audit',
  imports: [WarehouseForm],
  templateUrl: './warehouse-audit.html',
  styleUrl: './warehouse-audit.css',
})
export class WarehouseAudit implements OnInit{

  showForm = false;
  private productService = inject(ProductService)
  private warehouseService= inject(WarehouseService)
  warehouseId: string | null = null;
  private router =inject(Router)

 // Filtre les produits pour ne garder que ceux de CET entrepôt précis.
  products = computed(() => {
    return this.productService.products().filter((p) => p.warehouse === Number(this.warehouseId));
  });

  // Signal dérivé : recalculé automatiquement dès que productService.products() change,
  // peu importe où dans l'application ce changement a eu lieu.
  warehouse = computed(() => {
    return this.warehouseService.warehouses().find((w) => w.id === Number(this.warehouseId)) ?? null;
  });

  constructor(private route: ActivatedRoute){}

  ngOnInit(): void {
    this.warehouseService.refreshWarehouses()
    this.productService.refreshProducts()
    this.warehouseId = this.route.snapshot.paramMap.get('id')

  }


  onCloseAudit(): void{
    this.showForm= false
  }


  totalProduits(): number {
    return this.products().length;
  }

  disponibles(): number {
    return this.products().filter((p) => p.etat === 'disponible').length;
  }

  reserves(): number {
    return this.products().filter((p) => p.etat === 'reserve').length;
  }

  perimes(): number {
    return this.products().filter((p) => p.etat === 'perime').length;
  }


  deleteWarehouse(): void {
    const confirmation = confirm("Êtes-vous sûr de vouloir supprimer cet entrepôt ?");

    if (!confirmation) {
      return; // l'utilisateur a cliqué "Annuler" → on arrête tout, rien ne se passe
    }
    this.warehouseService.deleteWarehouse(Number(this.warehouseId)).subscribe({
      next: () => {
        this.router.navigate(['/warehouses']);

      },
      error: (err) => {
        console.log(err);
      }
    });
  }
}
