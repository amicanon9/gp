import { ApiService } from 'app/_services/api.service';
import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { throwError } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { TableComponent } from 'app/_components/sepv-table/sepv-table.component';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SignalrService } from 'app/_services/signalr.service';
import { projectsvcModalComponent } from './projectsvc-modal/projectsvc-modal.component';

@Component({
  selector: 'sepvdb-projectsvc',
  templateUrl: './projectsvc.component.html',
  styleUrls: ['./projectsvc.component.scss']
})
export class projectsvcComponent implements OnInit, OnDestroy {
  search: string;
  selected: any;
  projectsvc: any[];
  tableReady = false;
  loaded = false;

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
      { name: 'project_name', displayName: '專案名稱' },
      { name: 'contract_amount', displayName: '合約價格' },
      { name: 'project_manager_name', displayName: '專案經理' },
      { name: 'team_members', displayName: '專案團隊',width:300, templateRef: 'users'}, // 顯示合併後的姓名串
      { name: 'planned_days', displayName: '計畫人天' },
      { name: 'actual_days', displayName: '實際人天' },
      { name: 'margin_percentage', displayName: '專案利潤(%)' },
      
      // --- 8 大里程碑：嚴格校對版 ---
      { name: 'sow_signed_date', displayName: 'SOW 簽約日',  templateRef: 'date' },
      { name: 'kickoff_date', displayName: 'Project Kickoff 完成日',  templateRef: 'date' },
      { name: 'access_date', displayName: 'Access 完成日',  templateRef: 'date' },
      { name: 'define_date', displayName: 'Define 完成日',  templateRef: 'date' },
      { name: 'design_date', displayName: 'Design 完成日',  templateRef: 'date' },
      { name: 'uat_date', displayName: 'UAT 完成日',  templateRef: 'date' },
      { name: 'go_live_date', displayName: '系統上線日',  templateRef: 'date' },
      { name: 'rollout_date', displayName: 'Rollout 完成日',  templateRef: 'date' },
      
    ]
  };

  dataSource!: MatTableDataSource<any>;
  userlist: any[] = []; // 用於 Modal 傳遞多選名單

  @ViewChild('namiTable') namiTable!: TableComponent;

  constructor(
    private apiSvc: ApiService,
    private modalSvc: NgbModal,
    private toastr: ToastrService,
    private snackbar: MatSnackBar,
    public signalRSvc: SignalrService
  ) {}

  async ngOnInit() {
    try {
      await this.signalRSvc.StartConnection();
      this.signalRSvc.Hub.on('projectsvc', () => this.onDataRefresh());
      this.loadData();
    } catch (err) {
      console.error('SignalR 連線失敗', err);
    }
  }

  ngOnDestroy() {
    this.signalRSvc.Hub.off('projectsvc');
  }

  loadData() {
    this.tableReady = false;
    // 這裡我們需要 userlist 來讓 Modal 的多選功能正常運作
    forkJoin({
      userlist: this.apiSvc.getdata('logininfo'),
      mainData: this.apiSvc.getdata('projectsvc')
    }).subscribe(({ userlist, mainData }) => {
      this.userlist = userlist;
      mainData.forEach(e => {
      });

      this.projectsvc = mainData;
      this.dataSource = new MatTableDataSource<any>(mainData);
      this.loaded = true;
      this.tableReady = true; 
    });
  }

  // 開啟 Modal 時，把整份 userlist 塞進去供多選元件使用
  onAdd() {
    const modalRef = this.modalSvc.open(projectsvcModalComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.title = "新增專案";
    modalRef.componentInstance.userlist = this.userlist; 
    modalRef.result.then((res) => {
      if (res) this.saveData('create', res);
    }).catch(() => {});
  }

  onEdit() {
    if (!this.selected) return;
    const modalRef = this.modalSvc.open(projectsvcModalComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.title = "編輯專案";
    modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));
    modalRef.componentInstance.userlist = this.userlist;
    modalRef.result.then((res) => {
      if (res) this.saveData('update', res);
    }).catch(() => {});
  }

  private saveData(type: 'create' | 'update', data: any) {
    const action = type === 'create' 
      ? this.apiSvc.createdata('projectsvc', data) 
      : this.apiSvc.updatedata('projectsvc', this.selected.id, data);

    action.subscribe({
      next: () => this.showSuccessToast(`${type === 'create' ? '新增' : '更新'}成功`),
      error: () => this.showErrorToast('操作失敗')
    });
  }

  onSelect($event: any) { this.selected = $event; }
  onDataRefresh() { this.selected = null; this.loadData(); }

  private showSuccessToast(msg: string) {
    this.toastr.success(msg, "", { timeOut: 3000, positionClass: "toast-top-center" });
  }

  private showErrorToast(msg: string) {
    this.toastr.error(msg, "", { timeOut: 3000, positionClass: "toast-top-center" });
  }
}