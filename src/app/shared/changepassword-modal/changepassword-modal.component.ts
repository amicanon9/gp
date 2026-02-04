import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { SetOfBooks } from "app/_models/setofbooks";
import { ApiService } from "app/_services/api.service";
import { AuthService } from "app/_services/auth.service";



@Component({
  templateUrl: './changepassword-modal.component.html'
})
export class ChangePasswordModalComponent implements OnInit {
  @Input() roles!: SetOfBooks[];
  @Input() title: String = '{"ERROR}';

  formGroup = this.fb.group({
    old_password: [null],
    new_password: [null],
  });

  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder,
  ) { }

  ngOnInit() {

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
    this.modal.close(data);
  }
}
