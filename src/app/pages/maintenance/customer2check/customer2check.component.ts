import { ApiService } from 'app/_services/api.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { catchError, finalize, tap } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { TableComponent } from 'app/_components/sepv-table/sepv-table.component';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { forkJoin, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SignalrService } from 'app/_services/signalr.service';
import { customer2checkModalComponent } from './customer2check-modal/customer2check-modal.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'sepvdb-customer2check',
  templateUrl: './customer2check.component.html',
  styleUrls: ['./customer2check.component.scss']
})
export class customer2checkComponent implements OnInit {
  search: string = "";
  data: any;
  customer2check: any;
  table_config: any = {
    checkable: true,
    serverSide: true,
    sort: {
      active: true,
      direction: 'desc',
      disableClear: true
    },
    columns: [
      { name: 'name', displayName: '客戶名稱', width: 200 },
      { name: 'tax_id_no', displayName: '統一編號', width: 120 },
      { name: 'contact', displayName: '聯絡人', width: 120 },
      { name: 'telephone', displayName: '電話', width: 150 },
      { name: 'email', displayName: 'Email', width: 200 },
      { name: 'decision_level', displayName: '決策層級', width: 120 },
      { name: 'description', displayName: '備註說明', width: 250 },
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
      this.signalRSvc.Hub.on('customer2check', this.refreshData);
      this.loadData();
    } catch (err) {
      console.error('初始化失敗', err);
    }
  }

  private refreshData = (data: any) => {
    this.onDataRefresh();
  }

  ngOnDestroy() {
    this.signalRSvc.Hub.off('customer2check', this.refreshData);
  }

  onSelect($event: any) {
    this.selected = $event;
  }

  onAdd() {
    const modalRef = this.modalSvc.open(customer2checkModalComponent, { windowClass: "modal-mySize", backdrop: 'static' });
    modalRef.componentInstance.title = "新增";
    modalRef.result.then((res: any) => {
      if (res) {
        this.showSuccessToast('新增成功');
        this.loadData();
      }
    }).catch(() => { });
  }

  onEdit() {
    if (!this.selected) return;
    const modalRef = this.modalSvc.open(customer2checkModalComponent, { windowClass: 'modal-mySize', backdrop: 'static' });
    modalRef.componentInstance.title = "編輯";
    modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));

    modalRef.result.then((res: any) => {
      if (res) {
        this.showSuccessToast('編輯成功');
        this.loadData();
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
      this.apiSvc.deletedata('customer2check', this.selected.id).pipe(
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
    this.apiSvc.getdata('customer2check')
      .pipe(
        tap((data: any[]) => {
          this.customer2check = data;
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
