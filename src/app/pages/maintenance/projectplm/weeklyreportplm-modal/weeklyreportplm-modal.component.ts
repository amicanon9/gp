import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ApiService } from "app/_services/api.service"; 
import { ToastrService } from "ngx-toastr";
import { throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
dayjs.extend(weekOfYear);
@Component({
  selector: 'weeklyreportplm-modal',
  templateUrl: './weeklyreportplm-modal.component.html',
})
export class weeklyreportplmModalComponent implements OnInit {
  @Input() projectId: number = -1;
  @Input() projectName: string = "";
  @Input() title: string = "週報維護";
  @Input() agslist:any;
  @Input() weekitem:any;
  reportList: any[] = [];
  isEdit: boolean = false;
  apiName: string = 'weeklyreportplm'; // 對應後端 Controller 名稱
  quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],        // 粗體、斜體、底線、刪除線
    [{ 'color': [] }, { 'background': [] }],           // 字體顏色、背景色
    [{ 'size': ['small', false, 'large', 'huge'] }],   // 字體大小
    [{ 'font': [] }],                                  // 字體
    [{ 'align': [] }],                                 // 對齊
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],     // 清單
    ['link', 'image'],                                 // 連結、圖片
    ['clean']                                          // 清除格式
  ]
};
  formGroup = this.fb.group({
    id: [0],
    project_id: [-1, [Validators.required]],
    year: [new Date().getFullYear(), [Validators.required]],
    week: [dayjs().week(), [Validators.required]],
    content: [null],
    content_detail: [null],
    ags_status:[null]
  });

  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder,
    private apiSvc: ApiService ,
    private toastr: ToastrService,
    private snackbar: MatSnackBar,
  ) { }

  ngOnInit() {
    if (this.projectId > 0) {
      this.formGroup.patchValue({ project_id: this.projectId });
      if(this.weekitem){
        this.editEntry(this.weekitem);
      }
      this.loadHistory();
    }
  }

  loadHistory() {
    this.apiSvc.getdatabyid(`${this.apiName}`,this.projectId).subscribe(res => {
      res.map(e=>{
        var ags = this.agslist.find(x=>x.code == e.ags_status)
        if(ags){
          e['ags_description']=ags.description
          e['ags']=ags
        }else{
          e['ags_description']=null
          e['ags']=null
        }
    })
      this.reportList = res;
    });
  }

  // 2. 儲存或更新
  submit() {
    if (this.formGroup.valid) {
      const data = this.formGroup.getRawValue();
      
      if (this.isEdit) {
        // 編輯：使用您的 updatedata(name, id, data)
        this.apiSvc.updatedata(this.apiName, data.id.toString(), data).subscribe(() => {
          this.loadHistory();
          this.resetForm();
        });
      } else {
        // 新增：使用您的 createdata(name, data)
        this.apiSvc.createdata(this.apiName, data).subscribe(() => {
          this.loadHistory();
          this.resetForm();
        });
      }
    }
  }

 deleteEntry(id: number) {
  // 使用 MatSnackBar 開啟刪除確認視窗
  const ref = this.snackbar.open('你確定要刪除此週報嗎?', '確定', {
    duration: 3000,
    panelClass: ['alert-danger', 'alert'],
    verticalPosition: 'bottom',
    horizontalPosition: 'center',
  });

  // 當使用者點擊「確定」時執行
  ref.onAction().subscribe(() => {
    this.apiSvc.deletedata(this.apiName, id.toString()).pipe(
      catchError(err => {
        // 使用您現有的 Toast 提示
        this.showErrorToast('刪除失敗，請檢查關聯資料');
        return throwError(err);
      })
    ).subscribe(() => {
      this.showSuccessToast('刪除成功');
      // 刪除成功後重新載入歷史列表
      this.loadHistory();
      
      // 如果剛好正在編輯這一筆，則重置表單
      if (this.formGroup.get('id')?.value === id) {
        this.resetForm();
      }
    });
  });
}

  // 表單重置與編輯模式切換
  editEntry(item: any) {
    this.isEdit = true;
    this.formGroup.patchValue(item);
  }
  private showSuccessToast(msg: string) {
    this.toastr.success(`<span class="nc-icon nc-bell-55"></span> ${msg}`, "", {
      timeOut: 3000, closeButton: true, enableHtml: true,
      toastClass: "alert alert-success alert-with-icon", positionClass: "toast-top-center"
    });
  }

  private showErrorToast(msg: string) {
    this.toastr.error(`<span class="nc-icon nc-bell-55"></span> ${msg}`, "", {
      timeOut: 3000, closeButton: true, enableHtml: true,
      toastClass: "alert alert-error alert-with-icon", positionClass: "toast-top-center"
    });
  }
  resetForm() {
    this.isEdit = false;
    this.formGroup.reset({
      id: 0,
      project_id: this.projectId,
      year: new Date().getFullYear(),
      week: dayjs().week(),
      content: null,
      content_detail:null
    });
  }
}