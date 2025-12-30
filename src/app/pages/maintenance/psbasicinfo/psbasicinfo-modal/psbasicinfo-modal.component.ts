import { ApiService } from '../../../../_services/api.service';
import { Component, Input, OnInit } from "@angular/core";
import { AbstractControl, FormBuilder, ValidatorFn, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { tap } from "rxjs/operators";

@Component({
  templateUrl: './psbasicinfo-modal.component.html',
})
export class PsbasicinfoModalComponent implements OnInit {
  @Input() formData: any={};
  @Input() categorys!: any[];
  @Input() psbasicinfo: any[] = [];
  @Input() title: String = "{ERRRO}";
  @Input() booklist:any;
  formGroup = this.fb.group({
    id:[-1],
    book_id:[null, Validators.required],
    ps_no: [null, [Validators.required, Validators.maxLength(3)]],
    ps_name: ['', Validators.compose([Validators.required, Validators.maxLength(200)])],
    tax_id_no: [null, [Validators.required, Validators.maxLength(8)]],
    contact: [null, Validators.compose([Validators.required, Validators.maxLength(100)])],
    telephone: [null, Validators.compose([Validators.required, Validators.maxLength(50)])],
    description: [null, Validators.maxLength(200)],
    email:[null, Validators.compose([Validators.required, Validators.maxLength(100)])],
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
    return this.psbasicinfo.find(a => a.customer_name.substring(0, 2) == this.formGroup.get(item).value.substring(0, 2))
  }
  submit(){
    let data = this.formGroup.getRawValue();
    this.modal.close(data);
  }

  uniqueId(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null =>
      this.psbasicinfo.map(t => t.cust_id).includes(control.value) ? {uniqued: control.value} : null;
  }


}
