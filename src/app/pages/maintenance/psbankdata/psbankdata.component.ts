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
import { PsbankdataModalComponent } from './psbankdata-modal/psbankdata-modal.component';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'sepvdb-psbankdata',
  templateUrl: './psbankdata.component.html',
  styleUrls: ['./psbankdata.component.scss']
})



export class PsbankdataComponent implements OnInit {
  search: string;
  data: any;
  stype: any={
    name:'購電業',
    key:'id',
    pk_key:'info_id',
    display_name:'ps_name'
  };
  stype_filter: string="";
  psbankdata: any;
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
      { name: 'ps_name', displayName: '購電業',width:250 },
      { name: 'branch_name', displayName: '銀行名稱',width:300 },
      { name: 'bank_account_number', displayName: '銀行帳號',width:250},
      { name: 'description', displayName: '說明' },
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
  branchlist: any;
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


  
  ngOnInit() {
    this.signalRSvc.StartConnection()
        this.signalRSvc.ReceiveListener()?.on('PsbankData', (data) => {
          this.onDataRefresh();
        })
    this.loadData();
  }

  onSelect($event: any) {
    this.selected = $event;
  }
  onAdd() {
    const modalRef = this.modalSvc.open(PsbankdataModalComponent, { windowClass: "modal-mySize", backdrop: 'static' });
    modalRef.componentInstance.title = "新增";
    modalRef.componentInstance.infolist = JSON.parse(JSON.stringify(this.infolist));
    modalRef.componentInstance.branchlist = JSON.parse(JSON.stringify(this.branchlist));
    if(this.namiTable.stype_filter) modalRef.componentInstance.formData.info_id=parseInt(this.namiTable.stype_filter)
    modalRef.result.then((res: any) => {
      let data = res;
   
      this.apiSvc.createpsbankdata(data).pipe(
        catchError(err => {
          var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '新增失敗，重複的資料';
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
    const modalRef = this.modalSvc.open(PsbankdataModalComponent, { windowClass: 'modal-mySize', backdrop: 'static' });
    modalRef.componentInstance.title = "編輯";
    modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));
    modalRef.componentInstance.infolist = JSON.parse(JSON.stringify(this.infolist));
    modalRef.componentInstance.branchlist = JSON.parse(JSON.stringify(this.branchlist));
    modalRef.result.then((res: any) => {
      let data = res;
      this.apiSvc.updatepsbankdata(this.selected.id, data).pipe(
        catchError(err => {
         var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '編輯失敗，重複的資料';
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
      this.apiSvc.deletepsbankdata(this.selected.id).pipe(
        catchError(err => {
          var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '刪除失敗，需先刪除服務編號的銀行對應';
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
    etypelist: this.apiSvc.getCodeLookup('etype'),
    branchlist: this.apiSvc.getbankbranchinfo(),
    infolist: this.apiSvc.getpsbasicinfo(),
  }).subscribe(({ etypelist, branchlist,infolist }) => {
    this.etypelist = etypelist;
    this.infolist = infolist;
    this.branchlist = branchlist.map(item => ({
      ...item,
      label: `(${item.branch_no})${item.branch_name}`
    }));;
    this.apiSvc.getpsbankdata()
      .pipe(
        tap((data: any[]) => {
          this.psbankdata = data;
          this.dataSource = new MatTableDataSource<any>(data);
          this.loaded = true;
          
        })
      )
      .subscribe();
  });
}

}
