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
  template: `
  <mat-grid-list cols="4" rowHeight="3:2" [gutterSize]="'10px'">
    <mat-grid-tile *ngFor="let favorite of favorites">
      <mat-card class="mat-focus-indicator card">
        <button mat-mini-fab color="warn" class="delete-button" *ngIf="edit" (click)="delete(favorite)">
          <mat-icon>delete</mat-icon>
        </button>
       
          <mat-card-title class="card-header"> <a [routerLink]="['/favorite', favorite.ID]">{{favorite.Name}} </a>  </mat-card-title>
       
        <div class="card-divider" *ngIf="favorite.Cities.length > 0"></div>
        <mat-card-content class="mat-card-content docs-guide-card-summary">
        <p><span *ngFor="let city of favorite.Cities;let i = index">{{city.Name}} {{i < favorite.Cities.length -1 ? ', ': ''}} </span></p>
        </mat-card-content>
      </mat-card>
    
    </mat-grid-tile>
    <mat-grid-tile>     
      <button mat-raised-button color="warn" (click)="openDialog()" *ngIf="edit">Add new Collection <mat-icon>add</mat-icon></button>
    </mat-grid-tile>
  </mat-grid-list>
  <nav>
    <button mat-raised-button color="warn"  (click)="edit = !edit" class="edit-button">{{edit ? 'close' : 'open'}} edit mode</button>
  </nav>
  `
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
    this.http.delete<any>('http://localhost:3000/favorites/' + favorite.ID).subscribe({
        next: data => {
            this.favorites = this.favorites.filter(data => data.ID != favorite.ID)
        },
        error: error => {
            this.errorMessage = error.message;
            console.error('There was an error!', error);
        }
    })
  }
  openDialog(): void {
    const dialogRef = this.dialog.open(DialogAddFavorites, {
      data: { name: "" },
      width: '250px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result) {
          this.http.post<any>('http://localhost:3000/favorites', {"Name": result,"Cities":[]}).subscribe({
            next: (data) => {
                let newfavorites: Favorite = {
                  "Name" : result,
                  "ID" : data.ID,
                  "Cities" : []
                };
                this.favorites.push(newfavorites);
            },
            error: error => {
                this.errorMessage = error.message;
                console.error('There was an error!', error);
            }
        })
      }
    });
  }
}



@Component({
  selector: 'dialog-add-favorites',
  template: `
  <div mat-dialog-content>
    <p>What should we call the new collection?</p>
    <mat-form-field>
      <mat-label>Name</mat-label>
      <input matInput [(ngModel)]="data.name" placeholder="...">
    </mat-form-field>
  </div>
  <div mat-dialog-actions>
    <button mat-button (click)="onNoClick()">Cancel</button>
    <button mat-button [mat-dialog-close]="data.name" cdkFocusInitial>Ok</button>
  </div>
  `
})
export class DialogAddFavorites {

  constructor(
    public dialogRef: MatDialogRef<DialogAddFavorites>,
    @Inject(MAT_DIALOG_DATA) public data: NewFavoriteDialogData) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

}
