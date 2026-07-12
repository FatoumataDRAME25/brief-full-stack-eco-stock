import { Component, inject, OnInit, signal } from '@angular/core';
import { WarehouseCard } from '../warehouse-card/warehouse-card';
import { WarehouseForm } from '../warehouse-form/warehouse-form';
import { Warehouse, WarehouseService } from '../services/warehouse.service';
import { RouterLink } from "@angular/router";
import { Product, ProductService } from '../../products/services/product.service';

@Component({
  selector: 'app-warehouse-list',
  imports: [WarehouseCard, WarehouseForm, RouterLink],
  templateUrl: './warehouse-list.html',
  styleUrl: './warehouse-list.css',
})
export class WarehouseList implements OnInit{

  private warehouseService = inject(WarehouseService);
  private productService = inject(ProductService);
  warehouses = signal<Warehouse[]>([]);
  products = signal<Product[]>([])

  showForm = false;


  ngOnInit(): void {
    this.fetchWarehouses()
    this.fetchProducts()
  }

  // Recuperation de la liste des entrepots
  fetchWarehouses(): void {
    this.warehouseService.getWarehouse().subscribe({
      next: (data) =>{
        this.warehouses.set(data)

      },
      error: (err) =>{
        console.log(err)
      }
    })
  }


  fetchProducts(): void {
     this.productService.getProduct().subscribe({
       next: (data) => {
         this.products.set(data)
       },
       error: (err) => {
         console.log(err)
       }
     })
   }


  // mis a jour de la liste des entrepots apres enregistrement
  onWarehouseSaved(warehouse: Warehouse): void {
    this.fetchWarehouses()
  }

  // fermeture automatique du modal apres enregistrement
  closeForm(): void {
   this.showForm = false
  }

  totalProduits(warehouseId: number): number {
  return this.products().filter((p) => p.warehouse === warehouseId).length;
}
}

