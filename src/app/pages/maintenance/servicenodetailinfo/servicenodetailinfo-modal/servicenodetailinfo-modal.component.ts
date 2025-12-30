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
  templateUrl: './servicenodetailinfo-modal.component.html',
})
export class ServicenodetailinfoModalComponent implements OnInit {
  @Input() formData: any={};
  @Input() categorys!: any[];
  @Input() servicenodetailinfo: any[] = [];
  @Input() title: String = "{ERRRO}";
  @Input() PSlist:any;
  @Input() Pplist:any;
  @Input() Svlist:any;
  selected:any={};
  selected2:any={};
  formGroup = this.fb.group({
    id: [-1],
    ps_meter_id: [null, Validators.required],
    ps_rate: [null, [decimalValidator(4)]],         // 購電費率
    ps_pp_percent: [null, [decimalValidator(4)]],   // 轉供比例
    ps_total_kwp: [null, [decimalValidator(4)]],    // 購電裝置容量(瓩)
    pp_meter_id: [null, Validators.required],
     type: [null, Validators.maxLength(50)],
    service_no_id: [null, Validators.required],
  });

  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
     this.formGroup.patchValue(this.formData);
     if(this.formData){
      this.selected={
        ps_name:this.formData.ps_name,
        power_no:this.formData.ps_power_no
      }
      this.selected2={
        pp_name:this.formData.pp_name,
        power_no:this.formData.pp_power_no
      }
     }
  }
  onchange(item:any){
    this.selected=item;
  }
  onchange2(item:any){
    this.selected2=item;
  }
  isError(item: string) {
    return this.formGroup.get(item)?.invalid &&
      (this.formGroup.get(item)?.dirty || this.formGroup.get(item)?.touched)
  }
  errorType(item: string, type: string) {
    return this.isError(item) && this.formGroup.get(item)?.hasError(type);
  }
  isExists(item: string){
    return this.servicenodetailinfo.find(a => a.customer_name.substring(0, 2) == this.formGroup.get(item).value.substring(0, 2))
  }
  submit(){
    let data = this.formGroup.getRawValue();
    this.modal.close(data);
  }

  uniqueId(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null =>
      this.servicenodetailinfo.map(t => t.cust_id).includes(control.value) ? {uniqued: control.value} : null;
  }


}
