import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ImageDialogComponent } from "app/_components/image-dialog/image-dialog.component";
import { ApiService } from "app/_services/api.service";

@Component({
  templateUrl: './customerplm-modal.component.html',
})
export class customerplmModalComponent implements OnInit {
  @Input() formData: any = {};
  @Input() title: String = "{ERROR}";
  @Input() crmlist: any[] = []; // 改為接收客戶清單
  @ViewChild('imgComponent') imgComponent: ImageDialogComponent;
  selected: any = {};
  // 完整的 customerplm 表單定義
 formGroup = this.fb.group({
  id: [-1],
  name: [null, [Validators.required]],
  tax_id_no: [null],
  
  // 聯絡人、電話與新增的 Email 1-5
  contact: [null], 
  telephone: [null],
  email: [null, [Validators.email]], // 第一組 Email 並加上格式驗證

  contact2: [null], 
  telephone2: [null],
  email2: [null, [Validators.email]], // 第二組

  contact3: [null], 
  telephone3: [null],
  email3: [null, [Validators.email]], // 第三組

  contact4: [null], 
  telephone4: [null],
  email4: [null, [Validators.email]], // 第四組

  contact5: [null], 
  telephone5: [null],
  email5: [null, [Validators.email]], // 第五組

  // 其他資訊
  decision_level: [null],
  industry_crm: [null],
  existing_plm: [null],
  existing_cad: [null],
  description: [null]
});

  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder,
    private apiSvc: ApiService
  ) { }

  ngOnInit() {
    // 如果是編輯模式，這會把舊資料填入
    if (this.formData && this.formData.id > 0) {
      // 處理日期格式 (若是字串需轉為 yyyy-MM-dd 以便 HTML5 Date Input 顯示)
      this.selected = this.formData.customer
      if(this.formData.close_date) {
        this.formData.close_date = this.formData.close_date.split('T')[0];
      }
      this.formGroup.patchValue(this.formData);
    }
  }
  onchange(item: any) {
  // 如果 item 為空（例如使用者按了 X 清空選單），就給回空物件
    this.selected = item || {};
  }
  isError(item: string) {
    return this.formGroup.get(item)?.invalid &&
      (this.formGroup.get(item)?.dirty || this.formGroup.get(item)?.touched);
  }

  errorType(item: string, type: string) {
    return this.isError(item) && this.formGroup.get(item)?.hasError(type);
  }

  submit() {
    if (this.formGroup.invalid) return;
    const data = this.formGroup.getRawValue();

    if (data.id > 0) {
      // 【編輯模式】
      this.apiSvc.updatedata('customerplm', data.id, data).subscribe(async (res: any) => {
        // 就算資料沒變，也要檢查有沒有新選的圖片要傳
        await this.imgComponent.manualUpload(data.id);
        this.modal.close(true); // 關閉彈窗並傳回 true
      });
    } else {
      // 【新增模式】
      this.apiSvc.createdata('customerplm', data).subscribe(async (res: any) => {
        const newId = Array.isArray(res) ? (res[0]?.id || res[0]) : (res?.id || res);
        if (newId) {
          await this.imgComponent.manualUpload(newId);
        }
        this.modal.close(true);
      });
    }
  }
}