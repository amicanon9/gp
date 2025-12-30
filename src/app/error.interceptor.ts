import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import { AuthService } from './_services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private authSvc: AuthService) {

  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((err) => {
        const errorResponse = err as HttpErrorResponse;
        switch (errorResponse.status) {
          case 401:
            this.authSvc.signOut();
            break;
        }
        return throwError(err);
      })) as Observable<HttpEvent<any>>;
  }
}
