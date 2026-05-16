import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ApiService } from "app/_services/api.service";

@Component({
  templateUrl: './customer2check-modal.component.html',
})
export class customer2checkModalComponent implements OnInit {
  @Input() formData: any = {};
  @Input() title: String = "{ERROR}";

  formGroup = this.fb.group({
    id: [-1],
    name: [null, [Validators.required]],
    tax_id_no: [null],
    contact: [null],
    telephone: [null],
    email: [null, [Validators.email]],
    contact2: [null],
    telephone2: [null],
    email2: [null, [Validators.email]],
    contact3: [null],
    telephone3: [null],
    email3: [null, [Validators.email]],
    contact4: [null],
    telephone4: [null],
    email4: [null, [Validators.email]],
    contact5: [null],
    telephone5: [null],
    email5: [null, [Validators.email]],
    decision_level: [null],
    description: [null]
  });

  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder,
    private apiSvc: ApiService
  ) { }

  ngOnInit() {
    if (this.formData && this.formData.id > 0) {
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
      this.apiSvc.updatedata('customer2check', data.id, data).subscribe((res: any) => {
        this.modal.close(true);
      });
    } else {
      this.apiSvc.createdata('customer2check', data).subscribe((res: any) => {
        this.modal.close(true);
      });
    }
  }
}
