import { Component, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product, ProductService } from '../services/product.service';
import { Warehouse, WarehouseService } from '../../warehouse/services/warehouse.service';

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css',
})
export class ProductForm implements OnInit{
  @Output() fermer = new EventEmitter<void>()
  @Output() saved = new EventEmitter<Product>();

  private fb = inject(FormBuilder)
  private productService = inject(ProductService)
  private warehouseService = inject(WarehouseService)
  warehouses = signal<Warehouse[]>([])

  form= this.fb.nonNullable.group({
    nom: ['', [Validators.required]],
    quantite: [0, [Validators.required]],
    date_expiration: ['', [Validators.required]],
    etat: ['disponible'as Product['etat'], [Validators.required]],
    warehouse: [0, [Validators.required]]
  })

  onSubmit(): void{
    this.productService.addProduct(this.form.getRawValue()).subscribe({
      next: (data) =>{
        this.saved.emit(data)
        this.fermer.emit()
      },
      error: (err) =>{
        console.log(err);

      }
    })
  }

  ngOnInit(): void {
    this.warehouseService.getWarehouse().subscribe({
      next: (data) =>{
        this.warehouses.set(data)
      },
      error: (err) =>{
        console.log(err);

      }
    })
  }

}
