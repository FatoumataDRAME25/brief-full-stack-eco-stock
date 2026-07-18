import { Component, inject, OnInit, signal } from '@angular/core';
import { ProductForm } from '../product-form/product-form';
import { RouterLink } from "@angular/router";
import { Product, ProductService } from '../services/product.service';
import { Warehouse, WarehouseService } from '../../warehouse/services/warehouse.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-list',
  imports: [ProductForm, RouterLink, FormsModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements  OnInit{

  private productService = inject(ProductService)
  private warehouseService = inject(WarehouseService)
  showForm = false
  searchTerm: string = '';
  selectedWarehouseFilter: number | null = null;
  selectedStatusFilter: string = '';
  warehouses = signal<Warehouse[]>([])
  products = signal<Product[]>([])


  ngOnInit(): void {
    this.fetchProducts()
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

  fetchProducts(): void{
    this.productService.getProduct().subscribe({
      next: (data) =>{
        this.products.set(data)
      },

      error: (err) =>{
        console.log(err);

      }
    })
 }
 onProductSaved(product: Product): void{
  this.fetchProducts()
 }

 filteredProducts(): Product[] {
     return this.products().filter((p) => {

      const matchNom = p.nom.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchWarehouse = this.selectedWarehouseFilter === null || p.warehouse === this.selectedWarehouseFilter;
      const matchStatus = this.selectedStatusFilter === '' || p.etat === this.selectedStatusFilter;    

      return matchNom && matchWarehouse && matchStatus;
     }
     );
   }


}
