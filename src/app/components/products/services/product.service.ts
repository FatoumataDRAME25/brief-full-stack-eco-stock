

import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { environnement } from "../../../../env";
import { Observable, tap } from "rxjs";

export interface Product{
  id: number
  nom: string;
  quantite: number;
  date_expiration: string;
  etat: 'disponible' | 'reserve' | 'perime';
  utilisateur: number
  warehouse: number

}

export interface ProductTransferResponse {
  message: string;
  product: Product;
}

@Injectable({providedIn: 'root'})

export class ProductService{

  private http = inject(HttpClient)
  private baseUrl = `${environnement.apiurl}products/`
  private productSignal = signal<Product[]>([]);
  readonly products = this.productSignal.asReadonly();


  refreshProducts(): void {
    this.getProduct().subscribe({
      next: (data) => this.productSignal.set(data),
      error: (err) => console.log(err),
    });
  }


  getProduct(): Observable<Product[]>{
    return this.http.get<Product[]>(this.baseUrl)
  }

  getById(id:number): Observable<Product>{
    return this.http.get<Product>(`${this.baseUrl}${id}/`)
  }

  addProduct(product: Omit<Product,'id'| 'utilisateur'>): Observable<Product>{
    return this.http.post<Product>(this.baseUrl, product).pipe(tap(() => this.refreshProducts()) )
  }

  updateProduct(product:Omit<Product, 'id'| 'utilisateur'>,id:number): Observable<Product>{
    return this.http.patch<Product>(`${this.baseUrl}${id}/`, product).pipe(tap(() => this.refreshProducts()) )
  }

  deleteProduct(id:number): Observable<void>{
    return this.http.delete<void>(`${this.baseUrl}${id}/`).pipe(tap(() => this.refreshProducts()) )
  }

  transfer(id: number, warehouseId:number): Observable<ProductTransferResponse>{
    return this.http.post<ProductTransferResponse>(`${this.baseUrl}${id}/transfer/`, {warehouse_id:warehouseId}).pipe(tap(() => this.refreshProducts()))

  }
}





