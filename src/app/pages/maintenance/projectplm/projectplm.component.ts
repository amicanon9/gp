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
import { weeklyreportplmModalComponent } from './weeklyreportplm-modal/weeklyreportplm-modal.component';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
dayjs.extend(weekOfYear);
@Component({
  selector: 'sepvdb-projectplm',
  templateUrl: './projectplm.component.html',
  styleUrls: ['./projectplm.component.scss']
})



export class projectplmComponent implements OnInit {
  year = new Date().getFullYear();
  week = dayjs().week();
  search: string;
  data: any;
  stype: any = {
    name: '購電業',
    key: 'id',
    pk_key: 'info_id',
    display_name: 'ps_name'
  };
  stype_filter: string = "";
  projectplm: any;
  infolist: any;
  table_config: any = {
    checkable: true,
    serverSide: true,
    sort: {
      active: true,
      direction: 'desc',
      disableClear: true
    },
    columns: [
      // 1. 重點結單預估日期 (時間維度)
      {name:'id', displayName: '專案ID'},
      { name: 'year', displayName: '年度', width: 80 },
      { name: 'quarter', displayName: '季度', width: 80 },
      { name: 'month', displayName: '月', width: 80 },
      { name: 'close_date', displayName: '預計結案日', width: 120 , templateRef: 'date' },

      // 2. 客戶資訊
      { name: 'customer_name', displayName: '客戶名稱', width: 200 },
      // 2. 聯絡資訊 (顯示主要聯絡人)
      { name: 'contact', displayName: '聯絡人', width: 120 },
      { name: 'telephone', displayName: '電話', width: 150 },

      // 3. 技術現況
      { name: 'existing_plm', displayName: '現有 PLM', width: 150 },
      { name: 'existing_cad', displayName: '現有 CAD', width: 150 },

      // 3. License (金額資訊)
      { name: 'rfq_to_client_amount', displayName: 'RFQ to Client', width: 120 },
      { name: 'net_to_ds_amount', displayName: 'Net to DS', width: 120 },

      // 4. DS系統
      { name: 'sys', displayName: '系統查詢', width: 120 },
      { name: 'is_system_checked', displayName: '是否查詢系統', width: 120, templateRef: 'boolean' },
      { name: 'is_ags_booking', displayName: 'AGS是否Booking', width: 130, templateRef: 'boolean' },

      // 5. AGS管制點
      { name: 'ags', displayName: 'AGS 狀態', width: 150, templateRef: 'ags_status' },
      { name: 'under_control_longshot_year_q', displayName: '掌控狀況 Year/Q', width: 150 },
      { name: 'solution_mapping', displayName: '解決方案對應', width: 200 },
      { name: 'sales', displayName: '業務負責人', width: 120 },
      { name: 'service', displayName: '服務負責人', width: 120 },

      // 6. 操作
      { name: 'button', displayName: '資料維護', templateRef: 'button', width: 100 },
      { name: 'this_week', displayName: '本週週報', width: 300, templateRef: 'this_week_content' },
      { name: 'week', displayName: '週報紀錄', width: 300, templateRef: 'week_content' },

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
  select_id: any;
  syslist: any;
  agslist: any;
  userlist: any;
  weeklist: any;
  constructor(
    private apiSvc: ApiService,
    private modalSvc: NgbModal,
    private toastr: ToastrService,
    private snackbar: MatSnackBar,
    public signalRSvc: SignalrService,
    private route: ActivatedRoute,
  ) {
    this.route.queryParams.subscribe(params => {
      if (params.id) this.stype_filter = params.id
    });
  }



  async ngOnInit() {
    try {
      // 即使多個 Component 都寫這行，Service 內部也會擋掉重複的連線請求
      await this.signalRSvc.StartConnection();

      // 使用具名函式，方便之後取消監聽
      this.signalRSvc.Hub.on('projectplm', this.refreshData);
      this.signalRSvc.Hub.on('weeklyreportplm', this.refreshData);
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
    this.signalRSvc.Hub.off('weeklyreportplm', this.refreshData);
  }

  onSelect($event: any) {
    this.selected = $event;
  }
  onAdd() {
    const modalRef = this.modalSvc.open(projectplmModalComponent, { windowClass: "modal-mySize", backdrop: 'static' });
    modalRef.componentInstance.title = "新增";
    // 傳送必要清單到 Modal
    modalRef.componentInstance.cuslist = JSON.parse(JSON.stringify(this.cuslist));
    modalRef.componentInstance.syslist = JSON.parse(JSON.stringify(this.syslist));
    modalRef.componentInstance.agslist = JSON.parse(JSON.stringify(this.agslist));
    modalRef.componentInstance.userlist = JSON.parse(JSON.stringify(this.userlist));
    modalRef.result.then((res: any) => {
      this.apiSvc.createdata('projectplm', res).pipe(
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
    modalRef.componentInstance.title = "編輯";
    modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));
    modalRef.componentInstance.cuslist = JSON.parse(JSON.stringify(this.cuslist));
    modalRef.componentInstance.syslist = JSON.parse(JSON.stringify(this.syslist));
    modalRef.componentInstance.agslist = JSON.parse(JSON.stringify(this.agslist));
    modalRef.componentInstance.userlist = JSON.parse(JSON.stringify(this.userlist));
    modalRef.result.then((res: any) => {
      this.apiSvc.updatedata('projectplm', this.selected.id, res).pipe(
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
      this.apiSvc.deletedata('projectplm', this.selected.id).pipe(
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
      cuslist: this.apiSvc.getdata('customerplm'),

      syslist: this.apiSvc.getCodeLookup('sys'),
      agslist: this.apiSvc.getCodeLookup('ags'),
      userlist: this.apiSvc.getdata('logininfo'),
      crmlist: this.apiSvc.getCodeLookup('crm'),
      weeklist: this.apiSvc.getdata('weeklyreportplm'),
    }).subscribe(({ cuslist, syslist, agslist, userlist, crmlist, weeklist }) => {
      this.cuslist = cuslist;
      this.syslist = syslist;
      this.agslist = agslist;
      this.userlist = userlist;
      this.crmlist = crmlist
      this.weeklist = weeklist
      this.cuslist.map(e => {
        e['crm'] = this.crmlist.find(x => x.code == e.industry_crm)?.description
      })
      this.apiSvc.getdata('projectplm')
        .pipe(
          tap((data: any[]) => {
            data.map(e => {
              var customer = this.cuslist.find(x => x.id == e.customer_id);
              var ags = this.agslist.find(x => x.code == e.ags_status);
              
              e['customer'] = customer
              e['contact'] = customer.contact
              e['telephone'] = customer.telephone
              e['existing_plm'] = customer.existing_plm
              e['existing_cad'] = customer.existing_cad
              e['sys'] = this.syslist.find(x => x.code == e.system_inquiry_channel)?.description;
              e['ags'] = ags
              e['ags_description'] = ags?.description;
              e['sales'] = this.userlist.find(x => x.id == e.sales_owner)?.username;
              e['service'] = this.userlist.find(x => x.id == e.service_owner)?.username;
              e['button'] = [{ name: '編輯週報', type: 'weekly_report' }]
              
              var week = this.weeklist.filter(x => x.project_id == e.id);
              e['week'] = week.sort((a, b) => {
                if (a.year !== b.year) {
                  return a.year - b.year; // 先比年份 (由小到大)
                }
                return a.week - b.week;   // 年份相同再比週數 (由小到大)
              });
              const found = week?.find(e => e.year == this.year && e.week == this.week);
              e['this_week'] = found ? [found] : []; // 強制轉成陣列格式，方便 HTML 統一處理
            });
            this.projectplm = data;
            console.log(data)
            this.dataSource = new MatTableDataSource<any>(data);
            this.loaded = true;

          })
        )
        .subscribe();
    });
  }
  handleTableAction(event: { btn: any, row: any }) {
    if (event.btn.type === 'weekly_report') {
      // 開啟週報 Modal，沿用您的 windowClass 與 backdrop 設定
      const modalRef = this.modalSvc.open(weeklyreportplmModalComponent, {
        windowClass: "modal-mySize",
        backdrop: 'static'
      });

      // 傳送必要參數到 Modal (對應 Modal 內的 @Input)
      modalRef.componentInstance.title = "週報維護";
      modalRef.componentInstance.projectId = event.row.id;
      modalRef.componentInstance.agslist = JSON.parse(JSON.stringify(this.agslist));
      modalRef.componentInstance.projectName = event.row.customer_name ||
        (event.row.customer ? event.row.customer.name : '');
      modalRef.result.then((res: any) => {
        if (res) {
          // 如果週報 Modal 有回傳資料，這裡可以執行重新讀取父頁面列表的動作
          // this.loadData(); 
        }
      }).catch(() => {
        // 使用者點擊取消或關閉視窗，不需執行動作
      });
    }
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
