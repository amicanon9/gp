import { ApiService } from '../../../../_services/api.service';
import { Component, Input, OnInit } from "@angular/core";
import { AbstractControl, FormBuilder, ValidatorFn, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { tap } from "rxjs/operators";

@Component({
  templateUrl: './pspowernoinfo-modal.component.html',
})
export class PspowernoinfoModalComponent implements OnInit {
  @Input() formData: any={};
  @Input() categorys!: any[];
  @Input() pspowernoinfo: any[] = [];
  @Input() title: String = "{ERRRO}";
  @Input() infolist:any;
  @Input() etypelist:any;
  @Input() banklist:any;
  @Input() psbanklist:any;
  selectedInfoId: number | null = null;
  filteredBanks: any[] = [];  
  formGroup = this.fb.group({
    id: [-1],
    power_no: [null, [Validators.required, Validators.maxLength(20)]],
    ps_bank_id: [null,Validators.required],
    trust_bank_id: [null],
    description: [null, Validators.maxLength(50)],
    info_id: [null, Validators.required],
    etype: [null, Validators.maxLength(10)],
    site_name:[null,Validators.maxLength(500)],
    address:[null,Validators.maxLength(500)]
  });

  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
  // 先設好資料
  this.formGroup.patchValue(this.formData);

  // 用初始 info_id 篩出 bank
  const infoId = this.formGroup.get('info_id')?.value;
  this.selectedInfoId = infoId;
  this.filteredBanks = this.psbanklist.filter(b => b.info_id === infoId);

  // 然後再訂閱
  this.formGroup.get('info_id')?.valueChanges.subscribe(newInfoId => {
    this.selectedInfoId = newInfoId;
    this.filteredBanks = this.psbanklist.filter(b => b.info_id === newInfoId);
    
    // ⚠️ 若是手動選 info_id 時，才要 reset
    this.formGroup.get('ps_bank_id')?.setValue(null);
  });
}

  isError(item: string) {
    return this.formGroup.get(item)?.invalid &&
      (this.formGroup.get(item)?.dirty || this.formGroup.get(item)?.touched)
  }
  errorType(item: string, type: string) {
    return this.isError(item) && this.formGroup.get(item)?.hasError(type);
  }
  isExists(item: string){
    return this.pspowernoinfo.find(a => a.customer_name.substring(0, 2) == this.formGroup.get(item).value.substring(0, 2))
  }
  submit(){
    let data = this.formGroup.getRawValue();
    this.modal.close(data);
  }

  uniqueId(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null =>
      this.pspowernoinfo.map(t => t.cust_id).includes(control.value) ? {uniqued: control.value} : null;
  }


}
