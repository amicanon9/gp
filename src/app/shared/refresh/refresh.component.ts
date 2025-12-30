import { Component, Input, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { SetOfBooks } from "app/_models/setofbooks";
import { AuthService } from "app/_services/auth.service";

@Component({
  templateUrl: './refresh.component.html'
})
export class refresh implements OnInit, OnDestroy {
  @Input() roles!: SetOfBooks[];
  @Input() title: String = '{"ERROR}';

  countdown = 10;
  private timer: any;

  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder,
    private authSvc: AuthService
  ) { }

  ngOnInit() {
    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  startCountdown() {
    this.timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.timer);
        this.signOut();
      }
    }, 1000);
  }

  signOut() {
    this.authSvc.signOut();
    this.modal.close();
  }

  submit() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.modal.close('refresh');
  }
}
