import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { SetOfBooks } from "app/_models/setofbooks";
import { ApiService } from "app/_services/api.service";






@Component({
  templateUrl: './setofbooks-modal.component.html'
})
export class SetOfBooksModalComponent implements OnInit {
  @Input() formData!: SetOfBooks;
  @Input() title: String = '{"ERROR}';

  formGroup = this.fb.group({
    book_id: [null, Validators.compose([Validators.required, Validators.pattern("^([1-9][0-9]*|0)$")])],
    name: ["", Validators.required],
    description: [null]
  });

  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder,
    private api: ApiService
  ) { }

  ngOnInit() {
    if (this.title.includes('編輯')) {
      this.formGroup.setValue(this.formData);
    }
  }

  isError(item: string) {
    return this.formGroup.get(item)?.invalid &&
      (this.formGroup.get(item)?.dirty || this.formGroup.get(item)?.touched)
  }
  errorType(item: string, type: string) {
    return this.isError(item) && this.formGroup.get(item)?.hasError(type);
  }
  submit(){
    let data = this.formGroup.getRawValue();
    data.book_id = JSON.parse(this.formGroup.get("book_id")?.value);
    this.modal.close(data);
  }
}
