import { ApiService } from 'app/_services/api.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'app/_services/auth.service';

@Component({
  selector: 'sepvdb-checkin',
  templateUrl: './checkin.component.html',
  styleUrls: ['./checkin.component.scss']
})
export class checkinComponent implements OnInit, OnDestroy {
  // 基礎資料
  Pjlist: any[] = [];
  checkinHistory: any[] = [];
  
  // UI 狀態控制
  isProcessing: boolean = false;
  checkinMode: 'normal' | 'backfill' = 'normal';
  currentTime: Date = new Date();
  displayedHistory: any[] = [];
  // 表單綁定變數
  selectedProject: number[] = []; // 改為 number[] 對應資料庫 int
  checkinStatus: string = '上班';  // 僅補打卡模式使用
  backfillDate: Date = new Date();
  backfillTime: string = "09:00";
  
  // 計時器
  private timer: any;

  constructor(
    private apiSvc: ApiService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private authSvc:AuthService
  ) { }

  get isBackfill() {
    return this.checkinMode === 'backfill';
  }

  ngOnInit() {
    this.loadData();
    this.getHistory();
    
    // 啟動實時時鐘
    this.timer = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // 取得專案下拉清單
  loadData() {
    this.apiSvc.getdata('projectplm').subscribe(res => {
      this.Pjlist = res;
    });
  }

 getHistory() {
  this.apiSvc.getdatabyid('CheckinLogs',this.authSvc.state.user_id).subscribe({
    next: (res: any[]) => {
      this.checkinHistory = res; // 原始資料保留供其他用途
      this.displayedHistory = this.groupHistory(res); // 呼叫合併邏輯
    },
    error: () => this.toastr.error('無法讀取歷史紀錄')
  });
}

// 合併邏輯：將相同時間、模式、狀態的紀錄合併
groupHistory(data: any[]) {
  const groups = data.reduce((acc, obj) => {
    // 建立唯一 Key：時間 (yyyy-MM-dd HH:mm) + 模式 + 狀態
    const dateStr = new Date(obj.checkin_time).toISOString().substring(0, 16); 
    const key = `${dateStr}_${obj.mode}_${obj.status}`;
    
    if (!acc[key]) {
      acc[key] = {
        checkin_time: obj.checkin_time,
        mode: obj.mode,
        status: obj.status,
        project_names: []
      };
    }
    // 將專案名稱加入陣列
    if (obj.project_name) {
      acc[key].project_names.push(`(${obj.project_id})${obj.project_name}`);
    } else {
      acc[key].project_names.push(`ID: ${obj.project_id}`);
    }
    
    return acc;
  }, {});

  // 將物件轉回陣列並排序
  return Object.keys(groups).map(key => groups[key]).sort((a: any, b: any) => 
    new Date(b.checkin_time).getTime() - new Date(a.checkin_time).getTime()
  );
}

  // 切換模式觸發
  onModeChange() {
    if (this.isBackfill) {
      this.backfillDate = new Date();
      this.checkinStatus = '上班';
    } else {
      this.resetForm();
    }
  }

  // 執行打卡
  submitCheckin() {
  let finalTime: Date = new Date(); // 取得當前電腦時間（台灣）

  if (this.isBackfill) {
    const [hours, minutes] = this.backfillTime.split(':');
    finalTime = new Date(this.backfillDate);
    finalTime.setHours(parseInt(hours), parseInt(minutes), 0);
  }

  // 強制轉成台灣格式字串：2026/1/19 10:50:00，不帶 Z 就不會被扣 8 小時
  const taipeiTimeStr = finalTime.toLocaleString('zh-TW', { hour12: false });

  const payload = {
    project_ids: this.selectedProject,
    checkin_time: taipeiTimeStr, // 傳字串
    mode: this.checkinMode,
    status: this.isBackfill ? this.checkinStatus : 'Auto'
  };

  this.isProcessing = true;
  this.apiSvc.createdata('CheckinLogs', payload).subscribe({
    next: () => {
      this.toastr.success('打卡成功');
      this.resetForm();
      this.getHistory();
    },
    error: (err) => this.toastr.error('失敗'),
    complete: () => this.isProcessing = false
  });
}

  // 重置表單
  resetForm() {
    this.selectedProject = [];
    this.backfillDate = new Date();
    this.backfillTime = "09:00";
    this.checkinStatus = '上班';
  }
}