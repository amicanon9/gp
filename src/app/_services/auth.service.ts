import { ApiService } from './api.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject, iif, Observable, of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';

export enum RoleEnum {
    Administrator = 'admin',
    User = 'user'
}

export interface TokenInfo {
    id: string;
    role?: RoleEnum[];
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    signInState$ = new BehaviorSubject<TokenInfo | null>(null);
    state;
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private jwtSvc: JwtHelperService,
        private apiSvc: ApiService,
    ) {
        if (localStorage.getItem('access_token')) {
            this.trySetSignInState(localStorage.getItem('access_token'));
        }
    }

    trySetSignInState(token: string | null, returnUrl?: string ,login?: boolean) {
        if (token) {
            if (this.jwtSvc.isTokenExpired(token)) {
                this.trySetSignInState(null);
            } else {
                localStorage.setItem('access_token', token);
                const state = this.jwtSvc.decodeToken(token as string) as TokenInfo;
                this.state=state
                this.signInState$.next(state);
                if(returnUrl == '/'){
                     this.router.navigateByUrl('/tools/checkin');
                }
                else if (returnUrl) {
                    this.router.navigateByUrl(returnUrl);
                }
            }
        } else {
            if (localStorage.getItem('access_token')) {
                localStorage.removeItem('access_token');
            }
            this.signInState$.next(null);
            this.router.navigate(['/login']);
        }
    }

  signIn(user: string, pass: string): Observable<{ token: string }> {
        const returnUrl = this.route.snapshot.queryParams.returnUrl || '/';
        return this.apiSvc.loginGetToken(user, pass).pipe(
            map(t => {
                if (t) {
                    this.trySetSignInState(t.token, returnUrl,true);
                }
                return t;
            }),
            catchError(err => {
                return throwError(err);
            }),
        );
    }

    signOut(): void {
        this.trySetSignInState(null);
    }
}
