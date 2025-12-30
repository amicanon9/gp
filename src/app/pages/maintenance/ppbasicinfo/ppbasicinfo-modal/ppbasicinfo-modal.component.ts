import { ApiService } from '../../../../_services/api.service';
import { Component, Input, OnInit } from "@angular/core";
import { AbstractControl, FormBuilder, ValidatorFn, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { tap } from "rxjs/operators";

@Component({
  templateUrl: './ppbasicinfo-modal.component.html',
})
export class PpbasicinfoModalComponent implements OnInit {
  @Input() formData: any={};
  @Input() categorys!: any[];
  @Input() ppbasicinfo: any[] = [];
  @Input() title: String = "{ERRRO}";
  @Input() booklist:any;
  @Input() ctypelist:any;
  formGroup = this.fb.group({
    id:[-1],
    book_id:[null, Validators.required],
    pp_no: [null, [Validators.required, Validators.maxLength(3)]],
    pp_name: ['', Validators.compose([Validators.required, Validators.maxLength(200)])],
    tax_id_no: [null, Validators.required],
    contact: [null,  [Validators.required, Validators.maxLength(100)]],
    telephone: [null,  [Validators.required, Validators.maxLength(50)]],
    description: [null, Validators.maxLength(200)],
    ctype:[null]
  });


  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
     this.formGroup.patchValue(this.formData);
    // this.formGroup.get("cust_id").setValidators([Validators.required, this.uniqueId()]);
  }

  isError(item: string) {
    return this.formGroup.get(item)?.invalid &&
      (this.formGroup.get(item)?.dirty || this.formGroup.get(item)?.touched)
  }
  errorType(item: string, type: string) {
    return this.isError(item) && this.formGroup.get(item)?.hasError(type);
  }
  isExists(item: string){
    return this.ppbasicinfo.find(a => a.customer_name.substring(0, 2) == this.formGroup.get(item).value.substring(0, 2))
  }
  submit(){
    let data = this.formGroup.getRawValue();
    this.modal.close(data);
  }

  uniqueId(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null =>
      this.ppbasicinfo.map(t => t.cust_id).includes(control.value) ? {uniqued: control.value} : null;
  }


}
