import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Warehouse, WarehouseService } from '../services/warehouse.service';



@Component({
  selector: 'app-warehouse-form',
  imports: [ReactiveFormsModule],
  templateUrl: './warehouse-form.html',
  styleUrl: './warehouse-form.css',
})
export class WarehouseForm implements OnInit{

  @Output() fermer= new EventEmitter <void>();
  @Output() saved = new EventEmitter<Warehouse>();

  private fb = inject(FormBuilder)
  private warehouseService =inject(WarehouseService)
  @Input() warehouse: Warehouse | null = null;


  form = this.fb.nonNullable.group({
    nom : ['', [Validators.required, Validators.maxLength(100)]],
    localisation: ['', [Validators.required, Validators.maxLength(200)]],
    capacite : [0, [Validators.required, Validators.min(1)]]
  })

  get nom() {return this.form.get('nom')}
  get localisation() {return this.form.get('localisation')}
  get capacite() {return this.form.get('capacite')}

  onSubmit(): void{

    if(this.form.invalid){
      alert('Veuillez verifier que tous les champs du forumlair sont valides')
      return
    }
    const payload = this.form.getRawValue()
    const move = this.warehouse !== null
    ? this.warehouseService.updateWarehouse(payload, this.warehouse.id)
    : this.warehouseService.addWarehouse(payload);
    move.subscribe({
      next: (data) =>{
        this.saved.emit(data);
        this.fermer.emit();
      },
      error: (err) =>{
        console.log(err);

      }
    })
  }

  ngOnInit(): void {
    if(this.warehouse !== null) {
      this.form.patchValue({
        nom: this.warehouse.nom,
        localisation: this.warehouse.localisation,
        capacite: this.warehouse.capacite
      })
    }
  }
}
