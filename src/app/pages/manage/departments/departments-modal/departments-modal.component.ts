import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, Validators, FormGroup } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-departments-modal',
  templateUrl: './departments-modal.component.html'
})
export class departmentsModalComponent implements OnInit {
  @Input() formData!: any;     // 編輯時傳入的舊資料
  @Input() userlist: any; // 從 parent 傳入的 login_info 清單
  @Input() title: string = '部門資訊';
  @Input() booklist:any;
  formGroup: FormGroup;

  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder
  ) {
    // 初始化 Form 控制項，對應資料庫 [departments] 欄位
    this.formGroup = this.fb.group({
      id: [null],
      dept_name: ["", [Validators.required, Validators.maxLength(50)]],
      manager_id: [null], // 部門主管 ID (int)
      description: ["", [Validators.maxLength(100)]],
      book_id:[null, Validators.required],
    });
  }

  ngOnInit() {
    // 如果是編輯模式，將資料填入表單
    if (this.title.includes('編輯') && this.formData) {
      this.formGroup.patchValue(this.formData);
    }
  }

  // 檢查欄位是否非法且被碰過
  isError(item: string) {
    const control = this.formGroup.get(item);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  // 取得特定錯誤類型
  errorType(item: string, type: string) {
    return this.isError(item) && this.formGroup.get(item)?.hasError(type);
  }

  submit() {
    if (this.formGroup.valid) {
      const data = this.formGroup.getRawValue();
      
      // 確保 ID 是數值類型
      if (data.id) {
        data.id = Number(data.id);
      }
      
      this.modal.close(data);
    }
  }
}