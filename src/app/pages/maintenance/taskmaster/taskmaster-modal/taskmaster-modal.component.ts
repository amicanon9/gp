import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-taskmaster-modal',
  templateUrl: './taskmaster-modal.component.html',
})
export class taskmasterModalComponent implements OnInit {
  @Input() formData: any = {};
  @Input() title: string = "{ERROR}";
  
  // 定義 taskmaster 的表單結構
  formGroup = this.fb.group({
    id: [-1],
    task_name: [null, [Validators.required]],
    description: [null],
    category: ['程式', [Validators.required]], // 預設值
    priority: ['一般', [Validators.required]], // 預設值
    status: ['待辦', [Validators.required]],   // 預設值
    close_date: [null]
  });

  // 選項清單
  categories = ['程式', '美工', '企劃', '測試'];
  priorities = ['一般', '緊急'];
  statuses = ['待辦', '進行中', '測試', '審核', '完成'];

  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    if (this.formData && this.formData.id > 0) {
      // 處理日期格式 (yyyy-MM-dd)
      if (this.formData.close_date) {
        this.formData.close_date = this.formData.close_date.split('T')[0];
      }
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
      this.modal.close(this.formGroup.getRawValue());
    }
  }
}