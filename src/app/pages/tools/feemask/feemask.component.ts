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
import { ActivatedRoute } from '@angular/router';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
@Component({
  selector: 'sepvdb-feemask',
  templateUrl: './feemask.component.html',
  styleUrls: ['./feemask.component.scss']
})



export class FeemaskComponent implements OnInit {
  search: string;
  data: any;
  categorys: any;
  feemask: any;
  infolist:any;
  pageFilter: any = 2;
  // 新增變數控制 UI
  selectedPsName: string = "";
  isProcessing: boolean = false;
  processPercent: number = 0;
  totalPages: number = 0;
  currentPage: number = 0;
  // --- 在類別內新增變數 ---
  selectedMeterNos: string[] = []; // 使用者勾選的電號
  filteredMeterNos: string[] = []; // 當前 ps_name 下所有的電號清單
  dataSource!: MatTableDataSource<any>;
  subs: any;
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
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js`;
        this.route.queryParams.subscribe(params => {
          if(params.id)this.stype_filter = params.id
        });
       }
get uniquePsNames() {
  if (!this.feemask) return [];
  return [...new Set(this.feemask.map(item => item.ps_name))].filter(n => n);
}
// 當購電業名稱改變時觸發
onPsNameChange() {
  this.selectedMeterNos = []; // 重置已選電號
  if (this.selectedPsName) {
    // 加上 <string[]> 或是 as string[] 來明確指定類型
    this.filteredMeterNos = [...new Set(
      this.feemask
        .filter((item: any) => item.ps_name === this.selectedPsName)
        .map((item: any) => String(item.ps_power_no))
        .filter((no: string) => no && no !== 'undefined')
    )] as string[]; // <--- 關鍵：在這裡加上斷言

    // 預設全選
    this.selectedMeterNos = [...this.filteredMeterNos];
  } else {
    this.filteredMeterNos = [];
  }
}
// 全選判斷
isAllMeterNosSelected() {
  return this.selectedMeterNos.length === this.filteredMeterNos.length && this.filteredMeterNos.length > 0;
}

// 全選切換
toggleAllMeterNos(checked: boolean) {
  if (checked) {
    this.selectedMeterNos = [...this.filteredMeterNos];
  } else {
    this.selectedMeterNos = [];
  }
}

async processPdf(event: any) {
  const file = event.target.files[0];
  // 檢查 ps_name 與是否至少選了一個電號
  if (!file || !this.selectedPsName || this.selectedMeterNos.length === 0) return;

  this.isProcessing = true;
  this.processPercent = 0;

  try {
    const arrayBuffer = await file.arrayBuffer();
    await this.convertToImagePdf(arrayBuffer, this.selectedMeterNos);
    
    this.toastr.success(
      '<span data-notify="icon" class="nc-icon nc-bell-55"></span>' +
      '<span data-notify="message">PDF 處理完成並已開始下載</span>',
      "",
      { timeOut: 3000, closeButton: true, enableHtml: true, toastClass: "alert alert-success alert-with-icon", positionClass: "toast-top-center" }
    );
  } catch (error) {
    // ... 錯誤處理保持不變
  } finally {
    this.isProcessing = false;
    event.target.value = '';
  }
}

// --- 修改 convertToImagePdf ---
async convertToImagePdf(buffer: ArrayBuffer, targetNos: string[]) {
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  const newPdfDoc = await PDFDocument.create();

  this.totalPages = pdf.numPages;
  if (this.totalPages <= this.pageFilter) {
    this.toastr.warning(
      '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">該 PDF 檔案頁數不足，無法去除前兩頁</span>',
      "",
      { enableHtml: true, toastClass: "alert alert-warning alert-with-icon", positionClass: "toast-top-center" }
    );
    return;
  }

  // 目標電號陣列
  const cleanTargetNos = targetNos.map(no => no.replace(/-/g, ''));
  // 從第 3 頁開始處理
  for (let i = this.pageFilter+1; i <= pdf.numPages; i++) {
    this.currentPage = i;
    const processedPages = i - this.pageFilter;
    const totalToProcess = pdf.numPages - this.pageFilter;
    this.processPercent = (processedPages / totalToProcess) * 100;

    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];
    
    const scale = 3.0;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    const targetYRanges: { top: number, bottom: number }[] = [];
    const rowTolerance = 3; // 行高容許誤差值，避免字體偏移

    items.forEach((item: any) => {
      const cleanText = item.str.replace(/-/g, '').trim();
      console.log(item)
      // 檢查此區塊是否包含任何一個目標電號
      const isTarget = cleanTargetNos.some(target => cleanText.includes(target));

      if (isTarget) {
        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
        const y = tx[5]; // Y 座標
        const h = item.height * scale;
        // 記錄此行的垂直範圍
        targetYRanges.push({ 
          top: y + rowTolerance, 
          bottom: y - h - rowTolerance 
        });
      }
    });


items.forEach((item: any) => {
  const rawText = item.str.trim();
    // 服務編號排除
  if (rawText.includes('-')) {
    return;
  }
  const cleanText = rawText.replace(/\s+/g, '');
  // 判定是否為電號格式
  const isPureMeterNo = cleanText.length >= 8 && 
                        /\d/.test(cleanText) && 
                        !/[\u4e00-\u9fa5]/.test(rawText);

  if (isPureMeterNo) {
    const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
    const x = tx[4];
    const y = tx[5];
    const h = item.height * scale;
    const w = item.width * scale;




    // 檢查目前是否落在「目標行」的範圍內
    const isInTargetRow = targetYRanges.some(range => 
      y <= range.top && y >= range.bottom
    );

    if (!isInTargetRow) {
      ctx.fillStyle = 'black';
      
    
      const tableRightPadding = 204 * scale; // 根據 scale 調整，確保蓋到最後一個欄位
      const maskWidth = w + tableRightPadding; 
      
      // 執行遮蓋：從 X 座標開始往右蓋到表格結束
      ctx.fillRect(x - 5, y - h - 2, maskWidth, h + 5);
    }
  }
});

    // 轉回 PDF 頁面
    const imageData = canvas.toDataURL('image/png');
    const pngImage = await newPdfDoc.embedPng(imageData);
    const newPage = newPdfDoc.addPage([viewport.width / scale, viewport.height / scale]);
    newPage.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: viewport.width / scale,
      height: viewport.height / scale,
    });
  }

  const pdfBytes = await newPdfDoc.save();
  this.downloadFile(pdfBytes, `${this.selectedPsName}_遮罩處理.pdf`);
}
  downloadFile(data: Uint8Array, fileName: string) {
    const blob = new Blob([data as any], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
  ngOnInit() {

    this.loadData();
  }

  onSelect($event: any) {
    this.selected = $event;
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
          this.feemask = data;
          this.dataSource = new MatTableDataSource<any>(data);
          this.loaded = true;
        })
      )
      .subscribe();
  });
}

}
