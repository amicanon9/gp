import { Component, OnInit } from '@angular/core';
import { ApiService } from 'app/_services/api.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'app/_services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DATE_LOCALE } from '@angular/material/core';

@Component({
  selector: 'sepvdb-leavemanagement',
  templateUrl: './leavemanagement.component.html',
  styleUrls: ['./leavemanagement.component.scss'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' }
  ]
})
export class leavemanagementComponent implements OnInit {
  leaveHistory: any[] = [];
  managerName: string = '';
  isProcessing = false;
  loaded = false;

  constructor(
    private apiSvc: ApiService,
    private toastr: ToastrService,
    private authSvc: AuthService,
    private snackbar: MatSnackBar // 注入 Snackbar 用於確認視窗
  ) { }

  ngOnInit() {
    this.managerName = this.authSvc.state.user_name;
    this.loadData();
  }

  /**
   * 載入待審核假單 (使用 leaveapplications API)
   */
  loadData() {
    this.isProcessing = true;
    this.apiSvc.getdata('leaveapplications').subscribe({
      next: (res: any[]) => {
        this.leaveHistory = res.sort((a, b) => {
          if (a.status === 'Pending' && b.status !== 'Pending') return -1;
          if (a.status !== 'Pending' && b.status === 'Pending') return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        this.loaded = true;
      },
      error: () => {
        this.toastr.error('讀取假單失敗', '', { 
          timeOut: 3000, positionClass: "toast-top-center" 
        });
      },
      complete: () => this.isProcessing = false
    });
  }

  /**
   * 審核邏輯：改用 Snackbar 確認與 Toastr 提示
   */
  processAudit(item: any, newStatus: 'Approved' | 'Rejected') {
    const actionName = newStatus === 'Approved' ? '核准' : '駁回';

    // 1. 使用 Snackbar 置中確認
    const snackRef = this.snackbar.open(`你確定要${actionName} ${item.username} 的申請嗎?`, '確定', {
      duration: 5000,
      panelClass: newStatus === 'Approved' ? ['alert-success', 'alert'] : ['alert-danger', 'alert'],
      verticalPosition: 'top',
      horizontalPosition: 'center',
    });

    // 2. 當點擊「確定」按鈕時觸發 API
    snackRef.onAction().subscribe(() => {
      this.executeAudit(item, newStatus, actionName);
    });
  }

  /**
   * 實際執行 API 更新
   */
  private executeAudit(item: any, newStatus: 'Approved' | 'Rejected', actionName: string) {
    this.isProcessing = true;

    const payload = {
      ...item,
      status: newStatus,
      description: `主管已${actionName}`, 
      audit_time: new Date().toLocaleString('sv-SE').replace(' ', 'T')
    };

    // 使用 leaveapplications API 並傳入 id
    this.apiSvc.updatedata('leaveapplications', item.id, payload).subscribe({
      next: () => {
        // 成功提示 (置中)
        this.toastr.success(`${actionName}成功`, '', {
          timeOut: 3000,
          closeButton: true,
          positionClass: "toast-top-center"
        });
        this.loadData();
      },
      error: (err) => {
        // 失敗提示 (置中)
        this.toastr.error(`${actionName}失敗，請稍後再試`, '', {
          timeOut: 3000,
          closeButton: true,
          positionClass: "toast-top-center"
        });
        console.error(err);
      },
      complete: () => this.isProcessing = false
    });
  }

  getPendingCount(): number {
    return this.leaveHistory.filter(x => x.status === 'Pending').length;
  }

  getApprovedCount(): number {
    return this.leaveHistory.filter(x => x.status === 'Approved').length;
  }

  // --- 格式化輔助 ---
  translateStatus(status: string) {
    const map: any = { 'Pending': '待審核', 'Approved': '已核准', 'Rejected': '已駁回' };
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