import { AuthService } from './../../_services/auth.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import * as XLSX from 'xlsx';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  formLogin = this.fb.group({
    user: [null, Validators.required],
    pass: [null, Validators.required],
  });

  processing = false;

  constructor(
    private fb: FormBuilder,
    private authSvc: AuthService,
    private toastr: ToastrService
  ) {

  }

  ngOnInit(): void {

  }

  login(): void {
    this.processing = true;
    this.authSvc.signIn(
      this.formLogin.value.user,
      this.formLogin.value.pass
    ).pipe(
      catchError(err => {
        if (err.status === 429) {
          this.toastr.error(
            '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
            '送出太多請求，請稍候再試'
            + '</span>',
            "",
            {
              timeOut: 3000,
              closeButton: true,
              enableHtml: true,
              toastClass: "alert alert-error alert-with-icon",
              positionClass: "toast-top-center"
            }
          );
        } else if (err.status === 403) {
          this.toastr.error(
            '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
            '帳號不存在或密碼錯誤'
            + '</span>',
            "",
            {
              timeOut: 3000,
              closeButton: true,
              enableHtml: true,
              toastClass: "alert alert-error alert-with-icon",
              positionClass: "toast-top-center"
            }
          );
        } else {
         this.toastr.error(
            '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
            '登入時發生問題，需先檢查網路狀況'
            + '</span>',
            "",
            {
              timeOut: 3000,
              closeButton: true,
              enableHtml: true,
              toastClass: "alert alert-error alert-with-icon",
              positionClass: "toast-top-center"
            }
          );
        }
        return throwError(err);
      }),
      finalize(() => {
        this.processing = false;
      })
    ).subscribe();
  }
}
