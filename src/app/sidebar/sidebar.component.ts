import { Menus } from './../_models/loginmenus';
import { RolesService } from '../_services/roles.service';
import { Component, OnInit } from '@angular/core';


export interface RouteInfo {
    path: string;
    title: string;
    icon: string;
    class: string;
}
export interface RouteInfos {
  title: string;
  icon: string;
  panelOpenState:boolean;
  children: RouteInfo[];
}

  // { path: '/dashboard',     title: 'Dashboard',         icon:'nc-bank',       class: '' },
  // { path: '/icons',         title: 'Icons',             icon:'nc-diamond',    class: '' },
  // { path: '/notifications', title: 'Notifications',     icon:'nc-bell-55',    class: '' },
  // { path: '/table',         title: 'Table List',        icon:'nc-tile-56',    class: '' },
  // { path: '/typography',    title: 'Typography',        icon:'nc-caps-small', class: '' },




@Component({
    moduleId: module.id,
    selector: 'sidebar-cmp',
    styleUrls: ['sidebar.component.scss'],
    templateUrl: 'sidebar.component.html',
})

export class SidebarComponent implements OnInit {
    panelOpenState = true;
    constructor(
      public rolesSvc:RolesService
    ){

    }
    ngOnInit() {


    }
}
