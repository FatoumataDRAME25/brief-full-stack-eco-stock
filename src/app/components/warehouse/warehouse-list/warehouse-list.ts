import { Component, inject, OnInit, signal } from '@angular/core';
import { WarehouseCard } from '../warehouse-card/warehouse-card';
import { WarehouseForm } from '../warehouse-form/warehouse-form';
import { Warehouse, WarehouseService } from '../services/warehouse.service';
import { RouterLink } from "@angular/router";
import { Product, ProductService } from '../../products/services/product.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-warehouse-list',
  imports: [WarehouseCard, WarehouseForm,  FormsModule],
  templateUrl: './warehouse-list.html',
  styleUrl: './warehouse-list.css',
})
export class WarehouseList implements OnInit{

  private warehouseService = inject(WarehouseService);
  private productService = inject(ProductService);
  warehouses = this.warehouseService.warehouses;
  products = this.productService.products
  searchTerm = ''
  showForm = false;


  ngOnInit(): void {
    this.warehouseService.refreshWarehouses()
    this.productService.refreshProducts()
  }


  // fermeture automatique du modal apres enregistrement
  closeForm(): void {
   this.showForm = false
  }

  totalProduits(warehouseId: number): number {
  return this.products().filter((p) => p.warehouse === warehouseId).length;
}

filterWarehouse(): Warehouse[]{
  return this.warehouses().filter((w) =>
   w.nom.toLowerCase().includes(this.searchTerm.toLowerCase())
)}

}

