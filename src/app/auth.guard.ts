import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap, first } from 'rxjs/operators';
import { AuthService } from './_services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authSvc: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authSvc.signInState$.pipe(
      map(user => !!user), // 有登入傳 true
      tap(signedIn => {
        if (!signedIn) {
          this.router.navigate(['/login']);
        }
      }),
      first()
    );
  }
}
