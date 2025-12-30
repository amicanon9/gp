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
  templateUrl: './pssurplusdata-modal.component.html',
})
export class PssurplusdataModalComponent implements OnInit {
  @Input() formData: any={};
  @Input() categorys!: any[];
  @Input() pssurplusdata: any[] = [];
  @Input() title: String = "{ERRRO}";
  @Input() infolist:any;
  @Input() etypelist:any;
  @Input() banklist:any;
  @Input() branchlist:any;
  selectedInfoId: number | null = null;
  filteredBanks: any[] = [];  
formGroup = this.fb.group({
  id: [-1],
  bill_year: [null, [Validators.required, Validators.min(1900), Validators.max(2100)]],
  bill_month: [null, [Validators.required, Validators.min(1), Validators.max(12)]],
  surplus_kwh: [null],  // 可為 null，整數，不需要驗證器
  surplus_amount: [null, [Validators.required, Validators.min(0)]],
  surplus_id: [null, Validators.required],
  description: [null, Validators.maxLength(50)]
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
    return this.pssurplusdata.find(a => a.customer_name.substring(0, 2) == this.formGroup.get(item).value.substring(0, 2))
  }
  submit(){
    let data = this.formGroup.getRawValue();
    this.modal.close(data);
  }

  uniqueId(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null =>
      this.pssurplusdata.map(t => t.cust_id).includes(control.value) ? {uniqued: control.value} : null;
  }


}
