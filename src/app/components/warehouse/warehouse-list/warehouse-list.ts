import { Component, inject, OnInit, signal } from '@angular/core';
import { WarehouseCard } from '../warehouse-card/warehouse-card';
import { WarehouseForm } from '../warehouse-form/warehouse-form';
import { Warehouse, WarehouseService } from '../services/warehouse.service';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-warehouse-list',
  imports: [WarehouseCard, WarehouseForm, RouterLink],
  templateUrl: './warehouse-list.html',
  styleUrl: './warehouse-list.css',
})
export class WarehouseList implements OnInit{

  private warehouseService = inject(WarehouseService)
  warehouses = signal<Warehouse[]>([]);

  showForm = false;


  ngOnInit(): void {
    this.fetchWarehouses()
  }

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

  onWarehouseSaved(warehouse: Warehouse): void {
    this.fetchWarehouses()
  }

  closeForm(): void {
   this.showForm = false
  }
}

