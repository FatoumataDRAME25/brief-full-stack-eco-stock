import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductTransfertModal } from '../product-transfert-modal/product-transfert-modal';

@Component({
  selector: 'app-product-detail',
  imports: [ProductTransfertModal],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail implements OnInit{

  
  showTransferModal = false;
  productId: string | null = null;
  constructor(private route: ActivatedRoute){}
  ngOnInit(): void {
    this.productId= this.route.snapshot.paramMap.get('id')
  }
}
