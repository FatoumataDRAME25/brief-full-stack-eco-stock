import { RouterLink } from '@angular/router';
import { Product, ProductService } from '../products/services/product.service';
import { Warehouse, WarehouseService } from './../warehouse/services/warehouse.service';
import { Component, inject, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit{

  private warehouseService = inject(WarehouseService);
  private productService = inject(ProductService);
  warehouses = signal<Warehouse[]>([]);
  products = signal<Product[]>([]);


  ngOnInit(): void {
    this.fetchWarehouse()
    this.fetchProduit()

  }



  fetchWarehouse(): void{
    this.warehouseService.getWarehouse().subscribe({
      next: (data) =>{
        this.warehouses.set(data)
      },
      error: (err) =>{
        console.log(err);

      }
    })
  }

  fetchProduit(): void{
    this.productService.getProduct().subscribe({
      next: (data) => {
        this.products.set(data)
      },
      error: (err) =>{
        console.log(err);

      }
    })
  }
  totalProduit(): number{
    return this.products().length
  }

  totalEntrepots(): number {
  return this.warehouses().length
}

  produitDisponibles(): number{
    return this.products().filter(d => d.etat ==="disponible").length
  }

  produitReserves(): number{
    return this.products().filter(r => r.etat ==="reserve").length
  }


  produitPerimes(): number{
    return this.products().filter(p => p.etat ==="perime").length
  }


  produitsAlerteExpiration(): Product[] {
    const dansSeptJours = new Date();
    dansSeptJours.setDate(dansSeptJours.getDate() + 7);

    return this.products().filter((p) => new Date(p.date_expiration) <= dansSeptJours)
     .sort((a, b) => new Date(a.date_expiration).getTime() - new Date(b.date_expiration).getTime());
  }
}
