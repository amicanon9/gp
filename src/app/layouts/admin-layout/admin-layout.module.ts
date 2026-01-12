
import { FileUploadComponent } from './../../_components/file-upload/file-upload.component';
import { ChangePasswordModalComponent } from './../../shared/changepassword-modal/changepassword-modal.component';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';

import { AdminLayoutRoutes } from './admin-layout.routing';

import { DashboardComponent }       from '../../pages/dashboard/dashboard.component';
import { IconsComponent }           from '../../pages/icons/icons.component';
import { PsbasicInfoComponent } from '../../pages/maintenance/psbasicinfo/psbasicinfo.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { DatePipe } from '@angular/common'

import { NgbModule }                from '@ng-bootstrap/ng-bootstrap';
import { MatTableModule }           from '@angular/material/table';
import { MatSortModule }            from '@angular/material/sort';
import { MatCardModule }            from '@angular/material/card';
import { MatPaginatorModule }       from '@angular/material/paginator';
import { MatCheckboxModule }        from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TableComponent }           from 'app/_components/sepv-table/sepv-table.component';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { PsbasicinfoModalComponent } from 'app/pages/maintenance/psbasicinfo/psbasicinfo-modal/psbasicinfo-modal.component';
import { SetOfBooksModalComponent } from 'app/pages/manage/setofbooks/setofbooks-modal/setofbooks-modal.component';
import { SetOfBooksComponent } from 'app/pages/manage/setofbooks/setofbooks.component';
import { LoginInfoComponent } from 'app/pages/manage/logininfo/logininfo.component';
import { LoginRolesModalComponent } from './../../pages/manage/loginroles/loginroles-modal/loginroles-modal.component';
import { LoginRolesComponent } from './../../pages/manage/loginroles/loginroles.component';
import { LoginInfoModalComponent } from './../../pages/manage/logininfo/logininfo-modal/logininfo-modal.component';
import { MultiSelectComponent } from 'app/_components/multi-select/multi-select.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule} from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatNativeDateModule, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { PpbasicInfoComponent } from 'app/pages/maintenance/ppbasicinfo/ppbasicinfo.component';
import { PpbasicinfoModalComponent } from 'app/pages/maintenance/ppbasicinfo/ppbasicinfo-modal/ppbasicinfo-modal.component';
import { PspowernoinfoComponent } from 'app/pages/maintenance/pspowernoinfo/pspowernoinfo.component';
import { PspowernoinfoModalComponent } from 'app/pages/maintenance/pspowernoinfo/pspowernoinfo-modal/pspowernoinfo-modal.component';
import { PsmeternoinfoComponent } from 'app/pages/maintenance/psmeternoinfo/psmeternoinfo.component';
import { PsmeternoinfoModalComponent } from 'app/pages/maintenance/psmeternoinfo/psmeternoinfo-modal/psmeternoinfo-modal.component';
import { PpmeternoinfoComponent } from 'app/pages/maintenance/ppmeternoinfo/ppmeternoinfo.component';
import { PpmeternoinfoModalComponent } from 'app/pages/maintenance/ppmeternoinfo/ppmeternoinfo-modal/ppmeternoinfo-modal.component';
import { PppowernoinfoComponent } from 'app/pages/maintenance/pppowernoinfo/pppowernoinfo.component';
import { PppowernoinfoModalComponent } from 'app/pages/maintenance/pppowernoinfo/pppowernoinfo-modal/pppowernoinfo-modal.component';
import { ServicenoinfoComponent } from 'app/pages/maintenance/servicenoinfo/servicenoinfo.component';
import { ServicenoinfoModalComponent } from 'app/pages/maintenance/servicenoinfo/servicenoinfo-modal/servicenoinfo-modal.component';
import { ServicenodetailinfoComponent } from 'app/pages/maintenance/servicenodetailinfo/servicenodetailinfo.component';
import { ServicenodetailinfoModalComponent } from 'app/pages/maintenance/servicenodetailinfo/servicenodetailinfo-modal/servicenodetailinfo-modal.component';
import { ServicenodetaildataComponent } from 'app/pages/maintenance/servicenodetaildata/servicenodetaildata.component';
import { ServicenodetaildataModalComponent } from 'app/pages/maintenance/servicenodetaildata/servicenodetaildata-modal/servicenodetaildata-modal.component';
import { PsbankdataComponent } from 'app/pages/maintenance/psbankdata/psbankdata.component';
import { PsbankdataModalComponent } from 'app/pages/maintenance/psbankdata/psbankdata-modal/psbankdata-modal.component';
import { BankbranchinfoComponent } from 'app/pages/maintenance/bankbranchinfo/bankbranchinfo.component';
import { BankbranchinfoModalComponent } from 'app/pages/maintenance/bankbranchinfo/bankbranchinfo-modal/bankbranchinfo-modal.component';
import { BankinfoComponent } from 'app/pages/maintenance/bankinfo/bankinfo.component';
import { BankinfoModalComponent } from 'app/pages/maintenance/bankinfo/bankinfo-modal/bankinfo-modal.component';
import { PssurplusinfoComponent } from 'app/pages/maintenance/pssurplusinfo/pssurplusinfo.component';
import { PssurplusinfoModalComponent } from 'app/pages/maintenance/pssurplusinfo/pssurplusinfo-modal/pssurplusinfo-modal.component';
import { PssurplusdataComponent } from 'app/pages/maintenance/pssurplusdata/pssurplusdata.component';
import { PssurplusdataModalComponent } from 'app/pages/maintenance/pssurplusdata/pssurplusdata-modal/pssurplusdata-modal.component';
import { HasPermissionDirective } from 'app/permission.directive';
import { ServicenodetailinfoExportComponent } from 'app/pages/maintenance/servicenodetailinfo/servicenodetailinfo-export/servicenodetailinfo-export.component';
import { FeemaskComponent } from 'app/pages/tools/feemask/feemask.component';
import { MatSelectModule } from '@angular/material/select';
import { projectplmComponent } from 'app/pages/maintenance/projectplm/projectplm.component';
import { projectplmModalComponent } from 'app/pages/maintenance/projectplm/projectplm-modal/projectplm-modal.component';
import { customerplmComponent } from 'app/pages/maintenance/customerplm/customerplm.component';
import { customerplmModalComponent } from 'app/pages/maintenance/customerplm/customerplm-modal/customerplm-modal.component';
export const TW_FORMATS = {
  parse: {
    dateInput: 'YYYY/MM/DD'
  },
  display: {
    dateInput: 'YYYY/MM/DD',
    monthYearLabel: 'YYYY MMM',
    dateA11yLabel: 'YYYY/MM/DD',
    monthYearA11yLabel: 'YYYY MMM'
  }
};
@NgModule({
  providers: [
    DatePipe,
    { provide: MAT_DATE_LOCALE, useValue: 'zh-TW' },
    { provide: MAT_DATE_FORMATS, useValue: TW_FORMATS }
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(AdminLayoutRoutes),
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NgSelectModule,
    // Material
    MatSelectModule,
    MatTableModule,
    MatSortModule,
    MatCardModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatButtonModule,
    MatSnackBarModule,
    MatInputModule,
    MatDialogModule,
    MatIconModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatProgressBarModule
  ],
  declarations: [
    HasPermissionDirective,
    DashboardComponent,
    TableComponent,
    IconsComponent,
    PsbasicInfoComponent,
    PpbasicInfoComponent,
    PspowernoinfoComponent,
    PspowernoinfoModalComponent,
    projectplmComponent,
    projectplmModalComponent,
    customerplmComponent,
    customerplmModalComponent,
    PsmeternoinfoComponent,
    PsmeternoinfoModalComponent,
    PpmeternoinfoComponent,
    PpmeternoinfoModalComponent,
    PppowernoinfoComponent,
    PppowernoinfoModalComponent,
    SetOfBooksComponent,
    TableComponent,
    PsbasicinfoModalComponent,
    PpbasicinfoModalComponent,
    SetOfBooksModalComponent,
    LoginInfoComponent,
    LoginInfoModalComponent,
    LoginRolesComponent,
    LoginRolesModalComponent,
    ChangePasswordModalComponent,
    MultiSelectComponent,
    FileUploadComponent,
    ServicenoinfoComponent,
    ServicenoinfoModalComponent,
    ServicenodetailinfoComponent,
    ServicenodetailinfoModalComponent,
    ServicenodetailinfoExportComponent,
    ServicenodetaildataComponent,
    ServicenodetaildataModalComponent,
    PsbankdataComponent,
    PsbankdataModalComponent,
    PssurplusinfoComponent,
    PssurplusinfoModalComponent,
    PssurplusdataComponent,
    PssurplusdataModalComponent,
    BankbranchinfoComponent,
    BankbranchinfoModalComponent,
    BankinfoComponent,
    BankinfoModalComponent,
    FeemaskComponent
  ],
  exports:[
    MultiSelectComponent,
    HasPermissionDirective
  ]
})

export class AdminLayoutModule {}
