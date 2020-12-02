import { Component, OnInit, Inject } from '@angular/core';
import { FavoriteService } from '../../favorite.service';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {switchMap, debounceTime, distinctUntilChanged, filter} from 'rxjs/operators';
import {FormControl} from '@angular/forms';



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
  selector: 'app-favorite',
  template: `
    <mat-grid-list cols="4" rowHeight="3:3" [gutterSize]="'10px'">
    <mat-grid-tile *ngFor="let city of cities">
      <mat-card class="mat-focus-indicator card text-center">
          <button mat-mini-fab color="warn" class="delete-button" *ngIf="edit" (click)="delete(city)">
            <mat-icon>delete</mat-icon>
          </button>
          <img [src]="'http://openweathermap.org/img/wn/'+city.weather[0].icon+'@2x.png'" alt="" />
          <mat-card-title class="card-header">{{city.name}} <br>{{city.weather[0].description}} {{city.main.temp| number:'1.0-0'}}°C</mat-card-title>
        
        <div class="card-divider"></div>
        <mat-card-content class="mat-card-content docs-guide-card-summary">
        <p>
          
        Feels like: <span>{{city.main.feels_like| number:'1.0-0'}}°C</span>
        Max:  <span>{{city.main.temp_max| number:'1.0-0'}}°C</span>
        Min:  <span>{{city.main.temp_min| number:'1.0-0'}}°C</span>
        
        </p>
        <mat-divider [inset]="true"></mat-divider>
        <p>
        Humidity:  <span>{{city.main.humidity}}%</span>
        Pressure:  <span>{{city.main.pressure}}hPa</span>
        </p>
        <mat-divider [inset]="true"></mat-divider>
        <p>
        Sunrise: <span>{{ timeStampToTime(city.sys.sunrise) }}</span>
        Sunset: <span>{{ timeStampToTime(city.sys.sunset) }}</span>
        </p>
        </mat-card-content>
      </mat-card>
    
    </mat-grid-tile>
    <mat-grid-tile>   
      <button mat-raised-button color="warn" *ngIf="edit" (click)="openDialog()">Add new City <mat-icon>add</mat-icon></button>
    </mat-grid-tile>
  </mat-grid-list>
  <nav>
    <a mat-raised-button color="warn" [routerLink]="'/'"><mat-icon>keyboard_arrow_left</mat-icon></a>
    <button mat-raised-button color="warn"  (click)="edit = !edit" class="edit-button">{{edit ? 'close' : 'open'}} edit mode</button>
  </nav>
  `,
  styles: [
  ]
})
export class FavoriteComponent implements OnInit {

  cities: Array<any>
  favorite: Favorite
  errorMessage
  edit: boolean = false

  constructor(private http: HttpClient, public dialog: MatDialog, private favoriteService: FavoriteService, private route: ActivatedRoute) { }
  
  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.favoriteService.getFavorite(params.get('id')).subscribe((data : any)=>{
        this.cities = data.list || []
        this.favorite = data.favorite
        this.edit = data.favorite.Cities.length == 0 ? true : false
      }, (error) => {
        console.log(error)
      }
      )   
    });

  }
  timeStampToTime(timeStamp) {
    let date = new Date(timeStamp*1000)
    var hours = date.getHours();
    var minutes = "0" + date.getMinutes();
    return hours + ':' + minutes.substr(-2);
  }
  delete(city) {
    this.favorite.Cities = this.favorite.Cities.filter(data => data.ID != city.id)
    this.synchronize(() => {
      this.cities = this.cities.filter(data => data.id != city.id)
    }, (error) => {
      this.errorMessage = error.message;
      console.error('There was an error!', error);
    })
  }
  synchronize(callback, errorCallback) {
    this.http.put<any>('http://localhost:3000/favorites', this.favorite).subscribe({
      next: (data) => {
         callback(data)
      },
      error: error => {
        errorCallback(error)
      }
   })
  }
  openDialog(): void {
    const dialogRef = this.dialog.open(DialogAddCity, {
      width: '350px'
    });

    dialogRef.afterClosed().subscribe(result => {
        this.favorite.Cities.push({
          ID: result.id,
          Name: result.name
        })
        this.synchronize(() => {
          this.cities.push(result);
        }, (error) => {
          this.errorMessage = error.message;
          console.error('There was an error!', error);
        })
    });
  }

}

@Component({
  selector: 'dialog-add-favorites',
  styleUrls: ['favorite.component.scss'],
  template: `


  <div mat-dialog-content>
    <p>Looking for a city?</p>
    <form class="form">
    <mat-form-field class="full-width">
      <input matInput
            placeholder="City"
            aria-label="City"
            [matAutocomplete]="auto"
            [formControl]="cityCtrl">
      <mat-autocomplete #auto="matAutocomplete">
        <mat-option *ngIf="city?.id" [value]="city.name" >
          <img class="option-img" aria-hidden [src]="'http://openweathermap.org/img/wn/'+city.weather[0].icon+'@2x.png'" height="25">
          <span>{{city.name}}</span> |
          <small>{{city.weather[0].description}} <span> {{city.main.temp| number:'1.0-0'}}°C </span></small>
        </mat-option>
      </mat-autocomplete>
    </mat-form-field>
  </form>
  </div>
  <div mat-dialog-actions>
    <button mat-button (click)="onNoClick()">Cancel</button>
    <button mat-button [mat-dialog-close]="city" cdkFocusInitial>Ok</button>
  </div>
  `
})

export class DialogAddCity {

  cityCtrl = new FormControl();
  city
  constructor(
    private favoriteService: FavoriteService,
    public dialogRef: MatDialogRef<DialogAddCity>) {
      this.cityCtrl.valueChanges
      .pipe(
        filter(value => value != ""),
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((value) => this.favoriteService.search(value))
        )
        .subscribe({
          next: city => {
            this.city = city
          }
      })
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
}
