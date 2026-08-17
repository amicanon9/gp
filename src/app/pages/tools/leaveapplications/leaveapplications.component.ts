import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from 'app/_services/api.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'app/_services/auth.service';
import { forkJoin } from 'rxjs';
import { MAT_DATE_LOCALE } from '@angular/material/core';

export function calculateLeaveHours(start: Date, end: Date, holidays: Set<string> = new Set()): number {
  if (!(start instanceof Date) || Number.isNaN(start.getTime()) || !(end instanceof Date) || Number.isNaN(end.getTime()) || end <= start) {
    return 0;
  }

  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const cursor = new Date(startDay);

  let totalMs = 0;

  while (cursor <= endDay) {
    const dateStr = cursor.toDateString();
    const isWeekend = cursor.getDay() === 0 || cursor.getDay() === 6;
    const isHoliday = holidays.has(dateStr);

    if (!isWeekend && !isHoliday) {
      const dayStart = new Date(cursor);
      dayStart.setHours(8, 30, 0, 0);
      const dayEnd = new Date(cursor);
      dayEnd.setHours(17, 30, 0, 0);

      const segmentStart = cursor.getTime() === startDay.getTime() ? start : dayStart;
      const segmentEnd = cursor.getTime() === endDay.getTime() ? end : dayEnd;

      if (segmentEnd > segmentStart) {
        let segmentMs = segmentEnd.getTime() - segmentStart.getTime();

        const lunchStart = new Date(cursor);
        lunchStart.setHours(12, 30, 0, 0);
        const lunchEnd = new Date(cursor);
        lunchEnd.setHours(13, 30, 0, 0);

        const overlapStart = Math.max(segmentStart.getTime(), lunchStart.getTime());
        const overlapEnd = Math.min(segmentEnd.getTime(), lunchEnd.getTime());
        if (overlapEnd > overlapStart) {
          segmentMs -= overlapEnd - overlapStart;
        }

        totalMs += Math.max(0, segmentMs);
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10;
}

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
  isOtherSelected = false;
  customLeaveName = '';
  leaveTypes = ['特休', '病假', '事假', '公假', '婚假', '喪假', '產假', '其他'];

  // 申請表單變數 (配合 HTML 拆分日期與時間)
  applyData: any = {
    leave_type: '特休',
    start_date: new Date(),
    start_time_only: '08:30',
    end_date: new Date(),
    end_time_only: '17:30',
    reason: '',
    total_hours: 8
  };

  // 使用者資訊與統計
  userInfo: any = null;
  userJoinedDate: Date | null = null;
  userDeptName: string = '';
  seniority: string = ''; // 年資文字
  managerName: string = '未指定';
  managerId: number | null = null;
  checkedInDates = new Set<string>();
  approvedLeaves = new Set<string>();
  pendingLeaves = new Set<string>();
  holidays = new Set<string>();
  // 額度顯示
  annualLeaveTotal = 0;     // 總特休
  annualLeaveUsed = 0;      // 已休特休
  annualLeaveRemaining = 0; // 剩餘特休

  isProcessing = false;
  loaded = false;
  private timer: any;
  deptId: any;

  constructor(
    private apiSvc: ApiService,
    private toastr: ToastrService,
    private authSvc: AuthService
  ) { }

  ngOnInit() {
    this.loadData();
    // 監聽時間變化以自動計算時數
    this.timer = setInterval(() => { }, 1000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  onLeaveTypeChange() {
    // 檢查選中的值是否為 '其他'
    if (this.applyData.leave_type === '其他') {
      this.isOtherSelected = true;
      // 先清空 leave_type，讓使用者接下來輸入的東西成為最終值
      this.applyData.leave_type = '';
    } else {
      this.isOtherSelected = false;
      this.customLeaveName = '';
    }

    if (this.onTimeChange) {
      this.onTimeChange();
    }
  }

  updateOtherValue() {
    this.applyData.leave_type = this.customLeaveName;
  }
  calculateLaborLawQuota(joinedDate: Date): number {
    const today = new Date();

    // 計算總月數年資
    let totalMonths = (today.getFullYear() - joinedDate.getFullYear()) * 12 + (today.getMonth() - joinedDate.getMonth());
    if (today.getDate() < joinedDate.getDate()) {
      totalMonths--; // 未滿一個月不計
    }

    let totalDays = 0;

    if (totalMonths >= 6 && totalMonths < 12) {
      totalDays = 3;
    } else if (totalMonths >= 12) {
      const years = Math.floor(totalMonths / 12);

      if (years === 1) totalDays = 7;
      else if (years === 2) totalDays = 10;
      else if (years >= 3 && years < 5) totalDays = 14;
      else if (years >= 5 && years < 10) totalDays = 15;
      else if (years >= 10) {
        // 滿 10 年後，每一年加 1 天，上限 30 天
        totalDays = Math.min(16 + (years - 10), 30);
      }
    }

    // 假設一天 8 小時，回傳總小時數
    return totalDays * 8;
  }
  loadData() {
    this.loadHolidayData();

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
          this.deptId = dept.id;
        }

        // 模擬計算特休 (實際應用中應從後端 API 取得)
        this.annualLeaveTotal = this.calculateLaborLawQuota(this.userJoinedDate);
        this.calculateUsedLeave(history);
      }
      this.processLeaveDates(history); // 處理請假日期分類
      this.onTimeChange(); // 初始化時數計算
      this.loaded = true;
    });
    this.apiSvc.getdatabyid('CheckinLogs', this.authSvc.state.user_id).subscribe({
      next: (res: any[]) => {
        this.checkedInDates.clear();
        res.forEach(item => {
          const dateStr = new Date(item.checkin_time).toDateString();
          this.checkedInDates.add(dateStr);
        });
      }
    });
  }
  loadHolidayData() {
    const currentYearNum = new Date().getFullYear();
    const lastYear = (currentYearNum - 1).toString();
    const currentYear = currentYearNum.toString();

    forkJoin({
      lastYearData: this.apiSvc.getHolidaysData(lastYear),
      currentYearData: this.apiSvc.getHolidaysData(currentYear)
    }).subscribe({
      next: (result) => {
        this.holidays.clear();
        [...result.lastYearData, ...result.currentYearData]
          .filter(item => item.isHoliday)
          .forEach(item => {
            const y = parseInt(item.date.substring(0, 4));
            const m = parseInt(item.date.substring(4, 6)) - 1;
            const d = parseInt(item.date.substring(6, 8));
            const dateObj = new Date(y, m, d);
            this.holidays.add(dateObj.toDateString());
          });
        this.onTimeChange();
      },
      error: () => console.error('載入假日資料失敗')
    });
  }

  // 4. 請假與打卡狀態判定邏輯
  processLeaveDates(history: any[]) {
    this.approvedLeaves.clear();
    this.pendingLeaves.clear();
    history.forEach(item => {
      let start = new Date(item.start_time);
      let end = new Date(item.end_time);
      let current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      let endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      while (current <= endDate) {
        const dateStr = current.toDateString();
        if (item.status === 'Approved') this.approvedLeaves.add(dateStr);
        else if (item.status === 'Pending') this.pendingLeaves.add(dateStr);
        current.setDate(current.getDate() + 1);
      }
    });
  }
  dateClass = (d: any): string => {
    if (!d) return '';
    const date = (d instanceof Date) ? d : new Date(d);
    if (isNaN(date.getTime())) return '';
    const dateStr = date.toDateString();
    if (this.approvedLeaves.has(dateStr)) return 'leave-approved-date';
    if (this.pendingLeaves.has(dateStr)) return 'leave-pending-date';
    if (this.checkedInDates.has(dateStr)) return 'has-checkin-date';
    return '';
  };
  // getHistory 也要記得更新 Set
  getHistory() {
    this.apiSvc.getdatabyid('LeaveApplications', this.authSvc.state.user_id).subscribe(res => {
      this.leaveHistory = res;
      this.calculateUsedLeave(res);
      this.processLeaveDates(res); // 重要：更新日曆顏色
    });
  }
  // 計算年資
  calculateSeniority(joinedDate: Date) {
    console.log(joinedDate)
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
      .filter(x => x.leave_type === '特休' && x.status === 'Approved')
      .reduce((sum, item) => sum + item.total_hours, 0);

    this.annualLeaveRemaining = this.annualLeaveTotal - this.annualLeaveUsed;

  }

  // 自動計算總時數 (按工作日 8 小時與假日排除計算)
  onTimeChange() {
    if (!this.applyData.start_date || !this.applyData.end_date ||
      !this.applyData.start_time_only || !this.applyData.end_time_only) return;

    const start = this.combineDateAndTime(this.applyData.start_date, this.applyData.start_time_only);
    const end = this.combineDateAndTime(this.applyData.end_date, this.applyData.end_time_only);

    this.applyData.total_hours = calculateLeaveHours(start, end, this.holidays);
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
    this.isProcessing = true;

    // 合併最終要送出的 ISO 字串
    const startIso = this.combineDateAndTime(this.applyData.start_date, this.applyData.start_time_only)
      .toLocaleString('sv-SE').replace(' ', 'T');
    const endIso = this.combineDateAndTime(this.applyData.end_date, this.applyData.end_time_only)
      .toLocaleString('sv-SE').replace(' ', 'T');

    const payload = {
      dept_id: this.deptId,
      user_id: this.authSvc.state.user_id,
      leave_type: this.isOtherSelected ? this.customLeaveName : this.applyData.leave_type,
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
        this.toastr.success('申請已送出', '', {
          timeOut: 3000,
          closeButton: true,
          positionClass: "toast-top-center"
        });
        this.resetForm();
        this.getHistory();
      },
      error: () => this.toastr.error('送出失敗', '', {
        timeOut: 3000,
        closeButton: true,
        positionClass: "toast-top-center"
      }),
      complete: () => this.isProcessing = false
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


}