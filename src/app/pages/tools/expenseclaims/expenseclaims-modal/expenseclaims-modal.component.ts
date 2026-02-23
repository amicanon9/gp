import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ImageDialogComponent } from "app/_components/image-dialog/image-dialog.component";
import { ApiService } from "app/_services/api.service";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: 'app-expenseclaims-modal',
  templateUrl: './expenseclaims-modal.component.html'
})
export class expenseclaimsModalComponent implements OnInit {
  @Input() formData: any = {};
  @Input() title: string = "{ERROR}";
  @Input() projectList: { plm: any[], internal: any[], svc: any[] };
  @Input() historyData: any[] = [];
  @ViewChild('imgComponent') imgComponent: ImageDialogComponent;
  formGroup = this.fb.group({
    id: [-1],
    project_type: ['PLM', [Validators.required]],
    project_id: [null, [Validators.required]],
    category_main: ['一般費'],
    category_item: ['交通費', [Validators.required]],
    expense_date: [new Date().toISOString().split('T')[0], [Validators.required]],
    item_name: [null, [Validators.required]],
    description: [null],
    // 交通費專屬
    location_from_to: [null],
    mileage: [0],
    subsidy_unit_price: [7],
    toll_fee: [0],
    parking_fee: [0],
    // 金額
    manual_amount: [0],
    total_amount: [0]
  });

  categoryItems = ['交通費', '雜費'];
  projectOptions: any[] = [];
  typelist: any = [
    {
      type: 'PLM',
      label: 'PLM'
    },
    {
      type: 'Internal',
      label: '內部'
    },
    {
      type: 'Svc',
      label: '服務'
    }
  ]
  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder,
    private apiSvc: ApiService,
  ) { }

  ngOnInit() {
    // 監聽專案類型變化，切換下拉選單內容
    this.formGroup.get('project_id').valueChanges.subscribe(projectId => {
      if (projectId && this.formGroup.get('id').value === -1) { // 僅在「新增模式」下觸發
        this.applyLastClaimData(projectId);
      }
    });

    this.formGroup.get('project_type').valueChanges.subscribe(val => {
      this.updateProjectOptions(val);
      this.formGroup.get('project_id').setValue(null);
    });

    // 監聽交通費相關數值變化，自動計算總額
    this.formGroup.valueChanges.subscribe(() => {
      this.calculateTotal();
    });

    // 初始化資料
    if (this.formData && this.formData.id > 0) {
      if (this.formData.expense_date) {
        this.formData.expense_date = this.formData.expense_date.split('T')[0];
      }
      this.updateProjectOptions(this.formData.project_type);
      this.formGroup.patchValue(this.formData);
    } else {
      this.updateProjectOptions('PLM');
    }
  }
  applyLastClaimData(projectId: number) {
    // 1. 如果 projectId 為空 (選單被清空)
    if (!projectId) {
      this.resetFormToDefault();
      return;
    }

    // 2. 尋找該專案最近的一筆紀錄
    const lastClaim = this.historyData.find(c => c.project_id === projectId);

    if (lastClaim) {
      // 3. 找到紀錄：根據類別帶入完整資料
      if (lastClaim.category_item === '交通費') {
        this.formGroup.patchValue({
          category_item: '交通費',
          item_name: lastClaim.item_name,
          location_from_to: lastClaim.location_from_to,
          mileage: lastClaim.mileage,
          subsidy_unit_price: lastClaim.subsidy_unit_price,
          toll_fee: lastClaim.toll_fee || 0,     // 帶入過路費
          parking_fee: lastClaim.parking_fee || 0 // 帶入停車費
        }, { emitEvent: true });
      } else {
        this.formGroup.patchValue({
          category_item: lastClaim.category_item,
          item_name: lastClaim.item_name,
          manual_amount: lastClaim.manual_amount,
          // 非交通費時，清空交通相關欄位
          location_from_to: null,
          mileage: 0,
          toll_fee: 0,
          parking_fee: 0
        }, { emitEvent: true });
      }
    } else {
      // 4. 選到了專案，但該專案完全沒有歷史紀錄：清空表單至預設值
      this.resetFormToDefault();
    }
  }

  // 抽取出來的清空方法
  resetFormToDefault() {
    this.formGroup.patchValue({
      // 保留 project_type 和 project_id，其餘清空
      category_item: '交通費',
      item_name: null,
      location_from_to: null,
      mileage: 0,
      subsidy_unit_price: 7,
      toll_fee: 0,
      parking_fee: 0,
      manual_amount: 0,
      description: null
    }, { emitEvent: true });
  }
  updateProjectOptions(type: string) {
    if (type === 'PLM') {
      this.projectOptions = this.projectList.plm.map(p => ({
        id: p.id,
        // 格式範例：(PLM 101) 某某客戶名稱
        name: `(PLM ${p.id}) ${p.customer_name}`
      }));
    } else if (type == 'Internal') {
      this.projectOptions = this.projectList.internal.map(p => ({
        id: p.id,
        // 格式範例：(內部 5) 某某內部專案
        name: `(內部 ${p.id}) ${p.name}`
      }));
    } else {
      this.projectOptions = this.projectList.svc.map(p => ({
        id: p.id,
        // 格式範例：(內部 5) 某某內部專案
        name: `(服務 ${p.id}) ${p.project_name}`
      }));
    }
  }

  calculateTotal() {
    const val = this.formGroup.getRawValue();
    let total = 0;
    if (val.category_item === '交通費') {
      total = (val.mileage * val.subsidy_unit_price) + (val.toll_fee || 0) + (val.parking_fee || 0);
    } else {
      total = val.manual_amount || 0;
    }
    // 使用 emitEvent: false 避免無限迴圈
    this.formGroup.get('total_amount').setValue(total, { emitEvent: false });
  }

  // 檢查欄位是否非法且被碰過
  isError(item: string) {
    const control = this.formGroup.get(item);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  // 取得特定錯誤類型
  errorType(item: string, type: string) {
    return this.isError(item) && this.formGroup.get(item)?.hasError(type);
  }

  // 子元件 expenseclaims-modal.component.ts
  submit() {
    if (this.formGroup.invalid) return;
    const data = this.formGroup.value;

    if (data.id > 0) {
      // 【編輯模式】
      this.apiSvc.updatedata('expenseclaims', data.id, data).subscribe(async (res: any) => {
        // 就算資料沒變，也要檢查有沒有新選的圖片要傳
        await this.imgComponent.manualUpload(data.id);
        this.modal.close(true); // 關閉彈窗並傳回 true
      });
    } else {
      // 【新增模式】
      this.apiSvc.createdata('expenseclaims', data).subscribe(async (res: any) => {
        console.log(res)
        const newId = Array.isArray(res) ? res[0].id : res.id;
        if (newId) {
          await this.imgComponent.manualUpload(newId);
          this.modal.close(true);
        }
      });
    }
  }
}