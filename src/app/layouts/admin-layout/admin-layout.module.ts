
import { FileUploadComponent } from './../../_components/file-upload/file-upload.component';
import { ChangePasswordModalComponent } from './../../shared/changepassword-modal/changepassword-modal.component';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';

import { AdminLayoutRoutes } from './admin-layout.routing';

import { DashboardComponent }       from '../../pages/dashboard/dashboard.component';
import { IconsComponent }           from '../../pages/icons/icons.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { DatePipe } from '@angular/common'
import {MatSliderModule} from '@angular/material/slider';


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
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatRadioModule } from '@angular/material/radio'; 
import { PspowernoinfoComponent } from 'app/pages/maintenance/pspowernoinfo/pspowernoinfo.component';
import { PspowernoinfoModalComponent } from 'app/pages/maintenance/pspowernoinfo/pspowernoinfo-modal/pspowernoinfo-modal.component';
import { MatDividerModule } from '@angular/material/divider'; // 1. 匯入模組
import { HasPermissionDirective } from 'app/permission.directive';
import { FeemaskComponent } from 'app/pages/tools/feemask/feemask.component';
import { MatSelectModule } from '@angular/material/select';
import { projectplmComponent } from 'app/pages/maintenance/projectplm/projectplm.component';
import { projectplmModalComponent } from 'app/pages/maintenance/projectplm/projectplm-modal/projectplm-modal.component';
import { customerplmComponent } from 'app/pages/maintenance/customerplm/customerplm.component';
import { customerplmModalComponent } from 'app/pages/maintenance/customerplm/customerplm-modal/customerplm-modal.component';
import { weeklyreportplmModalComponent } from 'app/pages/maintenance/projectplm/weeklyreportplm-modal/weeklyreportplm-modal.component';
import { checkinComponent } from 'app/pages/tools/checkin/checkin.component';
import { leaveapplicationsComponent } from 'app/pages/tools/leaveapplications/leaveapplications.component';
import { leavemanagementComponent } from 'app/pages/tools/leavemanagement/leavemanagement.component';
import { departmentsComponent } from 'app/pages/manage/departments/departments.component';
import { departmentsModalComponent } from 'app/pages/manage/departments/departments-modal/departments-modal.component';
import { projectinternalComponent } from 'app/pages/maintenance/projectinternal/projectinternal.component';
import { ProjectInternalModalComponent } from 'app/pages/maintenance/projectinternal/projectinternal-modal/projectinternal-modal.component';
import { projectsvcModalComponent } from 'app/pages/maintenance/projectsvc/projectsvc-modal/projectsvc-modal.component';
import { projectsvcComponent } from 'app/pages/maintenance/projectsvc/projectsvc.component';
import { taskmasterComponent } from 'app/pages/maintenance/taskmaster/taskmaster.component';
import { taskmasterModalComponent } from 'app/pages/maintenance/taskmaster/taskmaster-modal/taskmaster-modal.component';
import { ImageDialogComponent } from 'app/_components/image-dialog/image-dialog.component';
import { NgImageFullscreenViewModule } from 'ng-image-fullscreen-view'; // 1. 匯入套件
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { FlexLayoutModule } from '@angular/flex-layout';
import { expenseclaimsComponent } from 'app/pages/tools/expenseclaims/expenseclaims.component';
import { expenseclaimsModalComponent } from 'app/pages/tools/expenseclaims/expenseclaims-modal/expenseclaims-modal.component';


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
    NgImageFullscreenViewModule,
    MatRadioModule,
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
    MatProgressBarModule,
    MatSliderModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    FlexLayoutModule
  ],
  declarations: [
    HasPermissionDirective,
    DashboardComponent,
    TableComponent,
    IconsComponent,
    checkinComponent,
    PspowernoinfoComponent,
    PspowernoinfoModalComponent,
    projectplmComponent,
    projectplmModalComponent,
    projectsvcComponent,
    projectsvcModalComponent,
    customerplmComponent,
    customerplmModalComponent,
    weeklyreportplmModalComponent,
    SetOfBooksComponent,
    TableComponent,
    leaveapplicationsComponent,
    leavemanagementComponent,
    projectinternalComponent,
    ProjectInternalModalComponent,
    SetOfBooksModalComponent,
    LoginInfoComponent,
    LoginInfoModalComponent,
    departmentsComponent,
    departmentsModalComponent,
    LoginRolesComponent,
    LoginRolesModalComponent,
    ChangePasswordModalComponent,
    MultiSelectComponent,
    FileUploadComponent,
    ImageDialogComponent,
    FeemaskComponent,
    taskmasterComponent,
    taskmasterModalComponent,
    expenseclaimsComponent,
    expenseclaimsModalComponent
  ],
  exports:[
    MultiSelectComponent,
    HasPermissionDirective
  ]
})

export class AdminLayoutModule {}
