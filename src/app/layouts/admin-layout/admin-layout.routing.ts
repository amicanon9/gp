
import { LoginInfoComponent } from './../../pages/manage/logininfo/logininfo.component';
import { Routes } from '@angular/router';

import { LoginComponent } from 'app/login/login/login.component';
import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { IconsComponent } from '../../pages/icons/icons.component';

import { SetOfBooksComponent } from 'app/pages/manage/setofbooks/setofbooks.component';
import { AuthGuard } from 'app/auth.guard';
import { LoginRolesComponent } from 'app/pages/manage/loginroles/loginroles.component';
import { PspowernoinfoComponent } from 'app/pages/maintenance/pspowernoinfo/pspowernoinfo.component';

import { MenuGuard } from 'app/menu.guard';

import { FeemaskComponent } from 'app/pages/tools/feemask/feemask.component';
import { projectplmComponent } from 'app/pages/maintenance/projectplm/projectplm.component';
import { customerplmComponent } from 'app/pages/maintenance/customerplm/customerplm.component';
import { checkinComponent } from 'app/pages/tools/checkin/checkin.component';
import { leaveapplicationsComponent } from 'app/pages/tools/leaveapplications/leaveapplications.component';
import { leavemanagementComponent } from 'app/pages/tools/leavemanagement/leavemanagement.component';
import { departmentsComponent } from 'app/pages/manage/departments/departments.component';
import { projectinternalComponent } from 'app/pages/maintenance/projectinternal/projectinternal.component';

export const AdminLayoutRoutes: Routes = [
  { path: 'login',          component: LoginComponent },
  { path: 'dashboard',      component: DashboardComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'icons',          component: IconsComponent},
  { path: 'project/projectplm',      component: projectplmComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'project/projectinternal',      component: projectinternalComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'customer/customerplm',      component: customerplmComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'tools/checkin',          component: checkinComponent, canActivate: [AuthGuard, MenuGuard]},
  { path: 'tools/leaveapplications',          component: leaveapplicationsComponent, canActivate: [AuthGuard, MenuGuard]},
  { path: 'tools/leavemanagement',          component: leavemanagementComponent, canActivate: [AuthGuard, MenuGuard]},
  { path: 'ps/pspowernoinfo',      component: PspowernoinfoComponent, canActivate: [AuthGuard, MenuGuard] },
  
  { path: 'manage/setofbooks',     component: SetOfBooksComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'manage/logininfo', component: LoginInfoComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'manage/loginroles', component: LoginRolesComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'manage/departments', component: departmentsComponent, canActivate: [AuthGuard, MenuGuard] },
  
  ];
