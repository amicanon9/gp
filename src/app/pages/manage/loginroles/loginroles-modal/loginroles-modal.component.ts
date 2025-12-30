import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { LoginRoles } from "app/_models/loginroles";
import { SetOfBooks } from "app/_models/setofbooks";
import { ApiService } from "app/_services/api.service";
import { AuthService } from "app/_services/auth.service";
import { RolesService } from "app/_services/roles.service";



@Component({
  templateUrl: './loginroles-modal.component.html'
})
export class LoginRolesModalComponent implements OnInit {
  @Input() formData!: LoginRoles;
  @Input() menulist!: any[];
  @Input() title: String = '{"ERROR}';
  @Input() booklist:any;
  roles:any;
  formGroup = this.fb.group({
    id: [null],
    role_name: ["", Validators.required],
    book_id: [null],
    description: [""],
    disabled: [false, Validators.required],
    company_name: [null],
    menus:[null],
    is_admin:false,
    permission_level: [1, Validators.required]
  });
  permissionMap = [
  { value: 1, label: '查看' },
  { value: 2, label: '新增' },
  { value: 3, label: '新增與編輯' },
  { value: 4, label: '完整功能' },
];
  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder,
    private authSvc: AuthService,
    private roleSvc: RolesService
  ) { 
    this.roleSvc.roles$.subscribe(e=>this.roles=e)
  }

  ngOnInit() {
    if (this.title.includes('編輯')) {
      this.formGroup.setValue(this.formData);
      
    }
    const disabled = this.admincheck();

      // 更新 is_admin 的 disabled 狀態
      if (disabled) {
        this.formGroup.controls['is_admin'].disable();
      } else {
        this.formGroup.controls['is_admin'].enable();
      }
  }
  admincheck(){
    var check =this.roles.find(e=>e.id == this.authSvc.state.role_id)?.is_admin
    return !check
  }
  isError(item: string) {
    return this.formGroup.get(item)?.invalid &&
      (this.formGroup.get(item)?.dirty || this.formGroup.get(item)?.touched)
  }
  errorType(item: string, type: string) {
    return this.isError(item) && this.formGroup.get(item)?.hasError(type);
  }
  submit() {
    let data = this.formGroup.getRawValue();
    data.id = JSON.parse(this.formGroup.get("id")?.value);
    this.modal.close(data);
  }
}
