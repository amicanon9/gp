import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'sepvdb-projectsvc-modal',
  templateUrl: './projectsvc-modal.component.html',
})
export class projectsvcModalComponent implements OnInit {
  @Input() formData: any = {};
  @Input() title: String = "{ERROR}";
  @Input() userlist: any[] = []; // 主要使用人員清單 (PM & 團隊)

  // 定義對應 ProjectSvc 的表單結構
  formGroup = this.fb.group({
    id: [0],
    project_name: [null, [Validators.required]],
    contract_amount: [null],
    project_manager_id: [null, [Validators.required]],
    team_members: [[]], // 多選，預設空陣列
    planned_days: [null],
    actual_days: [null],
    margin_percentage: [null],

    // 8 大里程碑日期
    sow_signed_date: [null],
    kickoff_date: [null],
    access_date: [null],
    define_date: [null],
    design_date: [null],
    uat_date: [null],
    go_live_date: [null],
    rollout_date: [null]
  });

  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    if (this.formData && this.formData.id > 0) {
      // 處理所有日期欄位，將 ISO String (T00:00:00) 轉為 yyyy-MM-dd
      const dateFields = [
        'sow_signed_date', 'kickoff_date', 'access_date', 'define_date', 
        'design_date', 'uat_date', 'go_live_date', 'rollout_date'
      ];

      dateFields.forEach(field => {
        if (this.formData[field]) {
          this.formData[field] = this.formData[field].split('T')[0];
        }
      });

      // 如果後端傳來的是 team_user_ids (List<int>)，patchValue 會自動對應多選下拉選單
      this.formGroup.patchValue(this.formData);
    }
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
      const data = this.formGroup.getRawValue();
      
      // 確保金額與天數是數字類型 (避免前端 Input 變成字串)
      data.contract_amount = data.contract_amount ? Number(data.contract_amount) : null;
      data.planned_days = data.planned_days ? Number(data.planned_days) : null;
      data.actual_days = data.actual_days ? Number(data.actual_days) : null;
      data.margin_percentage = data.margin_percentage ? Number(data.margin_percentage) : null;

      this.modal.close(data);
    } else {
      // 標記所有欄位為 touched 以顯示錯誤提示
      this.formGroup.markAllAsTouched();
    }
  }
}