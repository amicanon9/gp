import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ApiService } from 'app/_services/api.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'app/_services/auth.service';
import { forkJoin } from 'rxjs';import { MatCalendar } from '@angular/material/datepicker';

import { MatSnackBar } from '@angular/material/snack-bar';

interface ProjectAssign {
  id: number;
  name: string;
  percentage: number;
  type: string;
}

@Component({
  selector: 'sepvdb-checkin',
  templateUrl: './checkin.component.html',
  styleUrls: ['./checkin.component.scss']
})
export class checkinComponent implements OnInit, OnDestroy {
  Pjlist: any[] = []; // 原始清單
  displayedHistory: any[] = [];
@ViewChild(MatCalendar) calendar!: MatCalendar<Date>;
  isProcessing = false;
  checkinMode: 'normal' | 'backfill' = 'normal';
  currentTime = new Date();
  isCalendarView =true;
  // 分成兩個選單的綁定值
  selectedPlmKeys: string[] = [];
  selectedSvcKeys: string[] = [];
  selectedInternalKeys: string[] = [];
  selectedFirmKeys: string[] = [];
  projectAssignments: ProjectAssign[] = [];

  totalPercentage = 0;
  checkedInDates = new Set<string>();
  checkinOnlyDates = new Set<string>(); // 新增
  approvedLeaves = new Set<string>();
  pendingLeaves = new Set<string>();

  autoStatus: '上班' | '下班' = '上班';
  checkinStatus: string = '上班';
  holidays = new Set<string>();
  backfillDate = new Date();
  backfillTime = "08:30";
  private timer: any;

  constructor(
    private apiSvc: ApiService,
    private toastr: ToastrService,
    private authSvc: AuthService,
    private snackbar: MatSnackBar,
  ) { }

  ngOnInit() {
    this.loadAllProjects();
    this.timer = setInterval(() => this.currentTime = new Date(), 1000);
    this.loadHolidays();
  }

loadHolidays() {
  const currentYearNum = new Date().getFullYear();
  const lastYear = (currentYearNum - 1).toString();
  const currentYear = currentYearNum.toString();

  // 同時發起兩個請求
  forkJoin({
    lastYearData: this.apiSvc.getHolidaysData(lastYear),
    currentYearData: this.apiSvc.getHolidaysData(currentYear)
  }).subscribe({
    next: (result) => {
      this.holidays.clear();
      
      // 合併兩年的陣列
      const combinedData = [...result.lastYearData, ...result.currentYearData];
      
      combinedData
        .filter(item => item.isHoliday)
        .forEach(item => {
          const y = parseInt(item.date.substring(0, 4));
          const m = parseInt(item.date.substring(4, 6)) - 1;
          const d = parseInt(item.date.substring(6, 8));
          
          const dateObj = new Date(y, m, d);
          this.holidays.add(dateObj.toDateString());
        });

      console.log(`${lastYear}-${currentYear} 假日資料載入完成，共 ${this.holidays.size} 筆`);
      if (this.calendar) {
        this.calendar.updateTodaysDate(); // 這會觸發視圖更新
      }
    },
    error: (err) => {
      console.error('抓取跨年度假日 API 失敗', err);
    }
  });
}
  ngOnDestroy() { if (this.timer) clearInterval(this.timer); }

  get isBackfill() { return this.checkinMode === 'backfill'; }

  // 輔助方法：供 HTML 過濾不同類型的專案
  getProjectsByType(type: 'PLM' | 'Internal'| 'Svc' | 'Firm') {
    return this.Pjlist.filter(p => p.type === type);
  }

