

import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environnement } from "../../../../env";
import { Observable } from "rxjs";

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


  getProduct(): Observable<Product[]>{
    return this.http.get<Product[]>(this.baseUrl)
  }

  getById(id:number): Observable<Product>{
    return this.http.get<Product>(`${this.baseUrl}${id}/`)
  }

  addProduct(product: Omit<Product,'id'| 'utilisateur'>): Observable<Product>{
    return this.http.post<Product>(this.baseUrl, product)
  }

  updateProduct(product:Omit<Product, 'id'| 'utilisateur'>,id:number): Observable<Product>{
    return this.http.patch<Product>(`${this.baseUrl}${id}/`, product)
  }

  deleteProduct(id:number): Observable<void>{
    return this.http.delete<void>(`${this.baseUrl}${id}/`)
  }

  transfer(id: number, warehouseId:number): Observable<ProductTransferResponse>{
    return this.http.post<ProductTransferResponse>(`${this.baseUrl}${id}/transfer/`, {warehouse_id:warehouseId})

  }
}





