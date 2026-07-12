
import { HttpClient } from '@angular/common/http';
import { environnement } from '../../../../env';
import { inject, Injectable } from "@angular/core";
import { Observable } from 'rxjs';

export interface Warehouse{
  id: number;
  nom:string;
  localisation:string;
  capacite: number
}
@Injectable({providedIn: 'root'})

export class WarehouseService{
  private http= inject(HttpClient)
  private baseUrl = `${environnement.apiurl}warehouses/`

  //Voir la liste de tous les entrepots
  getWarehouse(): Observable<Warehouse[]>{
    return this.http.get<Warehouse[]>(this.baseUrl)
  }


  //Fonction pour afficher le detail d'un entrepot
  getById(id: number): Observable<Warehouse>{
    return this.http.get<Warehouse>(`${this.baseUrl}${id}/`)
  }

  // Fonction permettant d'ajouter un nouveau entrepot
  addWarehouse(warehouse: Omit<Warehouse, 'id'>): Observable<Warehouse>{
    return this.http.post<Warehouse>(this.baseUrl, warehouse)
  }

  //Fonction pour modifier un entrepot
  updateWarehouse(warehouse: Omit<Warehouse, 'id'>, id:number): Observable<Warehouse>{
    return this.http.patch<Warehouse>(`${this.baseUrl}${id}/`, warehouse)
  }

  //Fonction pour supprimer un entrrepot
  deleteWarehouse(id:number): Observable<void>{
    return this.http.delete<void>(`${this.baseUrl}${id}/`)
  }

}
