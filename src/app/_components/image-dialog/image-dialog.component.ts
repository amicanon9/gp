import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { HttpEventType, HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DomSanitizer } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { formatDate } from '@angular/common';
import { ApiService } from 'app/_services/api.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-image-dialog',
  templateUrl: './image-dialog.component.html',
  styleUrls: ['./image-dialog.component.scss']
})
export class ImageDialogComponent implements OnInit {
  @ViewChild("fileUpload", { static: false }) fileUpload: ElementRef;

  @Input() id: number;              // 關聯 ID
  @Input() controllerName: string = 'FileProcessor';  // 如 'TaskMaster'
  @Input() category: string;        // 如 'task'
  files = [];              // 待上傳
  imgURL: any[] = [];      // 雲端圖檔 Blob URL
  dataname: any[] = [];    // 雲端檔名清單
  imageObject: any[] = []; // 給燈箱用的最終清單
  
  showFlag: boolean = false;
  selectedImageIndex: number = -1;
  namedate: string;
  repeat: any[] = [];
  
  constructor(
    private apiSvc: ApiService, 
    private sanitizer: DomSanitizer,
    private snackbar: MatSnackBar,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.onLoad();
  }

  // 1. 初始化讀取
  onLoad() {
    if (!this.id) return;
    this.imgURL = [];
    this.imageObject = [];
    
    // 取得檔案清單
    this.apiSvc.getimagelist(this.controllerName, this.category, this.id).subscribe(res => {
      this.dataname = res || [];
      
      // 逐一抓取圖片 Blob (確保授權過得去)
      this.dataname.forEach((fileInfo, i) => {
        this.apiSvc.downloadFile(this.controllerName, this.id, this.category, fileInfo.name).subscribe(data => {
          const blobUrl = URL.createObjectURL(data.body);
          this.imgURL[i] = blobUrl;
          this.syncImageObject(); // 每次抓完圖就更新一次燈箱清單
        });
      });
    });
  }
  public async manualUpload(newId: number): Promise<boolean> {
  this.id = newId; // 更新 ID，確保上傳路徑正確
  
  if (this.files.length === 0) return true;

  // 使用 Promise 確保所有檔案上傳完成才回傳
  const uploadTasks = this.files.map(fileItem => {
    const formData = new FormData();
    const finalName = fileItem.namedate + fileItem.data.name;
    formData.append('files', fileItem.data, finalName);
    
    return this.apiSvc.uploadFiles(this.controllerName, this.id, this.category, formData).toPromise();
  });

  try {
    await Promise.all(uploadTasks);
    this.files = []; // 清空待上傳列表
    return true;
  } catch (err) {
    this.toastr.error("部分圖片上傳失敗");
    return false;
  }
}
  // 2. 同步燈箱顯示物件 (合併已上傳與待上傳)
  syncImageObject() {
    const cloudPart = this.imgURL.map((url, i) => ({
      image: url,
      thumbImage: url,
      title: this.dataname[i]?.name,
      alt: 'cloud_img'
    }));
    
    const localPart = this.files.map(f => ({
      image: f.url,
      thumbImage: f.url,
      title: f.namedate + f.data.name,
      alt: 'local_img'
    }));

    this.imageObject = [...cloudPart, ...localPart];
  }

  showLightbox(index: number) {
    this.selectedImageIndex = index;
    this.showFlag = true;
  }

  closeEventHandler() {
    this.showFlag = false;
  }

  // 3. 點擊選擇圖片
  onClick() {
    const el = this.fileUpload.nativeElement;
    el.onchange = () => {
      for (let i = 0; i < el.files.length; i++) {
        const file = el.files[i];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event: any) => {
          this.namedate = formatDate(new Date(), 'yyyyMMddHHmm', 'en') + '_';
          if (!this.files.find(a => a.data.name === file.name)) {
            this.files.push({ 
              data: file, 
              inProgress: false, 
              progress: 0, 
              url: event.target.result, 
              namedate: this.namedate, 
              status: 0 
            });
            this.syncImageObject();
          }
        };
      }
      el.value = '';
    };
    el.click();
  }

  // 4. 上傳邏輯
  uploadFiles() {
    this.files.forEach(fileItem => {
      if (fileItem.status === 1) return;

      const formData = new FormData();
      const finalName = fileItem.namedate + fileItem.data.name;
      formData.append('files', fileItem.data, finalName);

      fileItem.inProgress = true;
      this.apiSvc.uploadFiles(this.controllerName, this.id, this.category, formData).pipe(
        map(event => {
          if (event.type === HttpEventType.UploadProgress) {
            fileItem.progress = Math.round(event.loaded * 100 / event.total);
          }
          return event;
        }),
        catchError(() => {
          this.snackbar.open('上傳失敗', '確定', { duration: 2000 });
          fileItem.inProgress = false;
          return of(null);
        })
      ).subscribe(res => {
        if (res?.type === HttpEventType.Response) {
          fileItem.status = 1;
          this.toastr.success(`${fileItem.data.name} 上傳成功`);
          if (this.files.every(f => f.status === 1)) {
            this.onLoad(); // 全部傳完刷新列表
            this.files = [];
          }
        }
      });
    });
  }
  deleteCloudFile(fileName: string) {
    const ref = this.snackbar.open(`確定要從雲端刪除 ${fileName} 嗎?`, '確定', {
      duration: 5000,
      panelClass: ['alert-danger', 'alert'],
      verticalPosition: 'top',
      horizontalPosition: 'center',
    });
  ref.onAction().subscribe(() => {
    this.apiSvc.deleteFile(this.controllerName, this.id, this.category, fileName).subscribe(() => {
      this.toastr.success("檔案已刪除");
      this.onLoad(); // 重新載入列表與 imgURL
    });
  });
}
  cancel(index: number) {
    this.files.splice(index, 1);
    this.syncImageObject();
  }

  sanitize(url: string) {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }
}