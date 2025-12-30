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
import { BankbranchinfoModalComponent } from './bankbranchinfo-modal/bankbranchinfo-modal.component';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'sepvdb-bankbranchinfo',
  templateUrl: './bankbranchinfo.component.html',
  styleUrls: ['./bankbranchinfo.component.scss']
})



export class BankbranchinfoComponent implements OnInit {
  search: string;
  data: any;
  stype: any={
    name:'銀行',
    key:'id',
    pk_key:'bank_id',
    display_name:'bank_name'
  };
  stype_filter: string="";
  bankbranchinfo: any;
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
      { name: 'bank_name',displayName:'銀行名稱',width:270},
      { name: 'branch_no',displayName:'分支機構代號'},
      { name: 'branch_name', displayName: '分支機構名稱' },
      { name: 'description', displayName: '說明' },
      { name: 'disable', displayName: '是否停用', templateRef:'disabled'},

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
        this.signalRSvc.ReceiveListener()?.on('Bankbranchinfo', (data) => {
          this.onDataRefresh();
        })
    this.loadData();
  }

  onSelect($event: any) {
    this.selected = $event;
  }
  onAdd() {
    const modalRef = this.modalSvc.open(BankbranchinfoModalComponent, { windowClass: "modal-mySize", backdrop: 'static' });
    modalRef.componentInstance.title = "新增";
    modalRef.componentInstance.bankbranchinfo = JSON.parse(JSON.stringify(this.bankbranchinfo));
    modalRef.componentInstance.banklist = JSON.parse(JSON.stringify(this.banklist));
    if(this.namiTable.stype_filter) modalRef.componentInstance.formData.bank_id=parseInt(this.namiTable.stype_filter)
    modalRef.result.then((res: any) => {
      let data = res;
   
      this.apiSvc.createbankbranchinfo(data).pipe(
        catchError(err => {
         var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '新增失敗，重複的分支機構代號';
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
    const modalRef = this.modalSvc.open(BankbranchinfoModalComponent, { windowClass: 'modal-mySize', backdrop: 'static' });
    modalRef.componentInstance.title = "編輯";
    modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));
    modalRef.componentInstance.banklist = JSON.parse(JSON.stringify(this.banklist));
    modalRef.result.then((res: any) => {
      let data = res;
      this.apiSvc.updatebankbranchinfo(this.selected.id, data).pipe(
        catchError(err => {
          var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '編輯失敗，重複的分支機構代號';
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
      this.apiSvc.deletebankbranchinfo(this.selected.id).pipe(
        catchError(err => {
         var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '刪除失敗，需先刪除對應的服務編號明細';
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
    banklist: this.apiSvc.getbankinfo(),
  }).subscribe(({ banklist }) => {
    this.banklist = banklist;
    this.apiSvc.getbankbranchinfo()
      .pipe(
        tap((data: any[]) => {
         
          data.map(e => {
           
          });
          this.bankbranchinfo = data;
          this.dataSource = new MatTableDataSource<any>(data);
          this.loaded = true;
          
        })
      )
      .subscribe();
  });
}

}
