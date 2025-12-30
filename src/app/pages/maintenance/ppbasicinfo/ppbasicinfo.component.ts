import { PpbasicinfoModalComponent } from './ppbasicinfo-modal/ppbasicinfo-modal.component';
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
import { AuthService } from 'app/_services/auth.service';
@Component({
  selector: 'sepvdb-ppbasicinfo',
  templateUrl: './ppbasicinfo.component.html',
  styleUrls: ['./ppbasicinfo.component.scss']
})



export class PpbasicInfoComponent implements OnInit {
  search: string;
  data: any;
  categorys: any;
  ppbasicinfo: any;
  booklist:any;
  ctypelist:any;
  table_config: any = {
    checkable: true,
    serverSide: true,
    sort: {
      active: true,
      direction: 'desc',
      disableClear: true
    },
    columns: [
      { name: 'book_name',displayName:'所屬'},
      { name: 'pp_no', displayName: '代號' },
      { name: 'pp_name', displayName: '公司名稱', width: 200 },
      { name: 'tax_id_no', displayName: '統一編號' },
      { name: 'contact', displayName: '聯絡人' },
      { name: 'telephone', displayName: '聯絡電話' },
      { name: 'description', displayName: '說明' },
      { name: 'ctype_name', displayName:'行業別' },
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
  constructor(
    private apiSvc: ApiService,
    private modalSvc: NgbModal,
    private toastr: ToastrService,
    private snackbar: MatSnackBar,
    public signalRSvc: SignalrService, 
    public authSvc:AuthService
  ) { }


  
  ngOnInit() {
    this.signalRSvc.StartConnection()
        this.signalRSvc.ReceiveListener()?.on('PpBasicInfo', (data) => {
          this.onDataRefresh();
        })
    this.loadData();
  }

  onSelect($event: any) {
    this.selected = $event;
  }
  onAdd() {
    const modalRef = this.modalSvc.open(PpbasicinfoModalComponent, { windowClass: "modal-mySize", backdrop: 'static' });
    modalRef.componentInstance.title = "新增";
    modalRef.componentInstance.ppbasicinfo = JSON.parse(JSON.stringify(this.ppbasicinfo));
    modalRef.componentInstance.booklist = JSON.parse(JSON.stringify(this.booklist));
    modalRef.componentInstance.ctypelist = JSON.parse(JSON.stringify(this.ctypelist));
    modalRef.componentInstance.formData.book_id=parseInt(this.authSvc.state.book_id)
    modalRef.result.then((res: any) => {
      let data = res;
      console.log(res)
      this.apiSvc.createppbasicinfo(data).pipe(
        catchError(err => {
          var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '新增失敗，重複的代號';
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
    const modalRef = this.modalSvc.open(PpbasicinfoModalComponent, { windowClass: 'modal-mySize', backdrop: 'static' });
    modalRef.componentInstance.title = "編輯";
    modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));
    modalRef.componentInstance.booklist = JSON.parse(JSON.stringify(this.booklist));
    modalRef.componentInstance.ctypelist = JSON.parse(JSON.stringify(this.ctypelist));
    modalRef.result.then((res: any) => {
      let data = res;
      this.apiSvc.updateppbasicinfo(this.selected.id, data).pipe(
        catchError(err => {
          var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '編輯失敗，重複的代號';
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
      this.apiSvc.deleteppbasicinfo(this.selected.id).pipe(
        catchError(err => {
          var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '刪除失敗，需先刪除對應用電戶電號';
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
    ctypelist: this.apiSvc.getCodeLookup('ctype'),
    booklist: this.apiSvc.getSetOfBooks()
  }).subscribe(({ ctypelist, booklist }) => {
    this.ctypelist = ctypelist;
    this.booklist = booklist;

    this.apiSvc.getppbasicinfo()
      .pipe(
        tap((data: any[]) => {
          data.map(e => {
            e['book_name'] = this.booklist.find(a => a.book_id === e.book_id)?.name || '';
            e['ctype_name'] = this.ctypelist.find(a => a.code === e.ctype)?.description || '';
            data.map(e=>{
            e['detail']=[{
              id:e.id,
              name:'電號維護',
              url:'pp/pppowernoinfo'
            },]
          })
          });
          this.ppbasicinfo = data;
          this.dataSource = new MatTableDataSource<any>(data);
          this.loaded = true;
        })
      )
      .subscribe();
  });
}
}
