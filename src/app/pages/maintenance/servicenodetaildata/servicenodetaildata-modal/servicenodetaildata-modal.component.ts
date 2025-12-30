import { ApiService } from '../../../../_services/api.service';
import { Component, Input, OnInit } from "@angular/core";
import { AbstractControl, FormBuilder, ValidatorFn, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { tap } from "rxjs/operators";

function decimalValidator(decimalPlaces: number, max?: number, min?: number): ValidatorFn {
  const regex = new RegExp(`^\\d+(\\.\\d{0,${decimalPlaces}})?$`);
  return (control: AbstractControl) => {
    const value = control.value;
    if (value === null || value === '') return null;

    if (isNaN(value)) return { decimal: true };
    if (!regex.test(value)) return { decimal: true };
    if (max !== undefined && value > max) return { max: true };
    if (min !== undefined && value < min) return { min: true };
    return null;
  };
}


@Component({
  templateUrl: './servicenodetaildata-modal.component.html',
})

export class ServicenodetaildataModalComponent implements OnInit {
  @Input() formData: any={};
  @Input() categorys!: any[];
  @Input() servicenodetaildata: any[] = [];
  @Input() title: String = "{ERRRO}";
  @Input() Svlist:any;
  selected:any={

  };
  formGroup = this.fb.group({
    id: [-1],
    service_no_detail_id: [null, Validators.required],
    bill_year: [null, Validators.required],
    bill_month: [null, [Validators.required, Validators.min(1), Validators.max(12)]],
    kwh_usage: [null, Validators.required],
    transmission_rate: [null, [Validators.required, decimalValidator(4)]],
    distribution_rate: [null, [Validators.required, decimalValidator(4)]],
    dispatching_rate: [null, [Validators.required, decimalValidator(4)]],
    ancillary_services_rate: [null, [Validators.required, decimalValidator(4)]],
    fee: [null, Validators.required],
    description: ['', Validators.maxLength(50)],
  });

  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
     this.formGroup.patchValue(this.formData);
     this.selected=this.formData
    // this.formGroup.get("cust_id").setValidators([Validators.required, this.uniqueId()]);
  }
  onchange(item:any){
    this.selected=item;
  }
  isError(item: string) {
    return this.formGroup.get(item)?.invalid &&
      (this.formGroup.get(item)?.dirty || this.formGroup.get(item)?.touched)
  }
  errorType(item: string, type: string) {
    return this.isError(item) && this.formGroup.get(item)?.hasError(type);
  }
  isExists(item: string){
    return this.servicenodetaildata.find(a => a.customer_name.substring(0, 2) == this.formGroup.get(item).value.substring(0, 2))
  }
  submit(){
    let data = this.formGroup.getRawValue();
    this.modal.close(data);
  }

  uniqueId(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null =>
      this.servicenodetaildata.map(t => t.cust_id).includes(control.value) ? {uniqued: control.value} : null;
  }


}
