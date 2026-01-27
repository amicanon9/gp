import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from 'app/_services/api.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'app/_services/auth.service';
import { forkJoin } from 'rxjs';
import { MAT_DATE_LOCALE } from '@angular/material/core';

@Component({
  selector: 'sepvdb-leaveapplications',
  templateUrl: './leaveapplications.component.html',
  styleUrls: ['./leaveapplications.component.scss'],
  providers: [
    // 在這裡強制指定語系為英文，下拉選單就會變成純數字
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' }
  ]
})
export class leaveapplicationsComponent implements OnInit, OnDestroy {
  // 基礎清單
  deplist: any[] = [];
  leaveHistory: any[] = [];
  
  leaveTypes = [
    { value: 'Annual', label: '特休' },
    { value: 'Sick', label: '病假' },
    { value: 'Personal', label: '事假' },
    { value: 'Compensatory', label: '補休' }
  ];

  // 申請表單變數 (配合 HTML 拆分日期與時間)
  applyData: any = {
    leave_type: 'Personal',
    start_date: new Date(),
    start_time_only: '08:30',
    end_date: new Date(),
    end_time_only: '17:30',
    reason: '',
    total_hours: 0
  };

  // 使用者資訊與統計
  userInfo: any = null;
  userJoinedDate: Date | null = null;
  userDeptName: string = '';
  seniority: string = ''; // 年資文字
  managerName: string = '未指定';
  managerId: number | null = null;

  // 額度顯示
  annualLeaveTotal = 0;     // 總特休
  annualLeaveUsed = 0;      // 已休特休
  annualLeaveRemaining = 0; // 剩餘特休

  isProcessing = false;
  loaded = false;
  private timer: any;

  constructor(
    private apiSvc: ApiService,
    private toastr: ToastrService,
    private authSvc: AuthService
  ) { }

  ngOnInit() {
    this.loadData();
    // 監聽時間變化以自動計算時數
    this.timer = setInterval(() => {}, 1000); 
  }

  ngOnDestroy() { 
    if (this.timer) clearInterval(this.timer); 
  }

  loadData() {
    forkJoin({
      deplist: this.apiSvc.getdata('Departments'),
      userinfo: this.apiSvc.getdatabyid('LoginInfo', this.authSvc.state.user_id),
      history: this.apiSvc.getdatabyid('LeaveApplications', this.authSvc.state.user_id)
    }).subscribe(({ deplist, userinfo, history }) => {
      this.deplist = deplist;
      this.leaveHistory = history;
      this.userInfo = userinfo;

      if (userinfo) {
        this.userJoinedDate = new Date(userinfo.joined_date);
        this.calculateSeniority(this.userJoinedDate);
        
        // 設定部門與主管
        const dept = this.deplist.find(x => x.id === userinfo.dept_id);
        if (dept) {
          this.userDeptName = dept.name;
          this.managerName = dept.manager_name;
          this.managerId = dept.manager_id;
        }

        // 模擬計算特休 (實際應用中應從後端 API 取得)
        this.annualLeaveTotal = userinfo.annual_leave_quota || 0;
        this.calculateUsedLeave(history);
      }

      this.onTimeChange(); // 初始化時數計算
      this.loaded = true;
    });
  }

  // 計算年資
  calculateSeniority(joinedDate: Date) {
    const today = new Date();
    let years = today.getFullYear() - joinedDate.getFullYear();
    let months = today.getMonth() - joinedDate.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < joinedDate.getDate())) {
      years--;
      months += 12;
    }
    this.seniority = `${years} 年 ${months} 個月`;
  }

  // 計算已休時數
  calculateUsedLeave(history: any[]) {
    this.annualLeaveUsed = history
      .filter(x => x.leave_type === 'Annual' && x.status === 'Approved')
      .reduce((sum, item) => sum + item.total_hours, 0);
    
    this.annualLeaveRemaining = this.annualLeaveTotal - this.annualLeaveUsed;
    
  }

  // 自動計算總時數 (合併日期與時間字串)
  onTimeChange() {
    if (!this.applyData.start_date || !this.applyData.end_date) return;

    const start = this.combineDateAndTime(this.applyData.start_date, this.applyData.start_time_only);
    const end = this.combineDateAndTime(this.applyData.end_date, this.applyData.end_time_only);

    if (end > start) {
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
      this.applyData.total_hours = hours;
    } else {
      this.applyData.total_hours = 0;
    }
  }

  // 輔助：合併 Date 物件與 "HH:mm" 字串
  combineDateAndTime(date: Date, timeStr: string): Date {
    const d = new Date(date);
    const [hours, minutes] = timeStr.split(':');
    d.setHours(+hours, +minutes, 0, 0);
    return d;
  }

  isFormValid(): boolean {
    return (
      this.applyData.leave_type !== '' &&
      this.applyData.total_hours > 0 &&
      this.applyData.reason.trim() !== ''
    );
  }

  submitLeave() {
    if (!this.isFormValid()) {
      this.toastr.warning('請完整填寫申請內容', '提示');
      return;
    }

    this.isProcessing = true;

    // 合併最終要送出的 ISO 字串
    const startIso = this.combineDateAndTime(this.applyData.start_date, this.applyData.start_time_only)
                      .toLocaleString('sv-SE').replace(' ', 'T');
    const endIso = this.combineDateAndTime(this.applyData.end_date, this.applyData.end_time_only)
                      .toLocaleString('sv-SE').replace(' ', 'T');

    const payload = {
      user_id: this.authSvc.state.user_id,
      leave_type: this.applyData.leave_type,
      start_time: startIso,
      end_time: endIso,
      total_hours: this.applyData.total_hours,
      reason: this.applyData.reason,
      status: 'Pending',
      manager_id: this.managerId,
      created_at: new Date().toLocaleString('sv-SE').replace(' ', 'T')
    };

    this.apiSvc.createdata('LeaveApplications', payload).subscribe({
      next: () => {
        this.toastr.success('申請已送出', '成功');
        this.resetForm();
        this.getHistory();
      },
      error: () => this.toastr.error('送出失敗', '錯誤'),
      complete: () => this.isProcessing = false
    });
  }

  getHistory() {
    this.apiSvc.getdatabyid('LeaveApplications', this.authSvc.state.user_id).subscribe(res => {
      this.leaveHistory = res;
      this.calculateUsedLeave(res);
    });
  }

  resetForm() {
    this.applyData = {
      leave_type: 'Personal',
      start_date: new Date(),
      start_time_only: '09:00',
      end_date: new Date(),
      end_time_only: '18:00',
      reason: '',
      total_hours: 0
    };
  }

  translateStatus(status: string) {
    const map = { 'Pending': '待審核', 'Approved': '已核准', 'Rejected': '已駁回' };
    return map[status] || status;
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'Pending': return 'bg-warning text-dark';
      case 'Approved': return 'bg-success text-white';
      case 'Rejected': return 'bg-danger text-white';
      default: return 'bg-secondary text-white';
    }
  }

  translateLeaveType(type: string) {
    const item = this.leaveTypes.find(t => t.value === type);
    return item ? item.label : type;
  }
}