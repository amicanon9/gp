import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from 'app/_services/auth.service';

@Directive({
  selector: '[hasPermission]'
})
export class HasPermissionDirective {
  private requiredLevel: number = 0;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authSvc: AuthService
  ) {}

  @Input()
  set hasPermission(level: number) {
    this.requiredLevel = level;

    const currentLevel = this.authSvc.state?.permission_level ?? 0;

    if (currentLevel >= this.requiredLevel) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
