import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ApiService } from "app/_services/api.service";

@Component({
  templateUrl: './project2check-modal.component.html',
})
export class project2checkModalComponent implements OnInit {
  @Input() formData: any = {};
  @Input() title: String = "{ERROR}";
  @Input() cuslist: any[] = [];

  statusList = ['接洽中', '已結案', '暫無需求','潛在客戶'];

  formGroup = this.fb.group({
    id: [-1],
    year: [new Date().getFullYear()],
    quarter: [null],
    month: [null],
    close_date: [null],
    customer_id: [null, [Validators.required]],
    status: [null],
    description: [null]
  });

  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder,
    private apiSvc: ApiService
  ) { }

  ngOnInit() {
    if (this.formData && this.formData.id > 0) {
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
    if (this.formGroup.invalid) return;
    const data = this.formGroup.getRawValue();

    if (data.id > 0) {
      this.apiSvc.updatedata('project2check', data.id, data).subscribe((res: any) => {
        this.modal.close(true);
      });
    } else {
      this.apiSvc.createdata('project2check', data).subscribe((res: any) => {
        this.modal.close(true);
      });
    }
  }
}
