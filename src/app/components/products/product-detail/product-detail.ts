import { Component, inject, OnInit, signal } from '@angular/core';
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
  warehouses = signal<Warehouse[]>([])
  product = signal<Product | null>(null)
  private router = inject(Router)

  constructor(private route: ActivatedRoute){}

  ngOnInit(): void {
    this.productId= this.route.snapshot.paramMap.get('id')
    this.fetchProduct()

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

  // Recuperation du produit conserne
  fetchProduct(): void{
    this.productService.getById(Number(this.productId)).subscribe({
      next: (data) =>{
        this.product.set(data)
      },
      error: (err) =>{
        console.log(err);

      }
    })
  }

   onProductSaved(): void{
    this.fetchProduct()
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
