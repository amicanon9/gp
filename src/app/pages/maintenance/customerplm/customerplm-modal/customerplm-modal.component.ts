import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: './customerplm-modal.component.html',
})
export class customerplmModalComponent implements OnInit {
  @Input() formData: any = {};
  @Input() title: String = "{ERROR}";
  @Input() crmlist: any[] = []; // 改為接收客戶清單
  selected: any = {};
  // 完整的 customerplm 表單定義
  formGroup = this.fb.group({
  id: [-1],
  name: [null, [Validators.required]],
  tax_id_no: [null],
  // 聯絡人與電話 1-5
  contact: [null], telephone: [null],
  contact2: [null], telephone2: [null],
  contact3: [null], telephone3: [null],
  contact4: [null], telephone4: [null],
  contact5: [null], telephone5: [null],
  // 其他資訊
  decision_level: [null],
  industry_crm: [null],
  existing_plm: [null],
  existing_cad: [null],
  description: [null]
});

  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder
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
    if (this.formGroup.valid) {
      let data = this.formGroup.getRawValue();
      this.modal.close(data);
    }
  }
}