import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-projectfirm-modal',
  templateUrl: './projectfirm-modal.component.html',
})
export class projectfirmModalComponent implements OnInit {
  @Input() formData: any = {};
  @Input() title: string = "{ERROR}";
    @Input() booklist:any;
  // 只保留 Internal Project 需要的欄位
  formGroup = this.fb.group({
    id: [0],
    name: [null, [Validators.required]],
    description: [null],
     book_id:[null, Validators.required],
  });

  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    // 如果有傳入資料（編輯模式）
    if (this.formData && this.formData.id > 0) {
      this.formGroup.patchValue({
        id: this.formData.id,
        name: this.formData.name,
        description: this.formData.description
      });
    }
  }

  // 驗證輔助函式
  isError(item: string) {
    return this.formGroup.get(item)?.invalid &&
      (this.formGroup.get(item)?.dirty || this.formGroup.get(item)?.touched);
  }

  errorType(item: string, type: string) {
    return this.isError(item) && this.formGroup.get(item)?.hasError(type);
  }

  submit() {
    if (this.formGroup.valid) {
      // 取得表單內容並回傳給 Parent Component
      const data = this.formGroup.getRawValue();
      this.modal.close(data);
    }
  }
}