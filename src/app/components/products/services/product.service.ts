

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

  addProduct(product: Omit<Product,'id'>): Observable<Product>{
    return this.http.post<Product>(this.baseUrl, product)
  }

  updateProduct(product:Omit<Product, 'id'>,id:number): Observable<Product>{
    return this.http.patch<Product>(`${this.baseUrl}${id}/`, product)
  }

  deleteProduct(id:number): Observable<void>{
    return this.http.delete<void>(`${this.baseUrl}${id}/`)
  }
}





