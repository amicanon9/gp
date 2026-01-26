import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from 'app/_services/api.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'app/_services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'sepvdb-leaveapplications',
  templateUrl: './leaveapplications.component.html',
  styleUrls: ['./leaveapplications.component.scss']
})
export class leaveapplicationsComponent implements OnInit, OnDestroy {
  // 基礎清單
  deplist: any[] = [];
  leaveHistory: any[] = [];
  
  // 假別設定 (對應後端 LeaveType 欄位)
  leaveTypes = [
    { value: 'Annual', label: '特休' },
    { value: 'Sick', label: '病假' },
    { value: 'Personal', label: '事假' },
    { value: 'Compensatory', label: '補休' }
  ];

  // 申請表單變數
  applyData = {
    leave_type: 'Personal',
    start_time: new Date(),
    end_time: new Date(),
    reason: '',
    total_hours: 0
  };

  // 使用者資訊
  userJoinedDate: Date | null = null;
  managerName: string = '未指定';
  managerId: number | null = null;

  // 狀態變數
  isProcessing = false;
  loaded = false;
  currentTime = new Date();
  private timer: any;

  // 額度顯示 (模擬)
  annualLeaveRemaining = 0;
  compensatoryRemaining = 0;

  constructor(
    private apiSvc: ApiService,
    private toastr: ToastrService,
    private authSvc: AuthService
  ) { }

  ngOnInit() {
    this.loadData();
    this.timer = setInterval(() => this.currentTime = new Date(), 1000);
  }

  ngOnDestroy() { 
    if (this.timer) clearInterval(this.timer); 
  }

  loadData() {
    // 使用 forkJoin 確保所有基礎資料到位
    forkJoin({
      deplist: this.apiSvc.getdata('Departments'),
      userinfo: this.apiSvc.getdatabyid('LoginInfo', this.authSvc.state.user_id),
      history: this.apiSvc.getdatabyid('LeaveApplications', this.authSvc.state.user_id)
    }).subscribe(({ deplist, userinfo, history }) => {
      this.deplist = deplist;
      this.leaveHistory = history;

      // 1. 設定使用者到職日
      if (userinfo) {
        this.userJoinedDate = userinfo.joined_date;
        // 2. 找到所屬部門主管
        const dept = this.deplist.find(x => x.id === userinfo.dept_id);
        if (dept) {
          this.managerName = dept.manager_name;
          this.managerId = dept.manager_id;
        }
      }

      this.loaded = true;
    });
  }

  getHistory() {
    this.apiSvc.getdatabyid('LeaveApplications', this.authSvc.state.user_id).subscribe(res => {
      this.leaveHistory = res;
    });
  }

  // 自動計算總時數 (可視需求加入午休扣除邏輯)
  onTimeChange() {
    const start = new Date(this.applyData.start_time).getTime();
    const end = new Date(this.applyData.end_time).getTime();

    if (end > start) {
      const diffMs = end - start;
      const hours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10; // 取小數第一位
      this.applyData.total_hours = hours;
    } else {
      this.applyData.total_hours = 0;
    }
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

    // 格式化日期為 sv-SE (YYYY-MM-DDTHH:mm:ss) 符合你原本的習慣
    const startTimeStr = new Date(this.applyData.start_time).toLocaleString('sv-SE').replace(' ', 'T');
    const endTimeStr = new Date(this.applyData.end_time).toLocaleString('sv-SE').replace(' ', 'T');

    const payload = {
      user_id: this.authSvc.state.user_id,
      leave_type: this.applyData.leave_type,
      start_time: startTimeStr,
      end_time: endTimeStr,
      total_hours: this.applyData.total_hours,
      reason: this.applyData.reason,
      status: 'Pending', // 預設待審
      manager_id: this.managerId,
      created_at: new Date().toLocaleString('sv-SE').replace(' ', 'T')
    };

    this.apiSvc.createdata('LeaveApplications', payload).subscribe({
      next: () => {
        this.toastr.success('申請已送出，請靜候主管審核', '成功');
        this.resetForm();
        this.getHistory();
      },
      error: () => this.toastr.error('送出失敗，請檢查網路連線', '錯誤'),
      complete: () => this.isProcessing = false
    });
  }

  resetForm() {
    this.applyData = {
      leave_type: 'Personal',
      start_time: new Date(),
      end_time: new Date(),
      reason: '',
      total_hours: 0
    };
  }

  // 輔助函式：翻譯狀態
  translateStatus(status: string) {
    const map = { 'Pending': '待審核', 'Approved': '已核准', 'Rejected': '已駁回' };
    return map[status] || status;
  }

  // 輔助函式：狀態標籤樣式
  getStatusClass(status: string) {
    switch (status) {
      case 'Pending': return 'bg-warning text-dark';
      case 'Approved': return 'bg-success text-white';
      case 'Rejected': return 'bg-danger text-white';
      default: return 'bg-secondary text-white';
    }
  }

  // 輔助函式：假別文字
  translateLeaveType(type: string) {
    const item = this.leaveTypes.find(t => t.value === type);
    return item ? item.label : type;
  }
}