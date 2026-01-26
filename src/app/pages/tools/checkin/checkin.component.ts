import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from 'app/_services/api.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'app/_services/auth.service';

interface ProjectAssign {
  id: number;
  name: string;
  percentage: number;
}

@Component({
  selector: 'sepvdb-checkin',
  templateUrl: './checkin.component.html',
  styleUrls: ['./checkin.component.scss']
})
export class checkinComponent implements OnInit, OnDestroy {
  Pjlist: any[] = [];
  displayedHistory: any[] = [];

  isProcessing = false;
  checkinMode: 'normal' | 'backfill' = 'normal';
  currentTime = new Date();

  // 工時分配核心變數
  selectedProjectIds: number[] = [];
  projectAssignments: ProjectAssign[] = [];
  totalPercentage = 0;

  // 狀態判定
  autoStatus: '上班' | '下班' = '上班';
  checkinStatus: string = '上班'; // 補打用

  backfillDate = new Date();
  backfillTime = "09:00";
  private timer: any;

  constructor(
    private apiSvc: ApiService,
    private toastr: ToastrService,
    private authSvc: AuthService
  ) { }

  ngOnInit() {
    this.loadProjects();
    this.getHistory();
    this.timer = setInterval(() => this.currentTime = new Date(), 1000);
  }

  ngOnDestroy() { if (this.timer) clearInterval(this.timer); }

  get isBackfill() { return this.checkinMode === 'backfill'; }

  loadProjects() {
    this.apiSvc.getdata('projectplm').subscribe(res => this.Pjlist = res);
  }

  // 1. 宣告一個儲存日期字串的 Set，方便快速比對
  checkedInDates = new Set<string>();

  // 2. 在獲取歷史紀錄後，更新這個 Set
  getHistory() {
    this.apiSvc.getdatabyid('CheckinLogs', this.authSvc.state.user_id).subscribe({
      next: (res: any[]) => {
        this.displayedHistory = this.groupHistory(res);

        // 更新已打卡日期清單
        this.checkedInDates.clear();
        res.forEach(item => {
          // 將日期轉為 YYYY-MM-DD 格式存入
          const dateStr = new Date(item.checkin_time).toDateString();
          this.checkedInDates.add(dateStr);
        });

        this.determineAutoStatus();
      }
    });
  }

  // 3. 定義給 Datepicker 用的 class 函數
  dateClass = (d: any): string => { // 將型別改為 any 以相容不同的 Date Adapter
    if (!d) return '';

    try {
      // 1. 強制轉換為原生 Date 物件，無論傳進來的是 Moment 還是 Date 字串
      const date = (d instanceof Date) ? d : new Date(d);

      // 2. 檢查轉換後的日期是否合法 (避免 Invalid Date)
      if (isNaN(date.getTime())) return '';

      const dateStr = date.toDateString();

      // 3. 比對 Set 中的日期
      return this.checkedInDates.has(dateStr) ? 'has-checkin-date' : '';
    } catch (e) {
      console.error('Date conversion error:', e);
      return '';
    }
  };

  // 判定當前應該是上班還是下班
  determineAutoStatus() {
    const todayStr = new Date().toDateString(); // 取得今天日期的字串 (不含時間)

    // 檢查歷史紀錄中是否有任何一筆的日期是今天
    const hasRecordToday = this.displayedHistory.some(log => {
      return new Date(log.checkin_time).toDateString() === todayStr;
    });

    if (hasRecordToday) {
      // 只要今天已經有紀錄，之後一律判定為「下班」
      this.autoStatus = '下班';

      // 找到今天「第一筆」(也就是時間最早的那次上班) 的專案紀錄來帶入
      // 因為 displayedHistory 是由新到舊排，所以最後一筆日期符合的才是今天的第一筆
      const todayLogs = this.displayedHistory.filter(log =>
        new Date(log.checkin_time).toDateString() === todayStr
      );
      const firstLogOfToday = todayLogs[todayLogs.length - 1];

      if (!this.isBackfill && firstLogOfToday) {
        this.loadLastCheckinProjects(firstLogOfToday);
      }
    } else {
      // 今天完全沒紀錄，判定為「上班」
      this.autoStatus = '上班';
    }
  }

  loadLastCheckinProjects(lastInEvent: any) {
    this.projectAssignments = lastInEvent.raw_projects.map((p: any) => ({
      id: p.project_id,
      name: p.project_name,
      percentage: p.work_percentage
    }));
    this.selectedProjectIds = this.projectAssignments.map(a => a.id);
    this.calculateTotal();
  }

  // 當選單改變時，同步更新比例列表
  onProjectSelectChange() {
    const currentIds = this.projectAssignments.map(a => a.id);

    // 1. 處理新增
    this.selectedProjectIds.forEach(id => {
      if (!currentIds.includes(id)) {
        const p = this.Pjlist.find(x => x.id === id);
        this.projectAssignments.push({
          id,
          name: `(${id})` + p?.customer_name || '未知',
          percentage: 0
        });
      }
    });

    // 2. 處理移除
    this.projectAssignments = this.projectAssignments.filter(a =>
      this.selectedProjectIds.includes(a.id)
    );

    // 3. 【優化】自動平均分配百分比
    if (this.projectAssignments.length > 0) {
      const avg = Math.floor(100 / this.projectAssignments.length);
      this.projectAssignments.forEach((p, index) => {
        // 最後一個專案拿剩下的餘數，確保加起來剛好 100
        p.percentage = (index === this.projectAssignments.length - 1)
          ? (100 - (avg * (this.projectAssignments.length - 1)))
          : avg;
      });
    }

    this.calculateTotal();
  }

