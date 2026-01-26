import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { SetOfBooks } from "app/_models/setofbooks";
import { ApiService } from "app/_services/api.service";
import { AuthService } from "app/_services/auth.service";



@Component({
  templateUrl: './logininfo-modal.component.html'
})
export class LoginInfoModalComponent implements OnInit {
  @Input() formData!: any;
  @Input() roles!: SetOfBooks[];
  @Input() title: String = '{"ERROR}';
  @Input() booklist:any;
  @Input() deplist:any;
  formGroup = this.fb.group({
    id: [null],
    username: ["", Validators.required],
    password: [null, [Validators.maxLength(30)]],
    book_id:[null, Validators.required],
    description: [""],
    disabled: [false, Validators.required],
    company_name:[null],
    roles:[null],
    dept_id: [null],
    joined_date: [null]
  });

  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder,
    private authSvc: AuthService
  ) { }

  ngOnInit() {
    
    if (this.title.includes('編輯')) {
      if(this.formData.joined_date) {
        this.formData.joined_date = this.formData.joined_date.split('T')[0];
      }
      this.formGroup.patchValue(this.formData);
    }
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
  show_pass() {
    let pass = document.getElementById("password") as HTMLInputElement;
    pass.type = "text";
  }
  hidden_pass() {
    let pass = document.getElementById("password") as HTMLInputElement;
    pass.type = "password";
  }
}
