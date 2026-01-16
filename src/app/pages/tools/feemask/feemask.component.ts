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
  const cleanTargetNos = targetNos.map(no => no.replace(/-/g, ''));

  // 建立一個重複利用的 canvas，避免一直建立新物件
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: false })!; // 關閉 alpha 通道可節省記憶體

  for (let i = this.pageFilter + 1; i <= pdf.numPages; i++) {
    this.currentPage = i;
    const totalToProcess = pdf.numPages - this.pageFilter;
    this.processPercent = ((i - this.pageFilter) / totalToProcess) * 100;

    const page = await pdf.getPage(i);
    const scale = 2.0; // 建議調低 scale (例如 2.0)，3.0 在 1200 頁會太巨大
    const viewport = page.getViewport({ scale });

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // 渲染頁面
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;

    // --- 遮蓋邏輯 (保持你原本的邏輯，但建議抽出來) ---
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];
    const targetYRanges: { top: number, bottom: number }[] = [];
    const rowTolerance = 3;

    // 第一輪：找目標座標
    items.forEach((item: any) => {
      const cleanText = item.str.replace(/-/g, '').trim();
      const isTarget = cleanTargetNos.some(target => cleanText.includes(target));
      if (isTarget) {
        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
        targetYRanges.push({ 
          top: tx[5] + rowTolerance, 
          bottom: tx[5] - (item.height * scale) - rowTolerance 
        });
      }
    });

    // 第二輪：執行遮蓋
    items.forEach((item: any) => {
      const rawText = item.str.trim();
      if (rawText.includes('-')) return;
      const cleanText = rawText.replace(/\s+/g, '');
      const isPureMeterNo = cleanText.length >= 8 && /\d/.test(cleanText) && !/[\u4e00-\u9fa5]/.test(rawText);

      if (isPureMeterNo) {
        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
        const isInTargetRow = targetYRanges.some(range => tx[5] <= range.top && tx[5] >= range.bottom);
        if (!isInTargetRow) {
          ctx.fillStyle = 'black';
          const maskWidth = (item.width * scale) + (204 * scale);
          ctx.fillRect(tx[4] - 5, tx[5] - (item.height * scale) - 2, maskWidth, (item.height * scale) + 5);
        }
      }
    });

    // --- 關鍵優化處 ---
    // 1. 改用 jpeg 並降低品質 (0.75)
    const imageData = canvas.toDataURL('image/jpeg', 0.75); 
    const jpgImage = await newPdfDoc.embedJpg(imageData);
    
    const newPage = newPdfDoc.addPage([viewport.width / scale, viewport.height / scale]);
    newPage.drawImage(jpgImage, {
      x: 0,
      y: 0,
      width: viewport.width / scale,
      height: viewport.height / scale,
    });

    // 2. 釋放目前頁面的引用
    page.cleanup(); 
    
    // 3. 每處理 50 頁強制暫停一下，讓瀏覽器有機會進行垃圾回收 (GC)
    if (i % 50 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // 清空畫布資源
  canvas.width = 0;
  canvas.height = 0;

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