  // 1. 載入所有專案
  loadAllProjects() {
    forkJoin({
      plm: this.apiSvc.getdatabyrole('projectplm'),
      internal: this.apiSvc.getdata('projectinternal'),
      svc: this.apiSvc.getdata('projectsvc'),
      firm: this.apiSvc.getdata('projectfirm'),
    }).subscribe({
      next: (res) => {
        const plmList = (res.plm || []).map(p => ({
          ...p,
          type: 'PLM',
          displayName: `(PLM ${p.id}) ${p.customer_name || '未命名'}`,
          uniqueKey: `PLM_${p.id}`
        }));

        const internalList = (res.internal || []).map(p => ({
          ...p,
          type: 'Internal',
          displayName: `(內部 ${p.id}) ${p.name || '未命名項目'}`,
          uniqueKey: `Internal_${p.id}`
        }));
        const svcList = (res.svc || []).map(p => ({
          ...p,
          type: 'Svc',
          displayName: `(SVC ${p.id}) ${p.project_name || '未命名項目'}`,
          uniqueKey: `Svc_${p.id}`
        }));
        const firmList = (res.firm || []).map(p => ({
          ...p,
          type: 'Firm',
          displayName: `(事務所 ${p.id}) ${p.name || '未命名項目'}`,
          uniqueKey: `Firm_${p.id}`
        }));
        this.Pjlist = [...internalList, ...plmList, ...svcList, ...firmList];
        this.getHistory();
      },
      error: () => this.toastr.error('專案清單載入失敗')
    });
  }

  // 2. 處理選單選擇變更 (核心邏輯)
  onProjectSelectChange() {
    // 合併兩個選單的 Key 值
    const allSelectedKeys = [...this.selectedPlmKeys, ...this.selectedInternalKeys, ...this.selectedSvcKeys, ...this.selectedFirmKeys];
    const currentKeys = this.projectAssignments.map(a => `${a.type}_${a.id}`);

    // A. 處理新增：如果選單中有，但 Assignments 中沒有
    allSelectedKeys.forEach(key => {
      if (!currentKeys.includes(key)) {
        const p = this.Pjlist.find(x => x.uniqueKey === key);
        if (p) {
          this.projectAssignments.push({
            id: p.id,
            type: p.type,
            name: p.displayName,
            percentage: 0
          });
        }
      }
    });

    // B. 處理刪除：如果 Assignments 中有，但選單中已取消勾選
    this.projectAssignments = this.projectAssignments.filter(a =>
      allSelectedKeys.includes(`${a.type}_${a.id}`)
    );

    // C. 自動重新分配比例
    if (this.projectAssignments.length > 0) {
      const avg = Math.floor(100 / this.projectAssignments.length);
      this.projectAssignments.forEach((p, index) => {
        p.percentage = (index === this.projectAssignments.length - 1)
          ? (100 - (avg * (this.projectAssignments.length - 1)))
          : avg;
      });
    }
    this.calculateTotal();
  }

  // 3. 載入上次打卡的專案資料 (分類至兩個選單)
  loadLastCheckinProjects(lastInEvent: any) {
    this.projectAssignments = lastInEvent.raw_projects.map((p: any) => ({
      id: p.project_id,
      type: p.type,
      name: this.getProjectDisplayName(p.project_id, p.type),
      percentage: p.work_percentage
    }));

    // 將資料分回對應的選單綁定變數
    this.selectedPlmKeys = this.projectAssignments
      .filter(a => a.type === 'PLM')
      .map(a => `PLM_${a.id}`);
      
    this.selectedInternalKeys = this.projectAssignments
      .filter(a => a.type === 'Internal')
      .map(a => `Internal_${a.id}`);

      this.selectedSvcKeys = this.projectAssignments
      .filter(a => a.type === 'Svc')
      .map(a => `Svc_${a.id}`);
      this.selectedFirmKeys = this.projectAssignments
      .filter(a => a.type === 'Firm')
      .map(a => `Firm_${a.id}`);
    this.calculateTotal();
  }

  // --- 其餘共用邏輯 ---

  getProjectDisplayName(id: number, type: string): string {
    const pj = this.Pjlist.find(x => x.id === id && x.type === type);
    return pj ? pj.displayName : `未知項目(${id})`;
  }

