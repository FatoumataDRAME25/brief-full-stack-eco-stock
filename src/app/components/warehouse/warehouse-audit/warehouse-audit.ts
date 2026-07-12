import { Product, ProductService } from '../../products/services/product.service';
import { WarehouseForm } from '../warehouse-form/warehouse-form';
import { WarehouseService } from './../services/warehouse.service';
import { Warehouse } from './../services/warehouse.service';
import { Component, inject, OnInit, signal} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-warehouse-audit',
  imports: [WarehouseForm],
  templateUrl: './warehouse-audit.html',
  styleUrl: './warehouse-audit.css',
})
export class WarehouseAudit implements OnInit{

  showForm = false;
  products = signal<Product[]>([])
  private productService = inject(ProductService)
  warehouse = signal<Warehouse | null>(null)
  private warehouseService= inject(WarehouseService)
  warehouseId: string | null = null;
  private router =inject(Router)
  constructor(private route: ActivatedRoute){}

  ngOnInit(): void {
    this.fetchWarehouse()
    this.fetchProducts()

  }

  fetchWarehouse(): void {
    this.warehouseId = this.route.snapshot.paramMap.get('id')

    this.warehouseService.getById(Number(this.warehouseId)).subscribe({
      next: (data) =>{
        this.warehouse.set(data)
      },
      error: (err) =>{
        console.log(err);

      }
    })
  }


  fetchProducts(): void {
    this.productService.getProduct().subscribe({
      next: (data) => {
        const produitsDeCetEntrepot = data.filter(
          (p) => p.warehouse === Number(this.warehouseId)
        );
        this.products.set(produitsDeCetEntrepot);
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

  onWarehouseSaved():void{
    this.fetchWarehouse()
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
