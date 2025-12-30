import { RolesService } from '../../../_services/roles.service';
import { ApiService } from 'app/_services/api.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { catchError, finalize, tap } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { TableComponent } from 'app/_components/sepv-table/sepv-table.component';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { throwError } from 'rxjs';
import { LoginRoles, LoginRolesTableConfig } from 'app/_models/loginroles';
import { LoginRolesModalComponent } from './loginroles-modal/loginroles-modal.component';
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DroplistService } from 'app/_services/droplist.service';
import { SignalrService } from 'app/_services/signalr.service';
@Component({
  selector: 'sepvdb-loginroles',
  templateUrl: './loginroles.component.html',
  styleUrls: ['./loginroles.component.scss']
})
export class LoginRolesComponent implements OnInit {
  search: string;
  data: any;
  menulist: any;
  table_config: any = {
  checkable: true,
  serverSide: true,
  sort: {
    active: true,
    direction: 'desc',
    diableClear: true
  },
  columns: [
    // { name: 'id', displayName: '角色ID' },
    { name: 'role_name', displayName: '角色名稱' },
    { name: 'description', displayName: '說明', width: 200 },
    { name: 'company_name', displayName: '所屬' },
    { name: 'menus', displayName: '目錄權限', templateRef:'menus' },
    { name: 'disabled', displayName: '是否停用', templateRef: 'disabled' },
    { name: 'permission_level', displayName: '功能權限',templateRef: 'permissions'},
    { name: 'is_admin', displayName: '最高權限', templateRef: 'boolean' }
  ]
};
  dataSource!: MatTableDataSource<any>;
  subs: any;
  ticket: any;
  maxTableHeight = '700px';
  minTableHeight = 'unset';
  selected: any;
  @ViewChild('namiTable') namiTable!: TableComponent;
  loaded = false;
  booklist;
  constructor(
    private apiSvc: ApiService,
    private modalSvc: NgbModal,
    private toastr: ToastrService,
    private snackbar: MatSnackBar,
    private rolesSvc:RolesService,
    private dropSvc: DroplistService,
    public signalRSvc: SignalrService, 
  ) { 
  }

  ngOnInit() {
    this.signalRSvc.StartConnection()
        this.signalRSvc.ReceiveListener()?.on('login_role', (data) => {
          this.onDataRefresh();
        })
    this.loadData();
  }

  onSelect($event: any) {
    this.selected = $event;
  }
  onAdd() {
    const modalRef = this.modalSvc.open(LoginRolesModalComponent, { windowClass: "modal-mySize",backdrop:'static' });
    modalRef.componentInstance.title = "新增角色資訊";
    modalRef.componentInstance.menulist = JSON.parse(JSON.stringify(this.menulist));
    modalRef.componentInstance.booklist = JSON.parse(JSON.stringify(this.booklist));
    modalRef.result.then((res: any) => {
      let data: LoginRoles = res;
      this.apiSvc.createLoginRoles(data).pipe(
        catchError(err => {
         var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '新增失敗';
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
    const modalRef = this.modalSvc.open(LoginRolesModalComponent, { windowClass: 'modal-mySize',backdrop:'static' });
    modalRef.componentInstance.title = "編輯角色資訊";
    modalRef.componentInstance.menulist = JSON.parse(JSON.stringify(this.menulist));
    modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));
    modalRef.componentInstance.booklist = JSON.parse(JSON.stringify(this.booklist));
    modalRef.result.then((res: any) => {
      let data: LoginRoles = res;
      console.log(data);
      this.apiSvc.updateLoginRoles(this.selected.id, data).pipe(
        catchError(err => {
          var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '編輯失敗';
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
      this.apiSvc.deleteLoginRoles(this.selected.id).pipe(
        catchError(err => {
         var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '刪除失敗，需先刪除對應的使用者';
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
    this.apiSvc.getSetOfBooks().subscribe(e=>this.booklist=e)
    this.dropSvc.getMenulist().subscribe((data:any[]) => this.menulist = data.filter(item => item.parent != null))
    this.apiSvc.getLoginRoles()
      .pipe(
        tap((data: LoginRoles[]) => {
          this.dataSource = new MatTableDataSource<any>(data);
          this.loaded = true;
        })
      )
      .subscribe()
  }

}