  onSliderInput(event: any, item: any) {
    // 1. 更新當前拖曳項目的值
    const newValue = Number(event.value ?? 0);
    item.percentage = newValue;

    // 2. 取得其他專案
    const others = this.projectAssignments.filter(p => p !== item);

    if (others.length > 0) {
      const remaining = 100 - newValue; // 剩餘可分配額度
      const currentOthersSum = others.reduce((sum, p) => sum + Number(p.percentage || 0), 0);

      if (currentOthersSum > 0) {
        // 情況 A: 其他專案原本有比例，按比例權重縮放
        let distributedSum = 0;
        others.forEach((p, index) => {
          if (index === others.length - 1) {
            // 最後一個用減法，確保總和絕對等於 remaining，避免小數點誤差
            p.percentage = Math.max(0, remaining - distributedSum);
          } else {
            // 權重計算：(原本比例 / 其他人總比例) * 剩餘額度
            const share = Math.round((p.percentage / currentOthersSum) * remaining);
            p.percentage = Math.max(0, share);
            distributedSum += p.percentage;
          }
        });
      } else {
        // 情況 B: 其他專案原本都是 0% (例如 A 從 100% 往下拉)，則平分剩餘額度
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
    // 簡單加總，這時總和應該會自動鎖定在 100 (除非只有一個專案且你不准他拉動)
    this.totalPercentage = this.projectAssignments.reduce((sum, p) => sum + Number(p.percentage || 0), 0);
  }
  submitCheckin() {
  let finalTime: Date = new Date(); // 預設當前時間

  if (this.isBackfill) {
    const [hours, minutes] = this.backfillTime.split(':');
    finalTime = new Date(this.backfillDate);
    finalTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }

  const status = this.isBackfill ? this.checkinStatus : this.autoStatus;

  // --- 關鍵修復：直接基於 finalTime 進行偏移，不要用 toLocaleString 字串去 new Date ---
  const fakeDate = new Date(finalTime.getTime()); 
  const randomMin = Math.floor(Math.random() * 15);
  const randomSec = Math.floor(Math.random() * 60);

  if (status === '上班') {
    fakeDate.setHours(8, 15 + randomMin, randomSec);
  } else if (status === '下班') {
    fakeDate.setHours(17, 31 + randomMin, randomSec);
  }

  // 格式化 checkin_time (存檔用字串)
  const timeString = finalTime.toLocaleString('sv-SE', { hour12: false }).replace(' ', 'T'); 
  // 格式化 fake_time (建議也轉成字串，否則 JSON 傳輸會變 UTC 格式)
  const fakeTimeString = fakeDate.toLocaleString('sv-SE', { hour12: false }).replace(' ', 'T');

  const payload = this.projectAssignments.map(p => ({
    user_id: this.authSvc.state.user_id,
    book_id: 1,
    project_id: p.id,
    checkin_time: timeString, // 實際打卡時間
    fake_time: fakeTimeString, // 模擬時間
    mode: this.checkinMode,
    status: status,
    work_percentage: p.percentage
  }));

    this.isProcessing = true;
    this.apiSvc.createdata('CheckinLogs', payload).subscribe({
      next: () => {
        this.toastr.success('打卡成功', '', {
          timeOut: 3000,
          closeButton: true,
          positionClass: "toast-top-center"
        });
        this.resetForm();
        this.getHistory();
      },
      error: (err) => this.toastr.error('失敗', '', {
        timeOut: 3000,
        closeButton: true,
        positionClass: "toast-top-center"
      }),
      complete: () => this.isProcessing = false
    });
  }

  groupHistory(data: any[]) {
    const groups = data.reduce((acc, obj) => {
      const timeKey = new Date(obj.checkin_time).getTime(); // 使用時間戳記作為唯一打卡事件
      if (!acc[timeKey]) {
        acc[timeKey] = {
          checkin_time: obj.checkin_time,
          fake_time:obj.fake_time,
          mode: obj.mode,
          status: obj.status,
          project_names: [],
          raw_projects: [] // 保存原始資料供下班引用
        };
      }
      acc[timeKey].project_names.push(`${obj.project_name} (${obj.work_percentage}%)`);
      acc[timeKey].raw_projects.push(obj);
      return acc;
    }, {});
    return (Object as any).values(groups).sort((a: any, b: any) =>
      new Date(b.checkin_time).getTime() - new Date(a.checkin_time).getTime())
  }

  private getBackfillTime() {
    const [h, m] = this.backfillTime.split(':');
    const d = new Date(this.backfillDate);
    d.setHours(+h, +m, 0);
    return d.toLocaleString('zh-TW', { hour12: false });
  }

  resetForm() {
    this.selectedProjectIds = [];
    this.projectAssignments = [];
    this.totalPercentage = 0;
  }

  onModeChange() {
    this.determineAutoStatus();
  }
}