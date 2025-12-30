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
import { PspowernoinfoModalComponent } from './pspowernoinfo-modal/pspowernoinfo-modal.component';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'sepvdb-pspowernoinfo',
  templateUrl: './pspowernoinfo.component.html',
  styleUrls: ['./pspowernoinfo.component.scss']
})



export class PspowernoinfoComponent implements OnInit {
  search: string;
  data: any;
  stype: any={
    name:'購電業',
    key:'id',
    pk_key:'info_id',
    display_name:'ps_name'
  };
  stype_filter: string="";
  pspowernoinfo: any;
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
      { name: 'power_no',displayName:'購電業電號'},
      { name: 'ps_name', displayName: '購電業',width:200 },
      { name: 'branch_name', displayName: '受款人銀行',width:250 },
      { name: 'bank_account_number', displayName: '受款人帳戶',width:200},
      { name: 'description', displayName: '說明' },
      { name: 'etype_name', displayName: '能源類型' },
      { name: 'trust_bank_name', displayName: '信託銀行',width:250 },
      { name: 'site_name', displayName: '案場名稱',width:300 },
      { name: 'address', displayName: '設置廠址',width:300 },
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
        this.signalRSvc.ReceiveListener()?.on('PspowerNoInfo', (data) => {
          this.onDataRefresh();
        })
    this.loadData();
  }

  onSelect($event: any) {
    this.selected = $event;
  }
  onAdd() {
    const modalRef = this.modalSvc.open(PspowernoinfoModalComponent, { windowClass: "modal-mySize", backdrop: 'static' });
    modalRef.componentInstance.title = "新增";
    modalRef.componentInstance.pspowernoinfo = JSON.parse(JSON.stringify(this.pspowernoinfo));
    modalRef.componentInstance.infolist = JSON.parse(JSON.stringify(this.infolist));
    modalRef.componentInstance.etypelist = JSON.parse(JSON.stringify(this.etypelist));
    modalRef.componentInstance.banklist = JSON.parse(JSON.stringify(this.banklist));
    modalRef.componentInstance.psbanklist = JSON.parse(JSON.stringify(this.psbanklist));
    if(this.namiTable.stype_filter) modalRef.componentInstance.formData.info_id=parseInt(this.namiTable.stype_filter)
    modalRef.result.then((res: any) => {
      let data = res;
   
      this.apiSvc.createpspowernoinfo(data).pipe(
        catchError(err => {
           var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '新增失敗，電號重複';
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
    const modalRef = this.modalSvc.open(PspowernoinfoModalComponent, { windowClass: 'modal-mySize', backdrop: 'static' });
    modalRef.componentInstance.title = "編輯";
    modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));
    modalRef.componentInstance.infolist = JSON.parse(JSON.stringify(this.infolist));
    modalRef.componentInstance.etypelist = JSON.parse(JSON.stringify(this.etypelist));
    modalRef.componentInstance.banklist = JSON.parse(JSON.stringify(this.banklist));
    modalRef.componentInstance.psbanklist = JSON.parse(JSON.stringify(this.psbanklist));
    modalRef.result.then((res: any) => {
      let data = res;
      this.apiSvc.updatepspowernoinfo(this.selected.id, data).pipe(
        catchError(err => {
          var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '編輯失敗，電號重複';
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
      this.apiSvc.deletepspowernoinfo(this.selected.id).pipe(
        catchError(err => {
          this.toastr.error(
            '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
            '刪除失敗，需先刪除對應的購電業表號、用電戶表號、服務編號明細'
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
    banklist: this.apiSvc.getbankinfo(),
    infolist: this.apiSvc.getpsbasicinfo(),
    psbanklist:this.apiSvc.getpsbankdata(),
  }).subscribe(({ etypelist, banklist,infolist,psbanklist }) => {
    this.etypelist = etypelist;
    this.infolist = infolist;
    this.banklist = banklist;
    // this.psbanklist = psbanklist;
    this.psbanklist = psbanklist.map(item => ({
      ...item,
      label: `${item.branch_name} - ${item.bank_account_number}`
    }));
    this.apiSvc.getpspowernoinfo()
      .pipe(
        tap((data: any[]) => {
         this.banklist = banklist.map(item => ({
            ...item,
            label: `(${item.bank_no})${item.bank_name}`
          }));;
          data.map(e => {
            e['etype_name'] = this.etypelist.find(a => a.code === e.etype)?.description || '';
            e['detail']=[{
              id:e.id,
              name:'表號維護',
              url:'ps/psmeternoinfo'
            },
            {
              id:e.id,
              name:'餘電機組',
              url:'ps/pssurplusinfo'
            },]
          });
          this.pspowernoinfo = data;
          this.dataSource = new MatTableDataSource<any>(data);
          this.loaded = true;
          
        })
      )
      .subscribe();
  });
}

}
