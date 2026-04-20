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
import { customerplmModalComponent } from './customerplm-modal/customerplm-modal.component';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'sepvdb-customerplm',
  templateUrl: './customerplm.component.html',
  styleUrls: ['./customerplm.component.scss']
})



export class customerplmComponent implements OnInit {
  search: string;
  data: any;
  stype: any={
    name:'購電業',
    key:'id',
    pk_key:'info_id',
    display_name:'ps_name'
  };
  stype_filter: string="";
  customerplm: any;
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
    // 1. 基本資訊
    { name: 'name', displayName: '客戶名稱', width: 200 },
    { name: 'tax_id_no', displayName: '統一編號', width: 120 },
    { name: 'crm', displayName: '產業別 CRM', width: 150 },
    
    // 2. 聯絡資訊 (顯示主要聯絡人)
    { name: 'contact', displayName: '聯絡人', width: 120 },
    { name: 'telephone', displayName: '電話', width: 150 },
    { name: 'email', displayName: 'Email', width: 200 },
    // 3. 技術現況
    { name: 'existing_plm', displayName: '現有 PLM', width: 150 },
    { name: 'existing_cad', displayName: '現有 CAD', width: 150 },
    
    // 4. 其他敘述
    { name: 'decision_level', displayName: '決策層級', width: 120 },
    { name: 'description', displayName: '備註說明', width: 250 },

    // 5. 操作
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
  crmlist: any;
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
    this.signalRSvc.Hub.on('customerplm', this.refreshData);

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
    const modalRef = this.modalSvc.open(customerplmModalComponent, { windowClass: "modal-mySize", backdrop: 'static' });
    modalRef.componentInstance.title = "新增";
    // 傳送必要清單到 Modal
    modalRef.componentInstance.crmlist = JSON.parse(JSON.stringify(this.crmlist));
    modalRef.result.then((res: any) => {
      if (res) {
        this.showSuccessToast('新增成功');
      }
    }).catch(() => { });
  }

  onEdit() {
    if (!this.selected) return;
    const modalRef = this.modalSvc.open(customerplmModalComponent, { windowClass: 'modal-mySize', backdrop: 'static' });
    modalRef.componentInstance.title = "編輯";
    modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));
    modalRef.componentInstance.crmlist = JSON.parse(JSON.stringify(this.crmlist));

    modalRef.result.then((res: any) => {
      if (res) {
        this.showSuccessToast('編輯成功');
      }
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
      this.apiSvc.deletedata('customerplm',this.selected.id).pipe(
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
    crmlist : this.apiSvc.getCodeLookup('crm')
  }).subscribe(({ crmlist}) => {
    this.crmlist = crmlist
    this.apiSvc.getdata('customerplm')
      .pipe(
        tap((data: any[]) => {
   
           data.map(e => {
            e['crm']=this.crmlist.find(x=>x.code==e.industry_crm)?.description;
          });
          this.customerplm = data;
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
