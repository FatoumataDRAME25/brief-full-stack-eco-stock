import { Component, inject, OnInit, signal } from '@angular/core';
import { LoginService } from '../../auth/services/login.service';
import { Product, ProductService } from '../../products/services/product.service';
import { Warehouse, WarehouseService } from '../../warehouse/services/warehouse.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [FormsModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit{

  private loginService = inject(LoginService)
  private productService = inject(ProductService)
  private warehouseService = inject(WarehouseService)
  products = signal<Product[]>([])
  warehouses = signal<Warehouse[]>([])

  username = this.loginService.getUsername();
  searchTerm = ''


  ngOnInit(): void {
    this.productService.getProduct().subscribe({
      next: (data) => {
        this.products.set(data)
      },
      error: (err) => {
        console.log(err);

      }
    })

    this.warehouseService.getWarehouse().subscribe({
      next: (data) =>{
        this.warehouses.set(data)
      },
      error: (err) => {
        console.log(err);

      }
    })
  }

  matchingProducts(): Product[] {
  if (this.searchTerm.trim() === '') {
    return [];
  }
  return this.products()
    .filter((p) => p.nom.toLowerCase().includes(this.searchTerm.toLowerCase()))
    .slice(0, 5);
}

matchingWarehouses(): Warehouse[] {
  if (this.searchTerm.trim() === '') {
    return [];
  }
  return this.warehouses()
    .filter((w) => w.nom.toLowerCase().includes(this.searchTerm.toLowerCase()))
    .slice(0, 5);
}
}
