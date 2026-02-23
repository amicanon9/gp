import { ApiService } from 'app/_services/api.service';
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { catchError, finalize, tap } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { TableComponent } from 'app/_components/sepv-table/sepv-table.component';
import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { forkJoin, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SignalrService } from 'app/_services/signalr.service';
import { expenseclaimsModalComponent } from './expenseclaims-modal/expenseclaims-modal.component'; 
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'app/_services/auth.service';
import { ImageDialogComponent } from 'app/_components/image-dialog/image-dialog.component';

@Component({
  selector: 'sepvdb-expenseclaims',
  templateUrl: './expenseclaims.component.html',
  styleUrls: ['./expenseclaims.component.scss']
})
export class expenseclaimsComponent implements OnInit, OnDestroy {
  search: string;
  // 直接定義為 MatTableDataSource，與 Departments 一致
  dataSource!: MatTableDataSource<any>;
  projectList: { plm: any[], internal: any[],svc:any[] } = { plm: [], internal: [],svc:[] };

  table_config: any = {
    checkable: true,
    serverSide: true, // 改為 true，繞過 sepv-table 的 JSON 備份 Bug
    sort: {
      active: true,
      direction: 'desc',
      diableClear: true
    },
    columns: [
      { name: 'expense_date', displayName: '日期', width: 120, templateRef: 'date' },
      { name: 'username', displayName: '申請人', width: 100 },
      { name: 'project_name', displayName: '專案名稱' }, 
      { name: 'category_item', displayName: '類別', templateRef: 'status_json', width: 120 },
      { name: 'item_name', displayName: '項目/行程', width: 200 },
      { name: 'location_from_to', displayName: '目的地(單程)', width: 180 },
      { name: 'total_amount', displayName: '總金額', width: 120 },
      { name: 'description', displayName: '備註', width: 200 },
    ]
  };

  statusConfig = {
    category_item: {
      '交通費': { color: '#ffffff', bg: '#5e9ac3', icon: 'directions_car', type: 'icon-pill' },
      '雜費': { color: '#ffffff', bg: '#f4a261', icon: 'restaurant', type: 'icon-pill' },
    }
  };

  selected: any;
  loaded = false;
  @ViewChild('namiTable') namiTable!: TableComponent;

  constructor(
    private apiSvc: ApiService,
    private modalSvc: NgbModal,
    private toastr: ToastrService,
    private snackbar: MatSnackBar,
    public signalRSvc: SignalrService,
    private authSvc: AuthService,
    private route: ActivatedRoute,
  ) { }

  async ngOnInit() {
    try {
      await this.signalRSvc.StartConnection();
      this.signalRSvc.Hub.on('expenseclaims', this.refreshData);
      
      this.loadData();
    } catch (err) {
      console.error('初始化失敗', err);
    }
  }

  ngOnDestroy() {
    this.signalRSvc.Hub.off('expenseclaims', this.refreshData);
  }

  private refreshData = (data: any) => {
    this.onDataRefresh();
  }

  onDataRefresh() {
    this.selected = null;
    this.loadData();
  }

  /**
   * 與 Departments 頁面邏輯完全統一
   */
  loadData() {
    this.loaded = false;
    forkJoin({
      plm: this.apiSvc.getdatabyrole('projectplm'),
      internal: this.apiSvc.getdata('projectinternal'),
      svc:this.apiSvc.getdata('projectsvc'),
      claims: this.apiSvc.getdatabyid('expenseclaims', this.authSvc.state.user_id)
    }).subscribe(({ plm, internal,svc, claims }) => {
      this.projectList.plm = plm;
      this.projectList.svc=svc;
      this.projectList.internal = internal;

      // 處理資料顯示名稱
      const displayData = Array.isArray(claims) ? claims : [];
      displayData.map(e => {
        if (e.project_type === 'PLM') {
          const found = this.projectList.plm.find(p => p.id === e.project_id);
          e['project_name'] = found ? found.customer_name : `PLM: ${e.project_id}`;
        } else if (e.project_type === 'Internal') {
          const found = this.projectList.internal.find(p => p.id === e.project_id);
          e['project_name'] = found ? found.name : `Int: ${e.project_id}`;
        }else if (e.project_type === 'Svc') {
          const found = this.projectList.svc.find(p => p.id === e.project_id);
          e['project_name'] = found ? found.project_name : `Int: ${e.project_id}`;
        } else {
          e['project_name'] = '未知專案';
        }
      });

      // 設定 DataSource (serverSide: true 會直接拿這個去用，不會跑 JSON.stringify)
      this.dataSource = new MatTableDataSource<any>(displayData);
      
      // 計算統計資訊
      this.loaded = true;
    });
  }



  onSelect($event: any) {
    this.selected = $event;
  }

onAdd() {
  const modalRef = this.modalSvc.open(expenseclaimsModalComponent, { 
    windowClass: 'modal-mySize', 
    backdrop: 'static' 
  });
  
  modalRef.componentInstance.title = "新增";
  modalRef.componentInstance.projectList = this.projectList;
  modalRef.componentInstance.historyData = this.dataSource.data;
  // 監聽 Modal 關閉後的動作
  modalRef.result.then((res: any) => {
    // 只要 Modal 回傳值（我們設定成功回傳 true），就代表資料與圖片都處理完了
    if (res) {
      this.showSuccessToast('新增成功');
      this.loadData(); // 刷新列表資料
    }
  }).catch(() => { });
}
onEdit() {
  if (!this.selected) return;
  const modalRef = this.modalSvc.open(expenseclaimsModalComponent, { 
    windowClass: 'modal-mySize', 
    backdrop: 'static' 
  });
  
  modalRef.componentInstance.title = "編輯";
  modalRef.componentInstance.projectList = this.projectList;
  modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));

  modalRef.result.then((success) => {
    // 只要 Modal 關閉時傳回 true，就代表資料跟圖片都更新完了
    if (success) {
      this.showSuccessToast('編輯成功');
      this.loadData();
    }
  }).catch(() => { });
}

  onDelete() {
    if (!this.selected) return;
    const ref = this.snackbar.open('確定要刪除這筆紀錄嗎?', '確定', { 
      duration: 3000, 
      panelClass: ['alert-danger', 'alert'],
      verticalPosition: 'top'
    });
    ref.onAction().subscribe(() => {
      this.apiSvc.deletedata('expenseclaims', this.selected.id).subscribe(() => {
        this.showSuccessToast('刪除成功');
      });
    });
  }

  private showSuccessToast(msg: string) {
    this.toastr.success(`<span class="nc-icon nc-bell-55"></span> ${msg}`, "", {
      timeOut: 3000, closeButton: true, enableHtml: true,
      toastClass: "alert alert-success alert-with-icon", positionClass: "toast-top-center"
    });
  }
}