  onSliderInput(event: any, item: any) {
    const newValue = Number(event.value ?? 0);
    item.percentage = newValue;
    const others = this.projectAssignments.filter(p => p !== item);
    if (others.length > 0) {
      const remaining = 100 - newValue;
      const currentOthersSum = others.reduce((sum, p) => sum + Number(p.percentage || 0), 0);
      if (currentOthersSum > 0) {
        let distributedSum = 0;
        others.forEach((p, index) => {
          if (index === others.length - 1) {
            p.percentage = Math.max(0, remaining - distributedSum);
          } else {
            const share = Math.round((p.percentage / currentOthersSum) * remaining);
            p.percentage = Math.max(0, share);
            distributedSum += p.percentage;
          }
        });
      } else {
        const avg = Math.floor(remaining / others.length);
        const extra = remaining % others.length;
        others.forEach((p, index) => {
          p.percentage = (index === others.length - 1) ? (avg + extra) : avg;
        });
      }
    }
    this.calculateTotal();
  }

  calculateTotal() {
    this.totalPercentage = this.projectAssignments.reduce((sum, p) => sum + Number(p.percentage || 0), 0);
  }

  getHistory() {
    forkJoin({
      checkin: this.apiSvc.getdatabyid('CheckinLogs', this.authSvc.state.user_id),
      leave: this.apiSvc.getdatabyid('LeaveApplications', this.authSvc.state.user_id)
    }).subscribe({
      next: ({ checkin, leave }) => {
        this.displayedHistory = this.groupHistory(checkin);
        console.log(this.displayedHistory)
        this.checkedInDates.clear();
        this.checkinOnlyDates.clear(); // 新增

        // 先分別收集上班、下班日期
        const checkinDays = new Set<string>();
        const checkoutDays = new Set<string>();

        checkin.forEach(item => {
          const dateStr = new Date(item.checkin_time).toDateString();
          this.checkedInDates.add(dateStr);

          if (item.status === '上班') checkinDays.add(dateStr);
          if (item.status === '下班') checkoutDays.add(dateStr);
        });

        // 有上班卡但沒下班卡的日期
        checkinDays.forEach(dateStr => {
          if (!checkoutDays.has(dateStr)) {
            this.checkinOnlyDates.add(dateStr);
          }
        });
        this.determineAutoStatus();
        this.processLeaveDates(leave);
        if (this.calendar) {
        this.calendar.updateTodaysDate(); // 這會觸發視圖更新
      }
      }
    });
  }

  groupHistory(data: any[]) {
    const groups = data.reduce((acc, obj) => {
      const timeKey = new Date(obj.fake_time).getTime();
      if (!acc[timeKey]) {
        acc[timeKey] = {
          checkin_time: obj.checkin_time,
          fake_time: obj.fake_time,
          mode: obj.mode,
          status: obj.status,
          project_names: [],
          raw_projects: [] 
        };
      }
      if (obj.project_id) {
        const displayName = this.getProjectDisplayName(obj.project_id, obj.type);
        acc[timeKey].project_names.push(`${displayName} (${obj.work_percentage}%)`);
        acc[timeKey].raw_projects.push(obj);
      } else {
        acc[timeKey].project_names.push(`一般打卡 (100%)`);
      }
      return acc;
    }, {});
    return (Object as any).values(groups).sort((a: any, b: any) =>
      new Date(b.checkin_time).getTime() - new Date(a.checkin_time).getTime());
  }

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

  determineAutoStatus() {
    const todayStr = new Date().toDateString();
    const hasRecordToday = this.displayedHistory.some(log => 
      new Date(log.checkin_time).toDateString() === todayStr
    );
    if (hasRecordToday) {
      this.autoStatus = '下班';
      const todayLogs = this.displayedHistory.filter(log =>
        new Date(log.checkin_time).toDateString() === todayStr
      );
      const firstLogOfToday = todayLogs[todayLogs.length - 1]; 
      if (!this.isBackfill && firstLogOfToday) {
        this.loadLastCheckinProjects(firstLogOfToday);
      }
    } else {
      this.autoStatus = '上班';
    }
  }

