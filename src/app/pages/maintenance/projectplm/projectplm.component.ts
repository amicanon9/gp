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
import { projectplmModalComponent } from './projectplm-modal/projectplm-modal.component';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'sepvdb-projectplm',
  templateUrl: './projectplm.component.html',
  styleUrls: ['./projectplm.component.scss']
})



export class projectplmComponent implements OnInit {
  search: string;
  data: any;
  stype: any={
    name:'購電業',
    key:'id',
    pk_key:'info_id',
    display_name:'ps_name'
  };
  stype_filter: string="";
  projectplm: any;
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
      // 1. 時間維度
      { name: 'year', displayName: '年度', width: 80 },
      { name: 'quarter', displayName: '季度', width: 80 },
      { name: 'month', displayName: '月份', width: 80 },
      { name: 'close_date', displayName: '預計結案日', width: 120 },

      // 2. 客戶與市場資訊
      { name: 'customer_name', displayName: '客戶名稱', width: 200 },
      { name: 'industry_crm', displayName: '產業別 (CRM)', width: 150 },
      { name: 'system_inquiry_channel', displayName: '詢價管道', width: 120 },

      // 3. 技術現況
      { name: 'existing_plm', displayName: '現有 PLM', width: 150 },
      { name: 'existing_cad', displayName: '現有 CAD', width: 150 },
      { name: 'solution_mapping', displayName: '解決方案', width: 200 },

      // 4. 金額與狀態
      { name: 'rfq_to_client_amount', displayName: '報價金額', width: 120 },
      { name: 'net_to_ds_amount', displayName: '淨額 (DS)', width: 120 },
      { name: 'ags_status', displayName: 'AGS 狀態', width: 100 },
      { name: 'is_ags_booking', displayName: 'AGS 下單', width: 100, templateRef: 'checkbox' }, // 建議用 Template 顯示 Checkbox

      // 5. 內部管理
      { name: 'sales_owner', displayName: '業務負責人', width: 120 },
      { name: 'service_owner', displayName: '服務負責人', width: 120 },
      { name: 'under_control_longshot_year_q', displayName: '掌控狀況 (Q)', width: 150 },
      { name: 'is_system_checked', displayName: '系統確認', width: 120 },

      // 6. 操作
      { name: 'detail', displayName: '資料維護', templateRef: 'detail', width: 100 },
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
  @ViewChild("xlsx", { static: false })
  xlsx: ElementRef;
  cuslist: any;
  banklist: any;
  select_id:any;
  branchlist: any;
  psbanklist: any;
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


  
  ngOnInit() {
    this.signalRSvc.StartConnection()
        this.signalRSvc.ReceiveListener()?.on('projectplm', (data) => {
          this.onDataRefresh();
        })
    this.loadData();
  }

  onSelect($event: any) {
    this.selected = $event;
  }
 onAdd() {
    const modalRef = this.modalSvc.open(projectplmModalComponent, { windowClass: "modal-mySize", backdrop: 'static' });
    modalRef.componentInstance.title = "新增專案";
    // 傳送必要清單到 Modal
    modalRef.componentInstance.cuslist = JSON.parse(JSON.stringify(this.cuslist));
    
    modalRef.result.then((res: any) => {
      this.apiSvc.createprojectplm(res).pipe(
        catchError(err => {
          this.showErrorToast('新增失敗');
          return throwError(err);
        })
      ).subscribe(() => this.showSuccessToast('新增成功'));
    }).catch(() => { });
  }

  onEdit() {
    if (!this.selected) return;
    const modalRef = this.modalSvc.open(projectplmModalComponent, { windowClass: 'modal-mySize', backdrop: 'static' });
    modalRef.componentInstance.title = "編輯專案";
    modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));
    modalRef.componentInstance.cuslist = JSON.parse(JSON.stringify(this.cuslist));

    modalRef.result.then((res: any) => {
      this.apiSvc.updateprojectplm(this.selected.id, res).pipe(
        catchError(err => {
          this.showErrorToast('編輯失敗');
          return throwError(err);
        })
      ).subscribe(() => this.showSuccessToast('編輯成功'));
    }).catch(() => { });
  }

  onDelete() {
    const ref = this.snackbar.open('你確定要刪除此專案嗎?', '確定', {
      duration: 3000,
      panelClass: ['alert-danger', 'alert'],
      verticalPosition: 'top',
      horizontalPosition: 'center',
    });
    ref.onAction().subscribe(() => {
      this.apiSvc.deleteprojectplm(this.selected.id).pipe(
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
  forkJoin({
    cuslist: this.apiSvc.getdata('projectplm')

  }).subscribe(({ cuslist}) => {
    this.cuslist = cuslist;
    this.apiSvc.getdata('projectplm')
      .pipe(
        tap((data: any[]) => {
   
         
          this.projectplm = data;
          this.dataSource = new MatTableDataSource<any>(data);
          this.loaded = true;
          
        })
      )
      .subscribe();
  });
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
