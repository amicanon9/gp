import { ApiService } from '../../../../_services/api.service';
import { Component, Input, OnInit } from "@angular/core";
import { AbstractControl, FormBuilder, ValidatorFn, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { tap } from "rxjs/operators";

@Component({
  templateUrl: './bankbranchinfo-modal.component.html',
})
export class BankbranchinfoModalComponent implements OnInit {
  @Input() formData: any={};
  @Input() categorys!: any[];
  @Input() bankbranchinfo: any[] = [];
  @Input() title: String = "{ERRRO}";
  @Input() infolist:any;
  @Input() etypelist:any;
  @Input() banklist:any;
  @Input() psbanklist:any;
  selectedInfoId: number | null = null;
  filteredBanks: any[] = [];  
  formGroup = this.fb.group({
    id: [-1],
    bank_id: [null, [Validators.required]],
    branch_no: [null,  [Validators.required,Validators.maxLength(50)]],
    branch_name: [null, [Validators.required,Validators.maxLength(50)]],
    description: [null, Validators.maxLength(50)],
    disable: [false, Validators.required]
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
    return this.bankbranchinfo.find(a => a.customer_name.substring(0, 2) == this.formGroup.get(item).value.substring(0, 2))
  }
  submit(){
    let data = this.formGroup.getRawValue();
    this.modal.close(data);
  }

  uniqueId(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null =>
      this.bankbranchinfo.map(t => t.cust_id).includes(control.value) ? {uniqued: control.value} : null;
  }


}
