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
  createFavorite(favorite){
    return this.http.post(this.API_URL + 'favorites', favorite)
  }
  updateFavorite(favorite){
    return this.http.put(this.API_URL + 'favorites', favorite)
  }
  deleteFavorite(ID){
    return this.http.delete(this.API_URL + 'favorites', ID)
  }
  search(query) {
    return this.http.get(`${this.API_URL + 'search'}/${query}`) 
  }

}