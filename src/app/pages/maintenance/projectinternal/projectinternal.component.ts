import { ApiService } from 'app/_services/api.service';
import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { catchError, finalize, tap } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { TableComponent } from 'app/_components/sepv-table/sepv-table.component';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { forkJoin, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SignalrService } from 'app/_services/signalr.service';
import { ActivatedRoute } from '@angular/router';
// 假設你之後會建立這個 Modal
import { ProjectInternalModalComponent } from './projectinternal-modal/projectinternal-modal.component'; 

@Component({
  selector: 'sepvdb-projectinternal',
  templateUrl: './projectinternal.component.html',
  styleUrls: ['./projectinternal.component.scss']
})
export class projectinternalComponent implements OnInit, OnDestroy {
  search: string;
  projectInternalData: any[] = [];
  
  table_config: any = {
    checkable: true,
    serverSide: true,
    sort: {
      active: true,
      direction: 'desc',
      disableClear: true
    },
    columns: [
      { name: 'id', displayName: '專案ID', width: 80 },
      { name: 'company_name', displayName: '所屬' },
      { name: 'name', displayName: '專案名稱', width: 250 },
      { name: 'description', displayName: '敘述', width: 400 },
      { name: 'created_at', displayName: '建立時間', width: 180, templateRef: 'date' },
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
  booklist: any;
  

  constructor(
    private apiSvc: ApiService,
    private modalSvc: NgbModal,
    private toastr: ToastrService,
    private snackbar: MatSnackBar,
    public signalRSvc: SignalrService, 
    private route: ActivatedRoute,
  ) { }

  async ngOnInit() {
    try {
      await this.signalRSvc.StartConnection();
      // 監聽內部專案的 SignalR 事件
      this.signalRSvc.Hub.on('projectinternal', this.refreshData);
      this.loadData();
    } catch (err) {
      console.error('SignalR 初始化失敗', err);
    }
  }

  private refreshData = (data: any) => {
    console.log('收到 SignalR 通知更新');
    this.onDataRefresh();
  }

  ngOnDestroy() {
    // 移除監聽，防止記憶體洩漏
    this.signalRSvc.Hub.off('projectinternal', this.refreshData);
  }

  onSelect($event: any) {
    this.selected = $event;
  }

  onAdd() {
    const modalRef = this.modalSvc.open(ProjectInternalModalComponent, { windowClass: "modal-mySize", backdrop: 'static' });
    modalRef.componentInstance.title = "新增內部專案";
    modalRef.componentInstance.booklist = JSON.parse(JSON.stringify(this.booklist));
    modalRef.result.then((res: any) => {
      this.apiSvc.createdata('projectinternal', res).pipe(
        catchError(err => {
          this.showErrorToast('新增失敗');
          return throwError(err);
        })
      ).subscribe(() => this.showSuccessToast('新增成功'));
    }).catch(() => { });
  }

  onEdit() {
    if (!this.selected) return;
    const modalRef = this.modalSvc.open(ProjectInternalModalComponent, { windowClass: 'modal-mySize', backdrop: 'static' });
    modalRef.componentInstance.title = "編輯內部專案";
    modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));
    modalRef.componentInstance.booklist = JSON.parse(JSON.stringify(this.booklist));
    modalRef.result.then((res: any) => {
      this.apiSvc.updatedata('projectinternal', this.selected.id, res).pipe(
        catchError(err => {
          this.showErrorToast('編輯失敗');
          return throwError(err);
        })
      ).subscribe(() => this.showSuccessToast('編輯成功'));
    }).catch(() => { });
  }

  onDelete() {
    if (!this.selected) return;
    const ref = this.snackbar.open('確定要刪除此內部專案嗎?', '確定', {
      duration: 3000,
      panelClass: ['alert-danger', 'alert'],
      verticalPosition: 'top',
      horizontalPosition: 'center',
    });

    ref.onAction().subscribe(() => {
      this.apiSvc.deletedata('projectinternal', this.selected.id).pipe(
        catchError(err => {
          this.showErrorToast('刪除失敗');
          return throwError(err);
        })
      ).subscribe(() => this.showSuccessToast('刪除成功'));
    });
  }

  onDataRefresh() {
    this.selected = null;
    this.loadData();
  }

loadData() {
  this.loaded = false; // 開始載入，顯示轉圈圈

  // 使用 forkJoin 同時發出兩個請求
  forkJoin({
    projectData: this.apiSvc.getdata('projectinternal'),
    booklist: this.apiSvc.getSetOfBooks()
  }).pipe(
    catchError(err => {
      this.showErrorToast('資料載入失敗');
      this.loaded = true; 
      return throwError(err);
    })
  ).subscribe(({ projectData, booklist }) => {
    // 1. 處理專案資料 (原本 top 裡的邏輯)
    this.projectInternalData = projectData;
    this.dataSource = new MatTableDataSource<any>(projectData);
    // 2. 處理帳簿資料
    this.booklist = booklist;
    // 3. 關閉載入狀態
    this.loaded = true;
  });
}
  // 使用簡化後的 Toast 呼叫方式 (假設 positionClass 已在 Global 設定)
  private showSuccessToast(msg: string) {
    this.toastr.success(`<span class="nc-icon nc-bell-55"></span> ${msg}`, "", {
      toastClass: "alert alert-success alert-with-icon"
    });
  }

  private showErrorToast(msg: string) {
    this.toastr.error(`<span class="nc-icon nc-bell-55"></span> ${msg}`, "", {
      toastClass: "alert alert-error alert-with-icon"
    });
  }
}