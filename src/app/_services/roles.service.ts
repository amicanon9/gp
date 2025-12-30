import { NavigationStart, Router } from '@angular/router';
import { AuthService } from 'app/_services/auth.service';
import { Menus } from './../_models/loginmenus';
import { LoginMenus } from 'app/_models/loginmenus';
import { Injectable, OnChanges } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ApiService } from './api.service';
import { filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  public roles$ = new BehaviorSubject<any[]>([]);
  public menus$ = new BehaviorSubject<Menus[]>([]);
  constructor(
    private apiSvc: ApiService,
    private authSvc:AuthService,
    private router:Router) {
      this.menus$.subscribe(x=>{
        let check;
        if(x&&x.length>0){
        x.forEach(x => {
          if (x.children.find(v => this.router.url.includes(v.url) || this.router.url == '/dashboard'))
          check=true
        });
        if (!check) {
          console.log(check)
          this.router.navigate(['/dashboard'])
        }
      }
      })
  }
  getRoles(){
    this.apiSvc.getRoles().subscribe(x => {
      this.roles$.next(x)
    })
  }
  getMenus(){
    this.apiSvc.getLoginMenus().subscribe((x:any) => {
      this.menus$.next(x.menus)
    })
  }

  switchrole(role_id){
    const access_token = localStorage.getItem('access_token');
    if (access_token) {
      this.apiSvc.switchrole(role_id)
          .subscribe(res => {
            if (res && res.token) {
              localStorage.setItem('access_token', res.token);
              this.authSvc.trySetSignInState(res.token);
              window.location.reload()
            }
          })

    }
  }
}
