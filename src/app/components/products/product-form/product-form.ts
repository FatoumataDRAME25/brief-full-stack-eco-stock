import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
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
  @Input() product: Product | null = null

  private fb = inject(FormBuilder)
  private productService = inject(ProductService)
  private warehouseService = inject(WarehouseService)
  warehouses = signal<Warehouse[]>([])

  form= this.fb.nonNullable.group({
    nom: ['', [Validators.required]],
    quantite: [0, [Validators.required, Validators.min(1)]],
    date_expiration: ['', [Validators.required]],
    etat: ['disponible'as Product['etat'], [Validators.required]],
    warehouse: [0, [Validators.required, Validators.min(1)]]
  })

  get nom() {return this.form.get('nom')}
  get quantite() {return this.form.get('quantite')}
  get date_expiration() {return this.form.get('date_expiration')}
  get etat() {return this.form.get('etat')}
  get warehouse() {return this.form.get('warehouse')}

  onSubmit(): void{


    if(this.form.invalid){
      alert('Veuillez verifier que tous les champs du forumlaire sont valides')
      return
    }
    const payload = this.form.getRawValue()
    const move = this.product !== null

    ? this.productService.updateProduct(payload, this.product.id)
    : this.productService.addProduct(payload)
    move.subscribe({
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

    if (this.product !== null) {
      this.form.patchValue({
        nom: this.product.nom,
        quantite: this.product.quantite,
        date_expiration: this.product.date_expiration,
        etat: this.product.etat,
        warehouse: this.product.warehouse
      })
    }
  }

}
