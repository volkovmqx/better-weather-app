import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {

  API_URL: string = 'http://localhost:3000/';
  constructor(private http: HttpClient) { }
  getFavorites(){    
   return this.http.get(this.API_URL + 'favorites')
  }
  getFavorite(ID){
   return this.http.get(`${this.API_URL + 'favorite'}/${ID}`) 
  }
  search(query) {
    return this.http.get(`${this.API_URL + 'search'}/${query}`) 
  }
}