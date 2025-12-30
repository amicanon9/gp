import { RolesService } from './../../../_services/roles.service';
import { ApiService } from 'app/_services/api.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { catchError, finalize, tap } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { TableComponent } from 'app/_components/sepv-table/sepv-table.component';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { from, throwError } from 'rxjs';
import { LoginInfo, LoginInfoTableConfig } from "app/_models/logininfo";
import { LoginInfoModalComponent } from './logininfo-modal/logininfo-modal.component';
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SignalrService } from 'app/_services/signalr.service';
@Component({
  selector: 'sepvdb-logininfo',
  templateUrl: './logininfo.component.html',
  styleUrls: ['./logininfo.component.scss']
})
export class LoginInfoComponent implements OnInit {
  search: string;
  data: any;
  roles: any;
  booklist:any;
  table_config: any = LoginInfoTableConfig;
  dataSource!: MatTableDataSource<any>;
  subs: any;
  ticket: any;
  maxTableHeight = '700px';
  minTableHeight = 'unset';
  selected: any;
  @ViewChild('namiTable') namiTable!: TableComponent;
  loaded = false;

  constructor(
    private apiSvc: ApiService,
    private modalSvc: NgbModal,
    private toastr: ToastrService,
    private snackbar: MatSnackBar,
    private rolesSvc:RolesService,
    public signalRSvc: SignalrService, 
  ) { }

  ngOnInit() {
    this.signalRSvc.StartConnection()
        this.signalRSvc.ReceiveListener()?.on('login_info', (data) => {
          this.onDataRefresh();
        })
    this.loadData();
    
  }

  onSelect($event: any) {
    this.selected = $event;
  }
  onAdd() {
    const modalRef = this.modalSvc.open(LoginInfoModalComponent, { windowClass: "modal-mySize",backdrop:'static' });
    modalRef.componentInstance.title = "新增使用者資訊";
    modalRef.componentInstance.roles = JSON.parse(JSON.stringify(this.roles));
    modalRef.componentInstance.booklist = JSON.parse(JSON.stringify(this.booklist));
    modalRef.result.then((res: any) => {
      let data: LoginInfo = res;
      this.apiSvc.createLoginInfo(data).pipe(
        catchError(err => {
          var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '新增失敗，重複的使用者名稱';
          }
          this.toastr.error(
            '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
            errorMessage
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
          return throwError(err);
        })
      )
        .subscribe(e => {
          this.toastr.success(
            '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
            '新增成功'
            + '</span>',
            "",
            {
              timeOut: 3000,
              closeButton: true,
              enableHtml: true,
              toastClass: "alert alert-success alert-with-icon",
              positionClass: "toast-top-center"
            }
          );
          this.rolesSvc.getRoles();
        });
    }).catch(() => { });
  }
  onEdit() {
    const modalRef = this.modalSvc.open(LoginInfoModalComponent, { windowClass: 'modal-mySize',backdrop:'static' });
    modalRef.componentInstance.title = "編輯使用者資訊";
    modalRef.componentInstance.roles = JSON.parse(JSON.stringify(this.roles));
    modalRef.componentInstance.booklist = JSON.parse(JSON.stringify(this.booklist));
    modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));
    modalRef.result.then((res: any) => {
      let data: LoginInfo = res;
      console.log(data);
      this.apiSvc.updateLoginInfo(this.selected.id, data).pipe(
        catchError(err => {
          var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '編輯失敗，重複的使用者名稱';
          }
          this.toastr.error(
            '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
            errorMessage
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
          return throwError(err);
        })
      ).subscribe(e => {
        this.toastr.success(
          '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
          '編輯成功'
          + '</span>',
          "",
          {
            timeOut: 3000,
            closeButton: true,
            enableHtml: true,
            toastClass: "alert alert-success alert-with-icon",
            positionClass: "toast-top-center"
          }
        );
        this.rolesSvc.getRoles();
      }
      );
    }).catch(() => { });
  }
  onDelete() {
    const ref = this.snackbar.open('你確定要刪除嗎?', '確定', {
  duration: 3000,
  panelClass: ['alert-danger', 'alert'],
  verticalPosition: 'top',         // 加這行：top、bottom（預設）
  horizontalPosition: 'center',    // 可選：start、center、end、left、right
});    ref.onAction().subscribe(() => {
      this.apiSvc.deleteLoginInfo(this.selected.id).pipe(
        catchError(err => {
         var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '刪除失敗';
          }
          this.toastr.error(
            '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
            errorMessage
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
          return throwError(err);
        })
      ).subscribe(e => {
        this.toastr.success(
          '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
          '刪除成功'
          + '</span>',
          "",
          {
            timeOut: 3000,
            closeButton: true,
            enableHtml: true,
            toastClass: "alert alert-success alert-with-icon",
            positionClass: "toast-top-center"
          }
        );
        this.rolesSvc.getRoles();
      }
      );
    })
  }
  onDataRefresh() {
    this.selected = null;
    this.loadData()
  }
  loadData() {
    this.apiSvc.getLoginRoles().subscribe(data => this.roles = data);
    this.apiSvc.getSetOfBooks().subscribe(data=>this.booklist=data)
    this.apiSvc.getLoginInfo()
      .pipe(
        tap((data: LoginInfo[]) => {
          this.dataSource = new MatTableDataSource<any>(data);
          this.loaded = true;
        })
      )
      .subscribe()
  }

}
