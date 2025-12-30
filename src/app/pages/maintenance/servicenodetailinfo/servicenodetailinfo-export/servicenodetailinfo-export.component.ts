import { ApiService } from '../../../../_services/api.service';
import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { PDFDocument } from 'pdf-lib';

@Component({
  templateUrl: './servicenodetailinfo-export.component.html',
})
export class ServicenodetailinfoExportComponent implements OnInit {
  @Input() formData: any = {};
  @Input() categorys!: any[];
  @Input() servicenodetailinfo: any[] = [];
  @Input() title: String = "{ERRRO}";
  @Input() PSlist: any;
  @Input() Pplist: any;
  @Input() Svlist: any;

  isExporting = false;
  private exportingCount = 0;
  date = new Date();
  formGroup: FormGroup;
  filteredList: any[] = [];
  selectedMap = new Map<string, boolean>(); // id -> 勾選狀態
  showOnlySelected = false;
  isSingleExport = false; // 是否個別匯出
  noTax:boolean = false; // 是否不含營業稅
  hide:boolean = false; // 是否隱藏特定欄位
  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder,
    private apiSvc: ApiService
  ) {
    const date = new Date();
    date.setMonth(date.getMonth() - 1); // 預設為上個月
    this.formGroup = this.fb.group({
      service_no: [''],
      ps_name: [''],
      ps_power_no: [''],
      branch_name:[''],
      monthDate: [date.toISOString().slice(0, 7)]
    });
  }
  private uniqueByPowerNo(list: any[]): any[] {
    // 保留第一筆
    const seen = new Set<string>();
    return list.filter(item => {
      if (seen.has(item.ps_power_no)) return false;
      seen.add(item.ps_power_no);
      return true;
    });
  }
  ngOnInit() {
    this.filteredList = this.uniqueByPowerNo(this.servicenodetailinfo);
    this.formGroup.valueChanges.subscribe(() => {
      this.filterData();
    });
  }

  toggleAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      // 勾選全部
      this.filteredList.forEach(item => this.selectedMap.set(item.id, true));
    } else {
      // 取消全部 (只清除目前顯示的)
      this.filteredList.forEach(item => this.selectedMap.delete(item.id));
    }
  }

  isChecked(item: any): boolean {
    return this.selectedMap.has(item.id);
  }

  onItemCheckChange(item: any, checked: boolean) {
    if (checked) {
      this.selectedMap.set(item.id, true);
    } else {
      this.selectedMap.delete(item.id);
    }
  }

  filterData() {
  const { service_no, ps_name, ps_power_no, branch_name } = this.formGroup.value;

  let data = this.servicenodetailinfo.filter(item =>
    (!service_no || item.service_no.includes(service_no)) &&
    (!ps_name || item.ps_name.includes(ps_name)) &&
    (!ps_power_no || item.ps_power_no.includes(ps_power_no)) &&
    (!branch_name || item.branch_name.includes(branch_name))
  );

  if (this.showOnlySelected) {
    data = data.filter(item => this.selectedMap.has(item.id));
  }

    this.filteredList = this.uniqueByPowerNo(data);
  }


  // applyFilter() {
  //    const { service_no, ps_name, ps_power_no, branch_name } = this.formGroup.value;
  //   this.filteredList = this.uniqueByPowerNo(
  //     this.servicenodetailinfo.filter(item =>
  //       (!service_no || item.service_no.includes(service_no)) &&
  //       (!ps_name || item.ps_name.includes(ps_name)) &&
  //       (!ps_power_no || item.ps_power_no.includes(ps_power_no))&&
  //       (!branch_name || item.branch_name.includes(branch_name))
  //     )
  //   );
  // }


  toggleShowOnlySelected() {
    this.filterData();
  }

  async export() {
    const monthDate = this.formGroup.value.monthDate;
    const [year, month] = (monthDate || '').split('-');
    const selectedItems = this.servicenodetailinfo
      .filter(item => this.selectedMap.has(item.id));

    if (selectedItems.length === 0) {
      return;
    }

    this.isExporting = true;
    this.exportingCount = selectedItems.length;

    const BATCH_SIZE = 19;
    const chunks: any[][] = [];
    for (let i = 0; i < selectedItems.length; i += BATCH_SIZE) {
      chunks.push(selectedItems.slice(i, i + BATCH_SIZE));
    }

    const allResults: Array<{
      item: any;
      blob: Blob | null;
      error: any;
    }> = [];

    for (const batch of chunks) {
      const batchPromises = batch.map(async item => {
        const payload = {
          reportName: '綠電系統用帳單',
          year,
          month,
          service_no: item.service_no,
          power_no: item.ps_power_no,
          format: 'pdf',
          noTax: this.noTax ? true : false,
          hide: this.hide ? true : false,
        };
        try {
          const blob: Blob = await this.apiSvc.getReport(payload).toPromise();
          return { item, blob, error: null };
        } catch (err) {
          return { item, blob: null, error: err };
        } finally {
          this.exportingCount--;
          if (this.exportingCount === 0) {
            this.isExporting = false;
          }
        }
      });

      const results = await Promise.all(batchPromises);
      allResults.push(...results);
    }

    const successful = allResults.filter(r => r.blob && !r.error);
    const failed = allResults.filter(r => r.error);

    if (successful.length === 0) {
      console.error('所有 PDF 都取得失敗', failed);
      return;
    }

    try {
    if (this.isSingleExport) {
      // ✅ 個別匯出
     for (const r of successful) {
      const url = window.URL.createObjectURL(r.blob!);
      const a = document.createElement('a');
      a.href = url;
      a.download = `購電通知單_${r.item.service_no}_${monthDate}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      // 等 500 毫秒再下載下一張，避免被瀏覽器擋
      await new Promise(res => setTimeout(res, 500));
    }
    } else {
      // ✅ 合併匯出
      const mergedPdf = await PDFDocument.create();
      for (const r of successful) {
        const arrayBuffer = await r.blob!.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(p => mergedPdf.addPage(p));
      }

      const mergedBytes = await mergedPdf.save();
      const mergedBlob = new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(mergedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `購電通知單_${monthDate}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  } catch (mergeErr) {
    console.error('匯出 PDF 發生錯誤', mergeErr);
  }

    if (failed.length > 0) {
      console.warn('以下項目抓取失敗：', failed.map(f => f.item));
    }
  }
}
