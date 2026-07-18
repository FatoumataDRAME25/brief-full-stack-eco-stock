import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environnement } from "../../../../env";
import { Observable, tap } from "rxjs";
import { Router } from "@angular/router";

export interface IdentifyLogin{
  username:string;
  password:string
}

export interface AuthTokens {
  access: string;
  refresh: string;
  }

@Injectable({providedIn: 'root'})
export class LoginService {
  private router =inject(Router)
  private http = inject(HttpClient)
  private baseUrl = `${environnement.apiurl}token/`

  //Fonction pour la connexion et le stockage des tokens dans le local storage
  login(identify: IdentifyLogin): Observable<AuthTokens>{
    return this.http.post<AuthTokens>(this.baseUrl, identify).pipe(tap((reponse) =>{
      localStorage.setItem('access_token', reponse.access);
      localStorage.setItem('refresh_token', reponse.refresh);
      localStorage.setItem('username', identify.username);
    }))
  }


  getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

  getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}
// Fonction pour ladeconnexion
logout(): void{
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('username')
  this.router.navigate(['/login'])
}

//Fonction retournant true/false pour sur la connectivite d'un utilisateur
isLoggedIn():boolean{
  if(this.getAccessToken()!==null){
    return true;
  }                                    // ou return !!this.getAccessToken(); qui est l'equivalent du if/else
  else{
    return false;
  }
}

getUsername(): string | null {
  return localStorage.getItem('username');
}
}
