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
import { ServicenodetaildataModalComponent } from './servicenodetaildata-modal/servicenodetaildata-modal.component';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'sepvdb-servicenodetaildata',
  templateUrl: './servicenodetaildata.component.html',
  styleUrls: ['./servicenodetaildata.component.scss']
})



export class ServicenodetaildataComponent implements OnInit {
  search: string;
  data: any;
  categorys: any;
  servicenodetaildata: any;
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
  { name: 'service_no', displayName: '服務編號' },
  { name:'ps_name',displayName:'購電業',width:250},
  { name:'ps_power_no',displayName:'購電業電號'},
  { name:'pp_name',displayName:'用電戶',width:250},
  { name:'pp_power_no',displayName:'用電戶電號'},
  { name: 'bill_year', displayName: '年' },
  { name: 'bill_month', displayName: '月' },
  { name: 'kwh_usage', displayName: '當月服務使用量(kWh)' },
  { name: 'transmission_rate', displayName: '輸電費率' },
  { name: 'distribution_rate', displayName: '配電費率' },
  { name: 'dispatching_rate', displayName: '電力調度費率' },
  { name: 'ancillary_services_rate', displayName: '輔助服務費率' },
  { name: 'fee', displayName: '費用' },
  { name: 'description', displayName: '說明' },
  { name:'ps_meter_no',displayName:'購電業表號'},
  { name:'pp_meter_no',displayName:'用戶表號'},
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
  etypelist: any;
  Svlist: any;
  stype: any={
    name:'服務編號',
    key:'id',
    pk_key:'service_no_detail_id',
    display_name:'service_no'
  };
  stype_filter: any="";
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
        this.signalRSvc.ReceiveListener()?.on('servicenodetaildata', (data) => {
          this.onDataRefresh();
        })
    this.loadData();
  }

  onSelect($event: any) {
    this.selected = $event;
  }
  onAdd() {
    const modalRef = this.modalSvc.open(ServicenodetaildataModalComponent, { windowClass: "modal-mySize", backdrop: 'static' });
    modalRef.componentInstance.title = "新增";
    modalRef.componentInstance.servicenodetaildata = JSON.parse(JSON.stringify(this.servicenodetaildata));
    modalRef.componentInstance.Svlist = JSON.parse(JSON.stringify(this.Svlist));
    modalRef.result.then((res: any) => {
      let data = res;
   
      this.apiSvc.createservicenodetaildata(data).pipe(
        catchError(err => {
          this.toastr.error(
            '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
            '新增失敗'
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
        });
    }).catch(() => { });
  }
  onEdit() {
    const modalRef = this.modalSvc.open(ServicenodetaildataModalComponent, { windowClass: 'modal-mySize', backdrop: 'static' });
    modalRef.componentInstance.title = "編輯";
    modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));
    modalRef.componentInstance.Svlist = JSON.parse(JSON.stringify(this.Svlist));
    modalRef.result.then((res: any) => {
      let data = res;
      this.apiSvc.updateservicenodetaildata(this.selected.id, data).pipe(
        catchError(err => {
          this.toastr.error(
            '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
            '編輯失敗'
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
      this.apiSvc.deleteservicenodetaildata(this.selected.id).pipe(
        catchError(err => {
          this.toastr.error(
            '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
            '刪除失敗'
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
    Svlist:this.apiSvc.getservicenodetailinfo()
  }).subscribe(({ Svlist }) => {
    this.Svlist = Svlist
    this.apiSvc.getservicenodetaildata ()
      .pipe(
        tap((data: any[]) => {
          data.map(e => {
          });
          this.servicenodetaildata = data;
          this.dataSource = new MatTableDataSource<any>(data);
          this.loaded = true;
        })
      )
      .subscribe();
  });
}

}
