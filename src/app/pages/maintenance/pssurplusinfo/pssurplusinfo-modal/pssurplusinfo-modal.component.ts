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
  templateUrl: './pssurplusinfo-modal.component.html',
})
export class PssurplusinfoModalComponent implements OnInit {
  @Input() formData: any={};
  @Input() categorys!: any[];
  @Input() pssurplusinfo: any[] = [];
  @Input() title: String = "{ERRRO}";
  @Input() infolist:any;
  @Input() etypelist:any;
  @Input() banklist:any;
  @Input() branchlist:any;
  selectedInfoId: number | null = null;
  filteredBanks: any[] = [];  
  formGroup = this.fb.group({
    id: [-1],
    ps_id: [null, Validators.required],
    ps_site_name:[null,Validators.maxLength(30)],
    surplus_rate:[null,decimalValidator(4)],
    description:[null,Validators.maxLength(50)],
    total_kwp:[null,decimalValidator(3)],
  });

  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
  // 先設好資料
  this.formGroup.patchValue(this.formData);
}

  isError(item: string) {
    return this.formGroup.get(item)?.invalid &&
      (this.formGroup.get(item)?.dirty || this.formGroup.get(item)?.touched)
  }
  errorType(item: string, type: string) {
    return this.isError(item) && this.formGroup.get(item)?.hasError(type);
  }
  isExists(item: string){
    return this.pssurplusinfo.find(a => a.customer_name.substring(0, 2) == this.formGroup.get(item).value.substring(0, 2))
  }
  submit(){
    let data = this.formGroup.getRawValue();
    this.modal.close(data);
  }

  uniqueId(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null =>
      this.pssurplusinfo.map(t => t.cust_id).includes(control.value) ? {uniqued: control.value} : null;
  }


}
