import { Component, OnInit, Inject } from '@angular/core';
import { FavoriteService } from '../../favorite.service';

import { HttpClient } from '@angular/common/http';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';


export interface NewFavoriteDialogData {
  name: string;
}

export interface City {
  ID: number;
  Name: string;
}
export interface Favorite {
  ID: string;
  Name: string;
  Cities: City[];
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html'
})
export class HomeComponent implements OnInit {

  favorites: Favorite[];
  errorMessage
  edit: boolean = false


  constructor(private http: HttpClient, public dialog: MatDialog, private favoriteService: FavoriteService) { }

  ngOnInit() {
    this.favoriteService.getFavorites().subscribe((data : Favorite[])=>{
      this.favorites = data;
      this.edit = this.favorites.length == 0 ? true : false
    }, (error) => {
      console.log(error)
    })
  }
  delete(favorite) {
    this.favoriteService.deleteFavorite(favorite.ID).subscribe(() => {
            this.favorites = this.favorites.filter(data => data.ID != favorite.ID)
        }, (error) => {
            this.errorMessage = error.message;
            console.error('There was an error!', error);
        }
    )
  }
  openDialog(): void {
    const dialogRef = this.dialog.open(DialogAddFavorites, {
      data: { name: "" },
      width: '250px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result) {
          this.favoriteService.createFavorite({"Name": result,"Cities":[]}).subscribe((data : Favorite) => {
                let newfavorites: Favorite = {
                  "Name" : result,
                  "ID" : data.ID,
                  "Cities" : []
                };
                this.favorites.push(newfavorites);
            }, (error) => {
                this.errorMessage = error.message;
                console.error('There was an error!', error);
            }
        )
      }
    });
  }
}



@Component({
  selector: 'dialog-add-favorites',
  templateUrl: 'dialog.component.html'
})
export class DialogAddFavorites {

  constructor(
    public dialogRef: MatDialogRef<DialogAddFavorites>,
    @Inject(MAT_DIALOG_DATA) public data: NewFavoriteDialogData) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

}
