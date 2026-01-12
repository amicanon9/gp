
import { LoginInfoComponent } from './../../pages/manage/logininfo/logininfo.component';
import { Routes } from '@angular/router';

import { LoginComponent } from 'app/login/login/login.component';
import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { IconsComponent } from '../../pages/icons/icons.component';
import { PsbasicInfoComponent } from '../../pages/maintenance/psbasicinfo/psbasicinfo.component';
import { PpbasicInfoComponent } from '../../pages/maintenance/ppbasicinfo/ppbasicinfo.component';
import { SetOfBooksComponent } from 'app/pages/manage/setofbooks/setofbooks.component';
import { AuthGuard } from 'app/auth.guard';
import { LoginRolesComponent } from 'app/pages/manage/loginroles/loginroles.component';
import { PspowernoinfoComponent } from 'app/pages/maintenance/pspowernoinfo/pspowernoinfo.component';
import { PsmeternoinfoComponent } from 'app/pages/maintenance/psmeternoinfo/psmeternoinfo.component';
import { PppowernoinfoComponent } from 'app/pages/maintenance/pppowernoinfo/pppowernoinfo.component';
import { PpmeternoinfoComponent } from 'app/pages/maintenance/ppmeternoinfo/ppmeternoinfo.component';
import { ServicenoinfoComponent } from 'app/pages/maintenance/servicenoinfo/servicenoinfo.component';
import { ServicenodetailinfoComponent } from 'app/pages/maintenance/servicenodetailinfo/servicenodetailinfo.component';
import { ServicenodetaildataComponent } from 'app/pages/maintenance/servicenodetaildata/servicenodetaildata.component';
import { PsbankdataComponent } from 'app/pages/maintenance/psbankdata/psbankdata.component';
import { BankinfoComponent } from 'app/pages/maintenance/bankinfo/bankinfo.component';
import { BankbranchinfoComponent } from 'app/pages/maintenance/bankbranchinfo/bankbranchinfo.component';
import { MenuGuard } from 'app/menu.guard';
import { PssurplusinfoComponent } from 'app/pages/maintenance/pssurplusinfo/pssurplusinfo.component';
import { PssurplusdataComponent } from 'app/pages/maintenance/pssurplusdata/pssurplusdata.component';
import { FeemaskComponent } from 'app/pages/tools/feemask/feemask.component';
import { projectplmComponent } from 'app/pages/maintenance/projectplm/projectplm.component';
import { customerplmComponent } from 'app/pages/maintenance/customerplm/customerplm.component';

export const AdminLayoutRoutes: Routes = [
  { path: 'login',          component: LoginComponent },
  { path: 'dashboard',      component: DashboardComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'icons',          component: IconsComponent},
  { path: 'project/projectplm',      component: projectplmComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'customer/customerplm',      component: customerplmComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'tools/feemask',          component: FeemaskComponent, canActivate: [AuthGuard, MenuGuard]},
  { path: 'ps/psbasicinfo',      component: PsbasicInfoComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'ps/pspowernoinfo',      component: PspowernoinfoComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'ps/psmeternoinfo',      component: PsmeternoinfoComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'ps/psbankdata',      component: PsbankdataComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'ps/pssurplusinfo',      component: PssurplusinfoComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'ps/pssurplusdata',      component: PssurplusdataComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'pp/ppbasicinfo',      component: PpbasicInfoComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'pp/pppowernoinfo',      component: PppowernoinfoComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'pp/ppmeternoinfo',      component: PpmeternoinfoComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'service/servicenoinfo',      component: ServicenoinfoComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'service/servicenodetailinfo',      component: ServicenodetailinfoComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'service/servicenodetaildata',      component: ServicenodetaildataComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'manage/setofbooks',     component: SetOfBooksComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'manage/logininfo', component: LoginInfoComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'manage/loginroles', component: LoginRolesComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'bank/bankinfo',      component: BankinfoComponent, canActivate: [AuthGuard, MenuGuard] },
  { path: 'bank/bankbranchinfo',      component: BankbranchinfoComponent, canActivate: [AuthGuard, MenuGuard] },
  ];