  submitCheckin() {
    let finalTime: Date = new Date();
    if (this.isBackfill) {
      const [hours, minutes] = this.backfillTime.split(':');
      finalTime = new Date(this.backfillDate);
      finalTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    const status = this.isBackfill ? this.checkinStatus : this.autoStatus;
    const fakeDate = new Date(finalTime.getTime()); 
    const randomMin = Math.floor(Math.random() * 15);
    const randomSec = Math.floor(Math.random() * 60);

    if (status === '上班') fakeDate.setHours(8, 15 + randomMin, randomSec);
    else if (status === '下班') fakeDate.setHours(17, 31 + randomMin, randomSec);

    const timeString = finalTime.toLocaleString('sv-SE', { hour12: false }).replace(' ', 'T'); 
    const fakeTimeString = fakeDate.toLocaleString('sv-SE', { hour12: false }).replace(' ', 'T');

    let payload: any[] = [];
    if (this.projectAssignments.length > 0) {
      payload = this.projectAssignments.map(p => ({
        user_id: this.authSvc.state.user_id,
        book_id: 1,
        project_id: p.id,
        type: p.type, 
        checkin_time: timeString,
        fake_time: fakeTimeString,
        mode: this.checkinMode,
        status: status,
        work_percentage: p.percentage
      }));
    } else {
      payload = [{
        user_id: this.authSvc.state.user_id,
        book_id: 1,
        project_id: null,
        type: 'None',
        checkin_time: timeString,
        fake_time: fakeTimeString,
        mode: this.checkinMode,
        status: status,
        work_percentage: 100
      }];
    }

    this.isProcessing = true;
    this.apiSvc.createdata('CheckinLogs', payload).subscribe({
      next: () => {
        this.toastr.success('打卡成功');
        this.resetForm();
        this.getHistory();
      },
      error: () => {
        this.toastr.error('失敗');
        this.isProcessing = false;
      },
      complete: () => this.isProcessing = false
    });
  }
  // 需注入 Swal (SweetAlert2) 或使用 confirm
async deleteHistory(item: any) {
  const ref = this.snackbar.open('確定要刪除這筆補打紀錄嗎?', '確定', { 
    duration: 5000, // 給使用者多一點時間考慮
    panelClass: ['alert-danger', 'alert'],
    verticalPosition: 'top'
  });
  ref.onAction().subscribe(() => {
    // 取得該組紀錄中所有的 ID (支持多專案分攤的情況)
    const idsToDelete = item.raw_projects.map((p: any) => p.id);
    
    // 同時送出刪除請求
    const deleteRequests = idsToDelete.map(id => 
      this.apiSvc.deletedata('CheckinLogs', id)
    );

    forkJoin(deleteRequests).subscribe({
      next: () => {
        this.showSuccessToast('紀錄已成功刪除');
        this.getHistory(); // 重新整理清單
      },
      error: (err) => {
        console.error('刪除失敗', err);
        this.snackbar.open('刪除失敗，請稍後再試', '關閉', { duration: 3000 });
      }
    });
  });

}
  resetForm() {
    this.selectedPlmKeys = [];
    this.selectedSvcKeys =[];
    this.selectedInternalKeys = [];
    this.selectedFirmKeys = [];
    this.projectAssignments = [];
    this.totalPercentage = 0;
  }

  onModeChange() {
    this.determineAutoStatus();
  }

  dateClass = (d: any): string => {
  if (!d) return '';
  const date = (d instanceof Date) ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  
  const dateStr = date.toDateString();

  // 優先順序建議：請假 > 假日 > 已打卡
  if (this.approvedLeaves.has(dateStr)) return 'leave-approved-date';
  if (this.pendingLeaves.has(dateStr)) return 'leave-pending-date';
  
  // 新增：國定假日判斷 (顯示為紅色或橘色)
  if (this.holidays.has(dateStr)) return 'holiday-date';
  
  if (this.checkinOnlyDates.has(dateStr)) return 'checkin-only-date';
  if (this.checkedInDates.has(dateStr)) return 'has-checkin-date';
  
  return '';
};
  private showSuccessToast(msg: string) {
    this.toastr.success(`<span class="nc-icon nc-bell-55"></span> ${msg}`, "", {
      timeOut: 3000, closeButton: true, enableHtml: true,
      toastClass: "alert alert-success alert-with-icon", positionClass: "toast-top-center"
    });
  }
}