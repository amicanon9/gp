import { PsbasicinfoModalComponent } from './psbasicinfo-modal/psbasicinfo-modal.component';
import { ApiService } from 'app/_services/api.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { catchError, finalize, tap } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { TableComponent } from 'app/_components/sepv-table/sepv-table.component';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DroplistService } from 'app/_services/droplist.service';
import { MatDialog } from '@angular/material/dialog';
import * as XLSX from 'xlsx';
import { SignalrService } from 'app/_services/signalr.service';
import { AuthService } from 'app/_services/auth.service';
@Component({
  selector: 'sepvdb-psbasicinfo',
  templateUrl: './psbasicinfo.component.html',
  styleUrls: ['./psbasicinfo.component.scss']
})



export class PsbasicInfoComponent implements OnInit {
  search: string;
  data: any;
  categorys: any;
  psbasicinfo: any;
  booklist:any;
  isExporting = false;
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
      { name: 'ps_no', displayName: '代號' },
      { name: 'ps_name', displayName: '公司名稱', width: 250 },
      { name: 'tax_id_no', displayName: '統一編號' },
      { name: 'contact', displayName: '聯絡人' },
      { name: 'telephone', displayName: '聯絡電話', width: 250},
      { name: 'description', displayName: '說明' },
      { name: 'email', displayName: 'Email',width:250 },
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
    public authSvc :AuthService
  ) { }


  
  ngOnInit() {
    this.signalRSvc.StartConnection()
        this.signalRSvc.ReceiveListener()?.on('PsbasicInfo', (data) => {
          this.onDataRefresh();
        })
    this.loadData();
  }
 onExcelImport() {
  
    var excelobj = { "new": [], "update": [] };
    const xlsx = this.xlsx.nativeElement; xlsx.onchange = (event) => {
      this.isExporting = true;
      /* wire up file reader */
      const target: DataTransfer = <DataTransfer>(event.target);
      if (target.files.length !== 1) {
        throw new Error('Cannot use multiple files');
      }
      const reader: FileReader = new FileReader();
      reader.readAsBinaryString(target.files[0]);
      reader.onload = (e: any) => {
        /* create workbook */
        const binarystr: string = e.target.result;
        const wb: XLSX.WorkBook = XLSX.read(binarystr, { type: 'binary' });

        /* selected the first sheet */
        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];

        /* save data */
        const data = XLSX.utils.sheet_to_json(ws);
        this.xlsx.nativeElement.value = "" // to get 2d array pass 2nd parameter as object {header: 1}

        const psinfo = {};
        const ppinfo = {};
        const serviceinfo = {};
        console.log(data)
        data.slice(0).forEach((e,index) => {
            //購電
            const pstax = e['購電業'];
               //服務編號
            const service_no = e["服務編號"];
              if (!serviceinfo[service_no]) {
                  serviceinfo[service_no] = {
                      id:-1,
                      service_no: service_no,
                      ps_total_kwp: e['購電裝置容量(瓩)'],
                      pp_rate:null,
                      description: null,
                     
                      servicenodetailinfo: [],
                  };
            }

                          // 處理多個用戶表號
              const ppMeters = e['用戶表號']
                  ? e['用戶表號'].split(',').map(m => m.trim())
                  : [null];

              // 處理多個購電表號
              const psMeters = e['購電業表號']
                  ? e['購電業表號'].split(',').map(m => m.trim())
                  : [null];

                  
            if (!psinfo[pstax]) {
            psinfo[pstax] = {
                id:-1,
                ps_no: null,
                ps_name: e['購電業'],
                tax_id_no: e['統一編號'],
                description: null,
                email:e["Email"],
                pspowerNoInfo: [],
                contact:e["聯絡窗口"],
                telephone:e['聯絡電話']
                };
            }
            

            psMeters.forEach(psMeterNo => {
                psinfo[pstax].pspowerNoInfo.push({
                    power_no: e['購電業電號'],
                    meter_no: psMeterNo,
                    id: -1,
                    info_id: null, // 等資料庫新增後再對應 psbasic.id
                    ps_bank_name: e['分行代碼'],
                    bank_account_number: e['受款人帳戶'],
                    trust_bank_name: e['信託合約銀行'],
                    site_name: e['案場名稱'],
                    address: e['設置廠址'],
                    description: null,
                    etype: e['發電類型'],
                });
            });

            //用電
            const pptax = e["用電業統編"];
              if (!ppinfo[pptax]) {
                  ppinfo[pptax] = {
                      id:-1,
                      pp_no: null,
                      pp_name: e['用電業'],
                      tax_id_no: e['用電業統編'],
                      description: null,
                      ctype: e['行業別(售電業)'],
                      pppowerNoInfo: []
                  };
            }

            ppinfo[pptax].pppowerNoInfo.push({
                  power_no: e['購電業電號=台電電號'],
                  id:-1,
                  info_id: null, // 等資料庫新增後再對應 psbasic.id
                  description:null,
                
                
            });
         

              ppMeters.forEach(ppMeterNo => {
                  psMeters.forEach(psMeterNo => {
                      serviceinfo[service_no].servicenodetailinfo.push({
                          id: -1,
                          ps_total_kwp: e['購電裝置容量(瓩)'],
                          ps_meter_no: psMeterNo,
                          pp_meter_no: ppMeterNo,
                          description: null,
                          ps_pp_percent: e['轉供比例(%)'] ? e['轉供比例(%)'] * 100 : null,
                          ps_rate: e['購電費率'],
                          type: e['設置型式'],
                      });
                  });
              });
        });

        const pslist = Object.keys(psinfo).map(key => psinfo[key]);
        const pplist = Object.keys(ppinfo).map(key => ppinfo[key]);
        const servicelist = Object.keys(serviceinfo).map(key => serviceinfo[key]);
        const json={
          pslist:pslist,
          pplist:pplist,
          servicelist:servicelist,
        };
        console.log(json)
        this.apiSvc.impotData(json).subscribe((e:any)=>{
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
    }

    xlsx.click();
  }
  onSelect($event: any) {
    this.selected = $event;
  }
  onAdd() {
    const modalRef = this.modalSvc.open(PsbasicinfoModalComponent, { windowClass: "modal-mySize", backdrop: 'static' });
    modalRef.componentInstance.title = "新增";
    modalRef.componentInstance.psbasicinfo = JSON.parse(JSON.stringify(this.psbasicinfo));
    modalRef.componentInstance.booklist = JSON.parse(JSON.stringify(this.booklist));
    modalRef.componentInstance.formData.book_id=parseInt(this.authSvc.state.book_id)
    modalRef.result.then((res: any) => {
      let data = res;
   
      this.apiSvc.createpsbasicinfo(data).pipe(
        catchError(err => {
           var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '新增失敗';
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
    const modalRef = this.modalSvc.open(PsbasicinfoModalComponent, { windowClass: 'modal-mySize', backdrop: 'static' });
    modalRef.componentInstance.title = "編輯";
    modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));
    modalRef.componentInstance.booklist = JSON.parse(JSON.stringify(this.booklist));
    modalRef.result.then((res: any) => {
      let data = res;
      this.apiSvc.updatepsbasicinfo(this.selected.id, data).pipe(
        catchError(err => {
          var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '編輯失敗';
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
      this.apiSvc.deletepsbasicinfo(this.selected.id).pipe(
        catchError(err => {
           var errorMessage = '無法連接伺服器，請聯絡管理人員';
          if(err.status == 400){
            errorMessage = '刪除失敗，需先刪除對應的購電業銀行、購電業電號';
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
    this.apiSvc.getSetOfBooks().subscribe(x=>{
      this.booklist=x
      this.apiSvc.getpsbasicinfo()
      .pipe(
        tap((data: any[]) => {
          data.map(e=>{
            e['detail']=[{
              id:e.id,
              name:'電號維護',
              url:'ps/pspowernoinfo'
            },
          {
              id:e.id,
              name:'銀行維護',
              url:'ps/psbankdata'
            }]
          })
          this.psbasicinfo = data;
          this.dataSource = new MatTableDataSource<any>(data);
          this.loaded = true;
        })
      )
      .subscribe()
    })
   
  }

}
