import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap, filter, first } from 'rxjs/operators';
import { RolesService } from './_services/roles.service';

@Injectable({ providedIn: 'root' })
export class MenuGuard implements CanActivate {
  constructor(private roleSvc: RolesService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.roleSvc.menus$.pipe(
      filter(menus => menus != null), // 等待 menus 有資料
      map(menus => {
        if (menus.length === 0) return true; // 無權限限制則通過

        const hasAccess = menus.some(menu =>
          menu.children?.some(child =>
            state.url.includes(child.url) || state.url === '/dashboard'
          )
        );

        return hasAccess;
      }),
      tap(hasAccess => {
        if (!hasAccess) {
          this.router.navigate(['/dashboard']);
        }
      }),
      first()
    );
  }
}
