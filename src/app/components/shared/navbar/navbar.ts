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
  private warehouseService = inject(WarehouseService)
  warehouses = this.warehouseService.warehouses

  username = this.loginService.getUsername();
  searchTerm = ''


  ngOnInit(): void {

    this.warehouseService.refreshWarehouses()
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
