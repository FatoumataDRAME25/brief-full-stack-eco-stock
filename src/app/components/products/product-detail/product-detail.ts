import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductTransfertModal } from '../product-transfert-modal/product-transfert-modal';
import { Product, ProductService } from '../services/product.service';
import { ProductForm } from '../product-form/product-form';
import { Warehouse, WarehouseService } from '../../warehouse/services/warehouse.service';

@Component({
  selector: 'app-product-detail',
  imports: [ProductTransfertModal, ProductForm],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail implements OnInit{

  showTransferModal = false;

  showForm = false
  productId: string | null = null;
  private productService= inject(ProductService)
  private warehouseService = inject(WarehouseService)
  private router = inject(Router)
  warehouses = signal<Warehouse[]>([])
// Signal dérivé : recalculé automatiquement dès que productService.products() change,
// peu importe où dans l'application ce changement a eu lieu.
  product = computed(() => {
    return this.productService.products().find((p) => p.id === Number(this.productId)) ?? null;
  });


  constructor(private route: ActivatedRoute){}

  ngOnInit(): void {
    this.productId= this.route.snapshot.paramMap.get('id')
    this.productService.refreshProducts()

    // Recuperation de la liste des entrepots
    this.warehouseService.getWarehouse().subscribe({
      next: (data) =>{
        this.warehouses.set(data)
      },
      error: (err) => {
        console.log(err);

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

   onDeleteProduct(): void{
    const confirmation = confirm("Etes vous sur de vouloir supprimer ce produit")

    if(!confirmation){
      return
    }
    this.productService.deleteProduct(Number(this.productId)).subscribe({
      next: (data) =>{
        this.router.navigate(['/products'])
      },
      error: (err) => {
        console.log(err);

      }
    })
   }
}
