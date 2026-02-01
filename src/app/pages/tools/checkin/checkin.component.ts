import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from 'app/_services/api.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'app/_services/auth.service';
import { forkJoin } from 'rxjs';

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
  Pjlist: any[] = []; // 包含 PLM 與 Internal 專案
  displayedHistory: any[] = [];

  isProcessing = false;
  checkinMode: 'normal' | 'backfill' = 'normal';
  currentTime = new Date();

  // 選單綁定關鍵：使用 uniqueKey (例如 'PLM_10' 或 'Internal_5')
  selectedProjectKeys: string[] = [];
  projectAssignments: ProjectAssign[] = [];
  
  totalPercentage = 0;
  checkedInDates = new Set<string>();
  approvedLeaves = new Set<string>();
  pendingLeaves = new Set<string>();  
  
  autoStatus: '上班' | '下班' = '上班';
  checkinStatus: string = '上班'; 

  backfillDate = new Date();
  backfillTime = "08:30";
  private timer: any;

  constructor(
    private apiSvc: ApiService,
    private toastr: ToastrService,
    private authSvc: AuthService
  ) { }

  ngOnInit() {
    this.loadAllProjects();
    this.timer = setInterval(() => this.currentTime = new Date(), 1000);
  }

  ngOnDestroy() { if (this.timer) clearInterval(this.timer); }

  get isBackfill() { return this.checkinMode === 'backfill'; }

  // 1. 同時載入兩張表的專案清單 (都用 getdata)
  loadAllProjects() {
    forkJoin({
      plm: this.apiSvc.getdatabyrole('projectplm'),
      internal: this.apiSvc.getdata('projectinternal') // 改回 getdata
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

        this.Pjlist = [...internalList, ...plmList];
        
        // 確保清單載入後再抓歷史紀錄，以便名稱對照
        this.getHistory();
      },
      error: () => this.toastr.error('專案清單載入失敗')
    });
  }

  // 2. 獲取紀錄
  getHistory() {
    forkJoin({
      checkin: this.apiSvc.getdatabyid('CheckinLogs', this.authSvc.state.user_id),
      leave: this.apiSvc.getdatabyid('LeaveApplications', this.authSvc.state.user_id)
    }).subscribe({
      next: ({ checkin, leave }) => {
        this.displayedHistory = this.groupHistory(checkin);
        this.checkedInDates.clear();
        checkin.forEach(item => {
          this.checkedInDates.add(new Date(item.checkin_time).toDateString());
        });
        this.determineAutoStatus();
        this.processLeaveDates(leave);
      }
    });
  }

  // 根據 ID 與 Type 找出顯示名稱
  getProjectDisplayName(id: number, type: string): string {
    const pj = this.Pjlist.find(x => x.id === id && x.type === type);
    return pj ? pj.displayName : `未知項目(${id})`;
  }

  // 3. 歷史紀錄分群與顯示處理
  groupHistory(data: any[]) {
    const groups = data.reduce((acc, obj) => {
      const timeKey = new Date(obj.checkin_time).getTime();
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
      const firstLogOfToday = todayLogs[todayLogs.length - 1]; // 取得當天最早一筆
      if (!this.isBackfill && firstLogOfToday) {
        this.loadLastCheckinProjects(firstLogOfToday);
      }
    } else {
      this.autoStatus = '上班';
    }
  }

  loadLastCheckinProjects(lastInEvent: any) {
    this.projectAssignments = lastInEvent.raw_projects.map((p: any) => ({
      id: p.project_id,
      type: p.type,
      name: this.getProjectDisplayName(p.project_id, p.type),
      percentage: p.work_percentage
    }));
    this.selectedProjectKeys = this.projectAssignments.map(a => `${a.type}_${a.id}`);
    this.calculateTotal();
  }

  // 5. 專案選擇與比例計算
  onProjectSelectChange() {
    const currentKeys = this.projectAssignments.map(a => `${a.type}_${a.id}`);

    this.selectedProjectKeys.forEach(key => {
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

    this.projectAssignments = this.projectAssignments.filter(a =>
      this.selectedProjectKeys.includes(`${a.type}_${a.id}`)
    );

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

  // 6. 提交打卡
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

  resetForm() {
    this.selectedProjectKeys = [];
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
    if (this.approvedLeaves.has(dateStr)) return 'leave-approved-date';
    if (this.pendingLeaves.has(dateStr)) return 'leave-pending-date';
    if (this.checkedInDates.has(dateStr)) return 'has-checkin-date';
    return '';
  };
}