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
import { ServicenoinfoModalComponent } from './servicenoinfo-modal/servicenoinfo-modal.component';
import { AuthService } from 'app/_services/auth.service';
@Component({
  selector: 'sepvdb-servicenoinfo',
  templateUrl: './servicenoinfo.component.html',
  styleUrls: ['./servicenoinfo.component.scss']
})



export class ServicenoinfoComponent implements OnInit {
  search: string;
  data: any;
  categorys: any;
  servicenoinfo: any;
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
      { name: 'book_name', displayName: '所屬' },
      { name: 'service_no', displayName: '服務編號' },
      { name: 'ps_total_kwp', displayName: '購電裝置容量(瓩)' },
      { name: 'pp_rate', displayName: '售電費率' },
      { name: 'description', displayName: '說明' },
      { name: 'detail', displayName: '資料維護', templateRef:'detail' },
    ]
      };
  dataSource!: MatTableDataSource<any>;
  subs: any;
  isExporting = false;
  ticket: any;
  maxTableHeight = '700px';
  minTableHeight = 'unset';
  selected: any;
  @ViewChild('namiTable') namiTable!: TableComponent;
  loaded = false;
  @ViewChild("xlsx", { static: false })
  xlsx: ElementRef;
  etypelist: any;
  booklist: any;
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
        this.signalRSvc.ReceiveListener()?.on('servicenoinfo', (data) => {
          this.onDataRefresh();
        })
    this.loadData();
  }
onExcelImport() {
  var excelobj = { new: [], update: [] };
  const xlsx = this.xlsx.nativeElement;

  xlsx.onchange = (event) => {
      this.isExporting = true;

    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) {
      throw new Error('Cannot use multiple files');
    }

    const reader: FileReader = new FileReader();
    reader.readAsBinaryString(target.files[0]);

    reader.onload = (e: any) => {
      const binarystr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(binarystr, { type: 'binary' });

      // 根據你提供的圖片，是第 2 個 Sheet（索引 1）
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      const rawText: string = ws['A2']?.v || '';
      const service_no = rawText.split('：')[1]?.trim() || '';
      const rawText2: string = ws['F2']?.v || ''; // "帳單年月：2025/6"
      const match = rawText2.match(/(\d{4})\/(\d{1,2})/);

      let year: string = '';
      let month: string = '';

      if (match) {
        year = match[1];  // "2025"
        month = match[2]; // "6"
      }

      

      // 讀取第 4 列（實際資料從第 5 列開始）
      const data = XLSX.utils.sheet_to_json(ws, { range: 2 }); // Excel 的 index 從 0 開始，3 表示從第 4 列起
      let list = []
      data.forEach((e,index) => {
            list.push({
              service_no:service_no,
              ps_power_no:e['發電電號'],
              ps_meter_no:e['發電表號'],
              pp_power_no:e['用戶電號'],
              pp_meter_no:e['用戶表號'],
              bill_year:year,
              bill_month:month,
              dispatching_rate:e['電力調度費率'],
              distribution_rate:e['配電費率'],
              fee:e['費用'],
              transmission_rate:e['輸電費率'],
              kwh_usage:e['月服務使用量(kWh)'],
              ancillary_services_rate:e['輔助服務費率'],     
            })
      });

      this.xlsx.nativeElement.value = "";

      this.apiSvc.impotService(list).subscribe((e:any)=>{
           this.isExporting = false;
         if (e.failure && e.failure.length > 0) {
           // 顯示錯誤筆數
            this.toastr.error(
              `<span data-notify="icon" class="nc-icon nc-bell-55"></span>` +
              `<span data-notify="message">匯入完成，但有 ${e.failure.length} 筆錯誤</span>`,
              '',
              {
                timeOut: 5000,
                closeButton: true,
                enableHtml: true,
                toastClass: 'alert alert-danger alert-with-icon',
                positionClass: 'toast-top-center'
              }
            );

            // 產生錯誤內容文字
            const errorContent = e.failure.join('\r\n');

            // 建立 blob 並自動下載
            const blob = new Blob([errorContent], { type: 'text/plain;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `匯入錯誤${new Date().toISOString().slice(0,10)}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            this.onDataRefresh();
          } else {
            this.toastr.success(
              '<span data-notify="icon" class="nc-icon nc-bell-55"></span>' +
              '<span data-notify="message">匯入完成</span>',
              '',
              {
                timeOut: 5000,
                closeButton: true,
                enableHtml: true,
                toastClass: 'alert alert-success alert-with-icon',
                positionClass: 'toast-top-center'
              }
            );
            this.onDataRefresh();
          }

        })
    };
  };

  xlsx.click();
}
  onSelect($event: any) {
    this.selected = $event;
  }
  onAdd() {
    const modalRef = this.modalSvc.open(ServicenoinfoModalComponent, { windowClass: "modal-mySize", backdrop: 'static' });
    modalRef.componentInstance.title = "新增";
    modalRef.componentInstance.servicenoinfo = JSON.parse(JSON.stringify(this.servicenoinfo));
    modalRef.componentInstance.booklist = JSON.parse(JSON.stringify(this.booklist));
    modalRef.componentInstance.formData.book_id=parseInt(this.authSvc.state.book_id)
    modalRef.result.then((res: any) => {
      let data = res;
   
      this.apiSvc.createservicenoinfo(data).pipe(
        catchError(err => {
         var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '新增失敗，重複的服務編號';
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
    const modalRef = this.modalSvc.open(ServicenoinfoModalComponent, { windowClass: 'modal-mySize', backdrop: 'static' });
    modalRef.componentInstance.title = "編輯";
    modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));
    modalRef.componentInstance.booklist = JSON.parse(JSON.stringify(this.booklist));
    modalRef.result.then((res: any) => {
      let data = res;
      this.apiSvc.updateservicenoinfo(this.selected.id, data).pipe(
        catchError(err => {
         var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '編輯失敗，重複的服務編號';
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
      this.apiSvc.deleteservicenoinfo(this.selected.id).pipe(
        catchError(err => {
           var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '刪除失敗，需先刪除對應服務編號明細';
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
    booklist: this.apiSvc.getSetOfBooks(),
  }).subscribe(({ booklist }) => {
    this.booklist = booklist
    this.apiSvc.getservicenoinfo()
      .pipe(
        tap((data: any[]) => {
          data.map(e => {
              e['detail']=[{
              id:e.id,
              name:'明細維護',
              url:'service/servicenodetailinfo'
            },]
          });
          this.servicenoinfo = data;
          this.dataSource = new MatTableDataSource<any>(data);
          this.loaded = true;
        })
      )
      .subscribe();
  });
}

}
