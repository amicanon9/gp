import { ApiService } from 'app/_services/api.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { catchError, finalize, tap } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { TableComponent } from 'app/_components/sepv-table/sepv-table.component';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { forkJoin, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DroplistService } from 'app/_services/droplist.service';
import { MatDialog } from '@angular/material/dialog';
import * as XLSX from 'xlsx';
import { SignalrService } from 'app/_services/signalr.service';
import { taskmasterModalComponent } from './taskmaster-modal/taskmaster-modal.component';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'sepvdb-taskmaster',
  templateUrl: './taskmaster.component.html',
  styleUrls: ['./taskmaster.component.scss']
})



export class taskmasterComponent implements OnInit {
  search: string;
  data: any;
  stype: any={
    name:'購電業',
    key:'id',
    pk_key:'info_id',
    display_name:'ps_name'
  };
  stype_filter: string="";
  taskmaster: any;
  infolist:any;
 table_config: any = {
    checkable: true,
    serverSide: true,
    sort: {
      active: true,
      direction: 'desc',
      disableClear: true
    },
  columns: [
      { name: 'id', displayName: '任務ID' },
      { name: 'task_name', displayName: '任務名稱' },
      { name: 'category', displayName: '類別', templateRef: 'status_json' }, 
      { name: 'priority', displayName: '優先度', templateRef: 'status_json' }, 
      { name: 'status', displayName: '狀態', templateRef: 'status_json' },
      { name: 'create_at', displayName: '建立日期', width: 150, templateRef: 'date' },
      { name: 'close_date', displayName: '預計完成', width: 150, templateRef: 'date' },
      { name: 'description', displayName: '描述', width: 300 },
    ]
  };
  statusConfig = {
  category: {
    '美工': { color: '#ffffff', bg: '#d297f4', type: 'flat' },
    '程式': { color: '#ffffff', bg: '#5e9ac3', type: 'flat' }
  },
  priority: {
    '緊急': { color: '#ff8f00', bg: '#fff8e1', icon: 'flag', type: 'icon-pill' },
    '一般': { color: '#26a69a', bg: '#e0f2f1', icon: 'flag', type: 'icon-pill' },
  },
  status: {
    '待辦': { color: '#ffffff', bg: '#d87a06', icon: 'circle', type: 'status-dot' },
    '進行中': { color: '#ffffff', bg: '#1976d2', icon: 'circle', type: 'status-dot' },
    '完成': { color: '#ffffff', bg: '#43a047', icon: 'circle', type: 'status-dot' }
  }
};
  dataSource!: MatTableDataSource<any>;
  subs: any;
  ticket: any;
  maxTableHeight = '700px';
  minTableHeight = 'unset';
  selected: any;
  @ViewChild('namiTable') namiTable!: TableComponent;
  loaded = false;
  @ViewChild("xlsx", { static: false })
  xlsx: ElementRef;
  select_id:any;

  constructor(
    private apiSvc: ApiService,
    private modalSvc: NgbModal,
    private toastr: ToastrService,
    private snackbar: MatSnackBar,
    public signalRSvc: SignalrService, 
    private route: ActivatedRoute,
  ) {
    this.route.queryParams.subscribe(params => {
      if(params.id)this.stype_filter = params.id
    });
   }


  
 async ngOnInit() {
  try {
    // 即使多個 Component 都寫這行，Service 內部也會擋掉重複的連線請求
    await this.signalRSvc.StartConnection();

    // 使用具名函式，方便之後取消監聽
    this.signalRSvc.Hub.on('taskmaster', this.refreshData);

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
  this.signalRSvc.Hub.off('projectplm', this.refreshData);
}

  onSelect($event: any) {
    this.selected = $event;
  }
 onAdd() {
    const modalRef = this.modalSvc.open(taskmasterModalComponent, { windowClass: "modal-mySize", backdrop: 'static' });
    modalRef.componentInstance.title = "新增";
    // 傳送必要清單到 Modal
    modalRef.result.then((res: any) => {
      this.apiSvc.createdata('taskmaster',res).pipe(
        catchError(err => {
          this.showErrorToast('新增失敗');
          return throwError(err);
        })
      ).subscribe(() => this.showSuccessToast('新增成功'));
    }).catch(() => { });
  }

  onEdit() {
    if (!this.selected) return;
    const modalRef = this.modalSvc.open(taskmasterModalComponent, { windowClass: 'modal-mySize', backdrop: 'static' });
    modalRef.componentInstance.title = "編輯";
    modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));

    modalRef.result.then((res: any) => {
      this.apiSvc.updatedata('taskmaster',this.selected.id, res).pipe(
        catchError(err => {
          this.showErrorToast('編輯失敗');
          return throwError(err);
        })
      ).subscribe(() => this.showSuccessToast('編輯成功'));
    }).catch(() => { });
  }

  onDelete() {
    const ref = this.snackbar.open('你確定要刪除此嗎?', '確定', {
      duration: 3000,
      panelClass: ['alert-danger', 'alert'],
      verticalPosition: 'top',
      horizontalPosition: 'center',
    });
    ref.onAction().subscribe(() => {
      this.apiSvc.deletedata('taskmaster',this.selected.id).pipe(
        catchError(err => {
          this.showErrorToast('刪除失敗，請檢查關聯資料');
          return throwError(err);
        })
      ).subscribe(() => this.showSuccessToast('刪除成功'));
    });
  }

  onDataRefresh() {
    this.selected = null;
    this.loadData()
  }
loadData() {
  this.apiSvc.getdata('taskmaster')
      .pipe(
        tap((data: any[]) => {
   
           data.map(e => {
          });
          this.taskmaster = data;
          this.dataSource = new MatTableDataSource<any>(data);
          this.loaded = true;
          
        })
      )
      .subscribe();
}
private showSuccessToast(msg: string) {
    this.toastr.success(`<span class="nc-icon nc-bell-55"></span> ${msg}`, "", {
      timeOut: 3000, closeButton: true, enableHtml: true,
      toastClass: "alert alert-success alert-with-icon", positionClass: "toast-top-center"
    });
  }

  private showErrorToast(msg: string) {
    this.toastr.error(`<span class="nc-icon nc-bell-55"></span> ${msg}`, "", {
      timeOut: 3000, closeButton: true, enableHtml: true,
      toastClass: "alert alert-error alert-with-icon", positionClass: "toast-top-center"
    });
  }
}
