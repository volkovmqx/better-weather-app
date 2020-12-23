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
  templateUrl: 'favorite.component.html'
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
  templateUrl: 'dialog.component.html'
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
