import { refresh } from './../refresh/refresh.component';
import { Menus } from './../../_models/loginmenus';
import { LoginMenus } from 'app/_models/loginmenus';
import { RolesService } from '../../_services/roles.service';
import { ChangePasswordModalComponent } from './../changepassword-modal/changepassword-modal.component';
import { AuthService } from './../../_services/auth.service';
import { Component, OnInit, Renderer2, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Location} from '@angular/common';
import { ApiService } from 'app/_services/api.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { merge, Observable, Subscription, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { timer, fromEvent } from 'rxjs';
@Component({
    moduleId: module.id,
    selector: 'navbar-cmp',
    templateUrl: 'navbar.component.html'
})

export class NavbarComponent implements OnInit{
    private listTitles: any[];
    location: Location;
    roles:LoginMenus[];
    role;
    config;
    exp;
    idle;
    private nativeElement: Node;
    private toggleButton;
    private sidebarVisible: boolean;
    private idle$: Subscription;
    private timer$;
    public isCollapsed = true;
    @ViewChild("navbar-cmp", {static: false}) button;

    constructor(location:Location,
      public  rolesSvc:RolesService,
      private renderer : Renderer2,
      private element : ElementRef,
      private router: Router,
      private zone: NgZone,
      private apiSvc: ApiService,
      private modalSvc: NgbModal,
      private toastr: ToastrService,
      public authSvc:AuthService) {
        this.location = location;
        this.nativeElement = element.nativeElement;
        this.sidebarVisible = false;
        this.role = this.authSvc.state.role_id;
      this.startTimer();
      this.idle$ = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'click'),
        fromEvent(document, 'mousedown'),
        fromEvent(document, 'keypress'),
        fromEvent(document, 'DOMMouseScroll'),
        fromEvent(document, 'mousewheel'),
        fromEvent(document, 'touchmove'),
        fromEvent(document, 'MSPointerMove'),
        fromEvent(window, 'mousemove'),
        fromEvent(window, 'resize'),
      ).subscribe(e => {
        this.timer$.unsubscribe();
        this.startTimer();
      });

    }
    startTimer(){
      this.timer$ = timer(1000, 1000).subscribe(x=>{this.idle=x;});
      //const subscribe = source.subscribe(val => console.log(val));
    }
    ngOnInit(){
      this.config = { stopTime: this.authSvc.state.exp * 1000 };
      this.rolesSvc.getRoles();
      this.rolesSvc.roles$.subscribe(x => {
        if (x && x.length) {
          this.roles = x;
          this.rolesSvc.getMenus()
        }
      })
      this.rolesSvc.menus$.subscribe(x=>{
        this.listTitles=x
      })
        var navbar : HTMLElement = this.element.nativeElement;
        this.toggleButton = navbar.getElementsByClassName('navbar-toggle')[0];
        this.router.events.subscribe((event) => {
          this.sidebarClose();
       });
    }
  ngOnDestroy() {
    this.idle$.unsubscribe();
    this.timer$.unsubscribe();
  }
    timer($event){
      if($event.action=='done'){
        if(this.idle>=600){
          const modalRef = this.modalSvc.open(refresh, { windowClass: "modal-mySize", backdrop: 'static' });
          modalRef.result.then((res) => {
            this.apiSvc.refreshToken(this.authSvc.state.sub, localStorage.getItem('access_token')).subscribe(res => {
              if (res && res.token) {
                localStorage.setItem('access_token', res.token);
                this.authSvc.trySetSignInState(res.token);
                this.config = { stopTime: this.authSvc.state.exp * 1000 };
              }
            })

          })
        }else{
          this.apiSvc.refreshToken(this.authSvc.state.sub, localStorage.getItem('access_token')).subscribe(res => {
            if (res && res.token) {
              localStorage.setItem('access_token', res.token);
              this.authSvc.trySetSignInState(res.token);
              this.config = { stopTime: this.authSvc.state.exp * 1000 };
            }
          })
        }
      }
    }
    changerole($event){
      this.rolesSvc.switchrole($event)
    }
    logout() {
      this.timer$.unsubscribe();
      this.authSvc.signOut();
    }
    changepassword(){
      const modalRef = this.modalSvc.open(ChangePasswordModalComponent, { windowClass: "modal-mySize",backdrop:'static' });
      modalRef.componentInstance.title = "變更密碼";
      modalRef.result.then((res: { new_password: string, old_password: string }) => {
        let data: {new_password: string, old_password: string} = res;
        this.apiSvc.changePassword(data.new_password,data.old_password).pipe(
          catchError(err => {
            this.toastr.error(
              '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
              '變更失敗'
              + '</span>',
              "",
              {
                timeOut: 3000,
                closeButton: true,
                enableHtml: true,
                toastClass: "alert alert-error alert-with-icon",
                positionClass: "toast-top-center"
              }
            );
            return throwError(err);
          })
        )
          .subscribe(e => {
            this.toastr.success(
              '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
              '變更成功'
              + '</span>',
              "",
              {
                timeOut: 3000,
                closeButton: true,
                enableHtml: true,
                toastClass: "alert alert-success alert-with-icon",
                positionClass: "toast-top-center"
              }
            );
          });
      }).catch(() => { });
    }
    getTitle() {
      let titlee = this.location.prepareExternalUrl(this.location.path());

      if (titlee.charAt(0) === '#') {
        titlee = titlee.slice(1);
      }

      // ✅ 移除 query string，只取 ? 前面的部分
      titlee = titlee.split('?')[0];

      for (let i = 0; i < this.listTitles.length; i++) {
        for (let item = 0; item < this.listTitles[i].children.length; item++) {
          if (this.listTitles[i].children[item].url === titlee) {
            return this.listTitles[i].children[item].name;
          }
        }
      }

      return '';
    }
    sidebarToggle() {
        if (this.sidebarVisible === false) {
            this.sidebarOpen();
        } else {
            this.sidebarClose();
        }
      }
      sidebarOpen() {
          const toggleButton = this.toggleButton;
          const html = document.getElementsByTagName('html')[0];
          const mainPanel =  <HTMLElement>document.getElementsByClassName('main-panel')[0];
          setTimeout(function(){
              toggleButton.classList.add('toggled');
          }, 500);

          html.classList.add('nav-open');
          if (window.innerWidth < 991) {
            mainPanel.style.position = 'fixed';
          }
          this.sidebarVisible = true;
      };
      sidebarClose() {
          const html = document.getElementsByTagName('html')[0];
          const mainPanel =  <HTMLElement>document.getElementsByClassName('main-panel')[0];
          if (window.innerWidth < 991) {
            setTimeout(function(){
              mainPanel.style.position = '';
            }, 500);
          }
          this.toggleButton.classList.remove('toggled');
          this.sidebarVisible = false;
          html.classList.remove('nav-open');
      };
      collapse(){
        this.isCollapsed = !this.isCollapsed;
        const navbar = document.getElementsByTagName('nav')[0];
        console.log(navbar);
        if (!this.isCollapsed) {
          navbar.classList.remove('navbar-transparent');
          navbar.classList.add('bg-white');
        }else{
          navbar.classList.add('navbar-transparent');
          navbar.classList.remove('bg-white');
        }

      }

}
