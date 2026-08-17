import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: './projectplm-modal.component.html',
})
export class projectplmModalComponent implements OnInit {
  @Input() formData: any = {};
  @Input() title: String = "{ERROR}";
  @Input() cuslist: any[] = []; // 改為接收客戶清單
  @Input() syslist: any[] = [];
  @Input() agslist: any[] = [];
  @Input() userlist: any[] = [];
  selected: any = {};
  // 完整的 ProjectPLM 表單定義
  formGroup = this.fb.group({
    id: [-1],
    year: [new Date().getFullYear(), [Validators.required]],
    quarter: [null],
    month: [null],
    close_date: [null],
    longshot_date: [null],
    bcd_date: [null],
    commit_date: [null],
    rfq_to_client_amount: [null],
    net_to_ds_amount: [null],
    system_inquiry_channel: [null],
    is_system_checked: [null],
    is_ags_booking: [false],
    customer_id: [null, Validators.required], // 必填
    ags_status: [null],
    under_control_longshot_year_q: [null],
    solution_mapping: [null],
    sales_owner: [null],
    service_owner: [null]
  });

  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    // 如果是編輯模式，這會把舊資料填入
    if (this.formData) {
      // 處理日期格式 (若是字串需轉為 yyyy-MM-dd 以便 HTML5 Date Input 顯示)
      console.log(this.formData)
     
      if(this.formData.close_date) {
        this.formData.close_date = this.formData.close_date.split('T')[0];
      }
      if(this.formData.longshot_date) {
        this.formData.longshot_date = this.formData.longshot_date.split('T')[0];
      }
      if(this.formData.bcd_date) {
        this.formData.bcd_date = this.formData.bcd_date.split('T')[0];
      }
      if(this.formData.commit_date) {
        this.formData.commit_date = this.formData.commit_date.split('T')[0];
      }
      this.formGroup.patchValue(this.formData);
       this.selected = this.formData.customer
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

  isNearExpiry(controlName: string) {
    const val = this.formGroup.get(controlName)?.value;
    if (!val) return false;
    const target = new Date(val);
    if (isNaN(target.getTime())) return false;
    const now = new Date();
    const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    // 若到期日在未來 30 天以內，或已過期，回傳 true
    return diffDays <= 30;
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