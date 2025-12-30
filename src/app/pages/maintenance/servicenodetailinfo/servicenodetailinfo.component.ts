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
import { ServicenodetailinfoModalComponent } from './servicenodetailinfo-modal/servicenodetailinfo-modal.component';
import { ActivatedRoute } from '@angular/router';
import { ServicenodetailinfoExportComponent } from './servicenodetailinfo-export/servicenodetailinfo-export.component';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
@Component({
  selector: 'sepvdb-servicenodetailinfo',
  templateUrl: './servicenodetailinfo.component.html',
  styleUrls: ['./servicenodetailinfo.component.scss']
})



export class ServicenodetailinfoComponent implements OnInit {
  search: string;
  data: any;
  categorys: any;
  servicenodetailinfo: any;
  infolist:any;
  stype: any={
    name:'服務編號',
    key:'id',
    pk_key:'service_no_id',
    display_name:'service_no'
  };
  table_config: any = {
    checkable: true,
    serverSide: true,
    sort: {
      active: true,
      direction: 'desc',
      disableClear: true
    },
    columns: [
    { name: 'ps_meter_no', displayName: '購電業表號' },
    { name: 'ps_rate', displayName: '購電費率' },
    { name: 'ps_pp_percent', displayName: '轉供比例' },
    { name: 'ps_total_kwp', displayName: '購電裝置容量(瓩)' },
    { name:'ps_name',displayName:'購電業',width:250},
    { name:'ps_power_no',displayName:'購電業電號'},
    { name: 'pp_meter_no', displayName: '用戶表號' },
    { name:'pp_name',displayName:'用電戶',width:250},
    { name:'pp_power_no',displayName:'用電戶電號'},
    { name: 'service_no', displayName: '服務編號' },
     { name: 'type', displayName: '設置型式' },
    { name: 'detail', displayName: '資料維護', templateRef:'detail' },
    
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
  PSlist: any;
  Pplist: any;
  Svlist: any;
  isExporting = false;
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
        this.signalRSvc.ReceiveListener()?.on('servicenodetailinfo', (data) => {
          this.onDataRefresh();
        })
    this.loadData();
  }

  onSelect($event: any) {
    this.selected = $event;
  }

  onExport() {
    const modalRef = this.modalSvc.open(ServicenodetailinfoExportComponent, {
      windowClass: 'modal-mySize',
      backdrop: 'static'
    });
    modalRef.componentInstance.title = '匯出購電通知單';
    modalRef.componentInstance.servicenodetailinfo = JSON.parse(JSON.stringify(this.servicenodetailinfo));
  }
  onAdd() {
    const modalRef = this.modalSvc.open(ServicenodetailinfoModalComponent, { windowClass: "modal-mySize", backdrop: 'static' });
    modalRef.componentInstance.title = "新增";
    modalRef.componentInstance.servicenodetailinfo = JSON.parse(JSON.stringify(this.servicenodetailinfo));
    modalRef.componentInstance.PSlist = JSON.parse(JSON.stringify(this.PSlist));
    modalRef.componentInstance.Pplist = JSON.parse(JSON.stringify(this.Pplist));
    modalRef.componentInstance.Svlist = JSON.parse(JSON.stringify(this.Svlist));
    modalRef.result.then((res: any) => {
      let data = res;
   
      this.apiSvc.createservicenodetailinfo(data).pipe(
        catchError(err => {
          var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '新增失敗，該服務編號已有相同的購電業用電戶';
          }
          this.toastr.error(
            '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
            errorMessage
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
    const modalRef = this.modalSvc.open(ServicenodetailinfoModalComponent, { windowClass: 'modal-mySize', backdrop: 'static' });
    modalRef.componentInstance.title = "編輯";
    modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));
    modalRef.componentInstance.PSlist = JSON.parse(JSON.stringify(this.PSlist));
    modalRef.componentInstance.Pplist = JSON.parse(JSON.stringify(this.Pplist));
    modalRef.componentInstance.Svlist = JSON.parse(JSON.stringify(this.Svlist));
    modalRef.result.then((res: any) => {
      let data = res;
      this.apiSvc.updateservicenodetailinfo(this.selected.id, data).pipe(
        catchError(err => {
          var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '編輯失敗，該服務編號已有相同的購電業用電戶';
          }
          this.toastr.error(
            '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
            errorMessage
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
      this.apiSvc.deleteservicenodetailinfo(this.selected.id).pipe(
        catchError(err => {
          var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '刪除失敗，需先刪除對應服務編號資料';
          }
          this.toastr.error(
            '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
            errorMessage
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
    PSlist: this.apiSvc.getpsmeternoinfo(),
    Pplist:this.apiSvc.getppmeternoinfo(),
    Svlist:this.apiSvc.getservicenoinfo()
  }).subscribe(({ PSlist,Pplist,Svlist }) => {
    this.PSlist = PSlist
    this.Pplist = Pplist
    this.Svlist = Svlist
    this.apiSvc.getservicenodetailinfo()
      .pipe(
        tap((data: any[]) => {
          data.map(e => {
            e['detail']=[{
              id:e.id,
              name:'資料維護',
              url:'service/servicenodetaildata'
            }]
          });
          this.servicenodetailinfo = data;
          this.dataSource = new MatTableDataSource<any>(data);
          this.loaded = true;
        })
      )
      .subscribe();
  });
}

}
