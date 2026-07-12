import { Component, inject, OnInit, signal } from '@angular/core';
import { ProductForm } from '../product-form/product-form';
import { RouterLink } from "@angular/router";
import { Product, ProductService } from '../services/product.service';
import { Warehouse, WarehouseService } from '../../warehouse/services/warehouse.service';

@Component({
  selector: 'app-product-list',
  imports: [ProductForm, RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements  OnInit{

  private productService = inject(ProductService)
  private warehouseService = inject(WarehouseService)

  warehouses = signal<Warehouse[]>([])
  products = signal<Product[]>([])

  ngOnInit(): void {
    this.productService.getProduct().subscribe({
      next: (data) =>{
        this.products.set(data)
      },

      error: (err) =>{
        console.log(err);

      }
    })

    this.warehouseService.getWarehouse().subscribe({
      next: (data) =>{
        this.warehouses.set(data)
      },
      error: (err) =>{
        console.log(err);

      }
    })

  }
    getWarehouseName(warehouseId: number): string {
      const found = this.warehouses().find((w) => w.id === warehouseId);
      if(found){
        return found.nom;
      } else{
        return 'Inconnu'
      }
  }
}
