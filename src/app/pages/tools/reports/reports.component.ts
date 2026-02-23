import { DroplistService } from '../../../_services/droplist.service';
import { ApiService } from 'app/_services/api.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { TableComponent } from 'app/_components/sepv-table/sepv-table.component';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'environments/environment';
import { AuthService } from 'app/_services/auth.service';
import { DatePipe } from '@angular/common'

const apiUrl = environment.reportUrl;
@Component({
  selector: 'sepvdb-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  reports: any;
  datefm: Date;
  userList: any[] = [];      // 存放所有員工清單
  selectedUser: string = ''; // 綁定選中的 username

  constructor(
    public datepipe: DatePipe,
    public authSvc: AuthService,
    public apiSvc: ApiService
  ) {
    this.reports = ['出勤紀錄表'];
  }

  ngOnInit() {
    this.datefm = new Date(); // 預設今天
    this.loadUserList();      // 初始化時抓取人員名單
  }

  // 1. 抓取人員清單
  loadUserList() {
    this.apiSvc.getdata('Logininfo').subscribe((res: any) => {
      this.userList = res;
      // 預設選中當前登入者
      this.selectedUser = this.authSvc.state.username;
    });
  }

  // 2. 執行下載
  openReport(reportName: string) {
    if (!this.selectedUser) {
      alert('請先選擇員工！');
      return;
    }

    const targetMonth = this.datepipe.transform(this.datefm, 'yyyy-MM');
    
    const payload = {
      reportName: reportName,
      Username: this.selectedUser, // 使用下拉選單選中的人
      Month: targetMonth,
      format: 'EXCELOPENXML'
    };

    this.apiSvc.getReport(payload).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.selectedUser}_${reportName}_${targetMonth}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    });
  }
}
