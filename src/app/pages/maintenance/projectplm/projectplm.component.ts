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
    name: 'AGS狀態',
    key: 'code',
    pk_key: 'ags_status',
    display_name: 'description'
  };
  stype_filter: string = "";
  projectplm: any;
  // 1. 定義結構
quarterStats: any[] = [
  { label: 'Q1', longshot: 0, bcd: 0, commit: 0, targets: { ls: 20, bcd: 3, cm: 1 } },
  { label: 'Q2', longshot: 0, bcd: 0, commit: 0, targets: { ls: 20, bcd: 3, cm: 1 } },
  { label: 'Q3', longshot: 0, bcd: 0, commit: 0, targets: { ls: 20, bcd: 3, cm: 1 } },
  { label: 'Q4', longshot: 0, bcd: 0, commit: 0, targets: { ls: 20, bcd: 3, cm: 1 } }
];
availableYears: number[] = [];
  // 重要：用來強制重新渲染 Table 的 Flag
  tableReady = false;
  
  table_config: any = {
    checkable: true,
    serverSide: true,
    sort: {
      active: true,
      direction: 'desc',
      disableClear: true
    },
    columns: [
      { name: 'id', displayName: '專案ID' },
      { name: 'customer_name', displayName: '客戶名稱', width: 200 , sticky: true},
      { name: 'year', displayName: '年度', width: 80 },
      { name: 'quarter', displayName: '季度', width: 80 },
      { name: 'month', displayName: '月', width: 80 },
      { name: 'close_date', displayName: '預計結案日', width: 120, templateRef: 'date' },
      
      { name: 'button', displayName: '資料維護', templateRef: 'button', width: 100 },
      { name: 'contact', displayName: '聯絡人', width: 120 },
      { name: 'telephone', displayName: '電話', width: 150 },
      { name: 'email', displayName: 'Email', width: 200 },
      { name: 'existing_plm', displayName: '現有 PLM', width: 150 },
      { name: 'existing_cad', displayName: '現有 CAD', width: 150 },
      { name: 'rfq_to_client_amount', displayName: 'RFQ to Client', width: 120 },
      { name: 'net_to_ds_amount', displayName: 'Net to DS', width: 120 },
      { name: 'sys', displayName: '系統查詢', width: 120 },
      { name: 'is_system_checked', displayName: '是否查詢系統', width: 120, templateRef: 'boolean' },
      { name: 'is_ags_booking', displayName: 'AGS是否Booking', width: 130, templateRef: 'boolean' },
      { name: 'ags', displayName: 'AGS 狀態', width: 150, templateRef: 'ags_status' },
      { name: 'under_control_longshot_year_q', displayName: '掌控狀況 Year/Q', width: 150 },
      { name: 'solution_mapping', displayName: '解決方案對應', width: 200 },
      { name: 'this_week', displayName: '本週週報', width: 300, templateRef: 'this_week_content' },
      { name: 'sales', displayName: '業務負責人', width: 120 },
      { name: 'service', displayName: '服務負責人', width: 120 },
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
  base_columns: any;
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
    this.base_columns = this.table_config.columns.filter(c => c.name !== 'week');
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
  this.tableReady = false;

  // 將 projectplm 加入合併請求中
  forkJoin({
    projectData: this.apiSvc.getdata('projectplm'),
    cuslist: this.apiSvc.getdata('customerplm'),
    syslist: this.apiSvc.getCodeLookup('sys'),
    agslist: this.apiSvc.getCodeLookup('ags'),
    userlist: this.apiSvc.getdata('logininfo'),
    crmlist: this.apiSvc.getCodeLookup('crm'),
    weeklist: this.apiSvc.getdata('weeklyreportplm'),
  }).pipe(
    finalize(() => {
      this.loaded = true;
      this.tableReady = true;
    })
  ).subscribe(({ projectData, cuslist, syslist, agslist, userlist, crmlist, weeklist }) => {
    // A. 基礎清單賦值
    this.cuslist = cuslist;
    this.syslist = syslist;
    this.agslist = agslist;
    this.userlist = userlist;
    this.crmlist = crmlist;
    this.weeklist = weeklist;

    // B. 自動提取所有不重複年份 (用於年度選擇器)
    const rawYears = projectData.map(item => Number(item.year));
    rawYears.push(new Date().getFullYear()); // 確保包含今年
    this.availableYears = Array.from(new Set(rawYears)).sort((a, b) => b - a);

    // C. 建立動態週別欄位 (這部分維持原邏輯)
    const weekSet = new Set<string>();
    this.weeklist.forEach(w => weekSet.add(`${w.year}/W${w.week}`));
    // const sortedWeeks = Array.from(weekSet).sort();
    const sortedWeeks = Array.from(weekSet)
    const dynamicWeekColumns = sortedWeeks.map(weekKey => ({
      name: `dyn_week_${weekKey}`, 
      displayName: weekKey,
      width: 200,
      templateRef: 'dynamic_week_content'
    }));
    
    const cleanBase = (this.base_columns && this.base_columns.length > 0) 
                      ? this.base_columns 
                      : this.table_config.columns.filter(c => !c.name.startsWith('dyn_week_') && c.name !== 'week');

    this.table_config = {
      ...this.table_config,
      columns: [...cleanBase, ...dynamicWeekColumns]
    };

    // D. 處理 projectplm 資料欄位 Mapping
    projectData.forEach(e => {
      const customer = this.cuslist.find(x => x.id == e.customer_id);
      const ags = this.agslist.find(x => x.code == e.ags_status);
      
      e['customer'] = customer;
      e['contact'] = customer?.contact;
      e['telephone'] = customer?.telephone;
      e['email'] = customer?.email;
      e['existing_plm'] = customer?.existing_plm;
      e['existing_cad'] = customer?.existing_cad;
      e['sys'] = this.syslist.find(x => x.code == e.system_inquiry_channel)?.description;
      e['ags'] = ags;
      e['ags_description'] = ags?.description;
      e['sales'] = this.userlist.find(x => x.id == e.sales_owner)?.username;
      e['service'] = this.userlist.find(x => x.id == e.service_owner)?.username;
      e['button'] = [{ name: '編輯週報', type: 'weekly_report' }];
      
      // 週報比對邏輯
      e['week_data'] = this.weeklist.filter(x => x.project_id == e.id);
      const foundThisWeek = e['week_data'].find(w => w.year == this.year && w.week == this.week);
      e['this_week'] = foundThisWeek ? [foundThisWeek] : [];
    });

    this.projectplm = projectData;

    // E. 執行統計計算 (僅計算當前選擇年度)
    this.calculateQuarterlyStats();

    // F. 渲染表格
    this.dataSource = new MatTableDataSource<any>(this.projectplm);
  });
}

  calculateQuarterlyStats() {
  // 重置
  this.quarterStats.forEach(q => { q.longshot = 0; q.bcd = 0; q.commit = 0; });
  if (!this.projectplm) return;

  // 僅針對目前選中的 this.year 進行統計
  const yearFiltered = this.projectplm.filter(item => Number(item.year) === Number(this.year));

  yearFiltered.forEach(item => {
    const qStat = this.quarterStats.find(q => q.label === item.quarter);
    if (!qStat) return;

    const desc = (item.ags_description || '').toUpperCase().trim();
    if (desc.includes('LONGSHOT')) qStat.longshot++;
    else if (desc.includes('BCD')) qStat.bcd++;
    else if (desc.includes('COMMIT')) qStat.commit++;
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
