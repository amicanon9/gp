import { RolesService } from './../../../_services/roles.service';
import { ApiService } from 'app/_services/api.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { catchError, finalize, tap } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { TableComponent } from 'app/_components/sepv-table/sepv-table.component';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { forkJoin, from, throwError } from 'rxjs';
import { departmentsModalComponent } from './departments-modal/departments-modal.component';
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SignalrService } from 'app/_services/signalr.service';
@Component({
  selector: 'sepvdb-departments',
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.scss']
})

export class departmentsComponent implements OnInit {
  search: string;
  data: any;
  userlist:any;
  table_config: any = {
  checkable: true,
  serverSide: true,
  sort: {
    active: true,
    direction: 'desc',
    diableClear: true
  },
  columns: [
      { name: 'id', displayName: '部門ID' },
      { name: 'company_name', displayName: '所屬' },
      { name: 'dept_name', displayName: '部門名稱' },
      { name: 'manager_name', displayName: '部門主管' }, // 透過 mapping 產生
      { name: 'description', displayName: '說明' },
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
  deplist: any;
  booklist: any;


  constructor(
    private apiSvc: ApiService,
    private modalSvc: NgbModal,
    private toastr: ToastrService,
    private snackbar: MatSnackBar,
    private rolesSvc:RolesService,
    public signalRSvc: SignalrService, 
  ) { }

 async ngOnInit() {
  try {
    // 即使多個 Component 都寫這行，Service 內部也會擋掉重複的連線請求
    await this.signalRSvc.StartConnection();

    // 使用具名函式，方便之後取消監聽
    this.signalRSvc.Hub.on('departments', this.refreshData);

    this.loadData();
  } catch (err) {
    console.error('初始化失敗', err);
  }
}

// 使用 Arrow Function 確保 this 指向 Component
private refreshData = (data: any) => {
  console.log('收到 SignalR 通知更新');
  this.onDataRefresh();
}

ngOnDestroy() {
  // 記得在 Component 銷毀時移除監聽，避免重複執行 onDataRefresh
  this.signalRSvc.Hub.off('departments', this.refreshData);
}

  onSelect($event: any) {
    this.selected = $event;
  }
  onAdd() {
    const modalRef = this.modalSvc.open(departmentsModalComponent, { windowClass: "modal-mySize",backdrop:'static' });
    modalRef.componentInstance.title = "新增";
    modalRef.componentInstance.userlist = JSON.parse(JSON.stringify(this.userlist));
    modalRef.componentInstance.booklist = JSON.parse(JSON.stringify(this.booklist));
    modalRef.result.then((res: any) => {
      let data= res;
      this.apiSvc.createdata('departments',data).pipe(
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
    const modalRef = this.modalSvc.open(departmentsModalComponent, { windowClass: 'modal-mySize',backdrop:'static' });
    modalRef.componentInstance.title = "編輯";
    modalRef.componentInstance.userlist = JSON.parse(JSON.stringify(this.userlist));
    modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));
    modalRef.componentInstance.booklist = JSON.parse(JSON.stringify(this.booklist));
    modalRef.result.then((res: any) => {
      let data= res;
      console.log(data);
      this.apiSvc.updatedata('departments',this.selected.id, data).pipe(
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
      this.apiSvc.deletedata('departments',this.selected.id).pipe(
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
  forkJoin({
    deplist: this.apiSvc.getdata('Departments'),
    userlist: this.apiSvc.getdata('logininfo'),
    booklist: this.apiSvc.getSetOfBooks(),
  }).subscribe(({ deplist, userlist,booklist }) => {
    // 1. 賦值基礎清單
    this.deplist = deplist;
    this.userlist = userlist;
    this.booklist = booklist;
    // 3. 設定 Table Data
    this.dataSource = new MatTableDataSource<any>(deplist);
    this.loaded = true;
  });
}

}
