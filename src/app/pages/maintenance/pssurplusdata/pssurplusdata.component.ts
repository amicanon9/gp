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
import { PssurplusdataModalComponent } from './pssurplusdata-modal/pssurplusdata-modal.component';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'sepvdb-pssurplusdata',
  templateUrl: './pssurplusdata.component.html',
  styleUrls: ['./pssurplusdata.component.scss']
})



export class PssurplusdataComponent implements OnInit {
  search: string;
  data: any;
  stype: any={
    name:'機組名稱',
    key:'id',
    pk_key:'surplus_id',
    display_name:'ps_site_name'
  };
  stype_filter: string="";
  pssurplusdata: any;
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
      { name: 'power_no', displayName: '購電業電號'},
      { name: 'ps_site_name', displayName: '機組名稱',width:250 },
      { name: 'bill_year', displayName: '年' },
      { name: 'bill_month', displayName: '月'},
      { name: 'surplus_kwh', displayName: '餘電度數'},
      { name: 'surplus_amount', displayName: '餘電費用'},
      { name: 'description', displayName: '敘述'},
     
     
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
        this.signalRSvc.ReceiveListener()?.on('pssurplusdata', (data) => {
          this.onDataRefresh();
        })
    this.loadData();
  }

  onSelect($event: any) {
    this.selected = $event;
  }
  onAdd() {
    const modalRef = this.modalSvc.open(PssurplusdataModalComponent, { windowClass: "modal-mySize", backdrop: 'static' });
    modalRef.componentInstance.title = "新增";
    modalRef.componentInstance.infolist = JSON.parse(JSON.stringify(this.infolist));
    if(this.namiTable.stype_filter) modalRef.componentInstance.formData.surplus_id=parseInt(this.namiTable.stype_filter)

    modalRef.result.then((res: any) => {
      let data = res;
   
      this.apiSvc.createpssurplusdata(data).pipe(
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
    const modalRef = this.modalSvc.open(PssurplusdataModalComponent, { windowClass: 'modal-mySize', backdrop: 'static' });
    modalRef.componentInstance.title = "編輯";
    modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));
    modalRef.componentInstance.infolist = JSON.parse(JSON.stringify(this.infolist));
    modalRef.result.then((res: any) => {
      let data = res;
      this.apiSvc.updatepssurplusdata(this.selected.id, data).pipe(
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
      this.apiSvc.deletepssurplusdata(this.selected.id).pipe(
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
    infolist: this.apiSvc.getpssurplusinfo(),
  }).subscribe(({infolist }) => {
    this.infolist = infolist;
    this.apiSvc.getpssurplusdata()
      .pipe(
        tap((data: any[]) => {
          this.pssurplusdata = data;
          this.dataSource = new MatTableDataSource<any>(data);
          this.loaded = true;
          
        })
      )
      .subscribe();
  });
}

}
