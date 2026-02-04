import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { HttpEventType, HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { formatDate } from '@angular/common';
import { ApiService } from 'app/_services/api.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'environments/environment';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-image-dialog',
  templateUrl: './image-dialog.component.html',
  styleUrls: ['./image-dialog.component.scss']
})
export class ImageDialogComponent implements OnInit {
  @ViewChild("fileUpload", { static: false }) fileUpload: ElementRef;
  
  // 動態參數
  @Input() id: number;
  @Input() controllerName: string;
  @Input() category: string;

  files = [];          // 準備上傳的檔案
  cloudfiles = [];     // 雲端已有的檔案
  imageObject = [];    // 給 ng-image-fullscreen-view 用的清單
  
  showFlag: boolean = false;
  selectedImageIndex: number = -1;

  constructor(
    private apiSvc: ApiService,
    private sanitizer: DomSanitizer,
    private snackbar: MatSnackBar,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.onLoad();
  }

  // 1. 取得檔案清單並初始化全螢幕物件
  onLoad() {
    if (!this.id) return;
    this.apiSvc.getTaskList(this.controllerName, this.category, this.id).subscribe(res => {
      this.cloudfiles = res || [];
      this.files = [];
      this.refreshImageObject();
    });
  }

  // 刷新 Lightbox 用的圖片物件
  refreshImageObject() {
    this.imageObject = [];
    const apiUrl = environment.apiUrl;

    // 先放雲端的圖
    this.cloudfiles.forEach(f => {
      const url = `${apiUrl}/${this.controllerName}/${this.id}/images/${this.category}/${f.name}`;
      this.imageObject.push({
        image: url,
        thumbImage: url,
        title: f.name,
        alt: f.name
      });
    });

    // 再放還沒上傳但已選取的圖 (Base64)
    this.files.forEach(f => {
      this.imageObject.push({
        image: f.url,
        thumbImage: f.url,
        title: f.data.name,
        alt: f.data.name
      });
    });
  }

  // 顯示全螢幕
  showLightbox(index: number) {
    this.selectedImageIndex = index;
    this.showFlag = true;
  }

  closeEventHandler() {
    this.showFlag = false;
    this.selectedImageIndex = -1;
  }

  // 2. 選擇檔案 (含預覽)
  onClick() {
    const el = this.fileUpload.nativeElement;
    el.onchange = () => {
      const dateStr = formatDate(new Date(), 'yyyyMMddHHmm', 'en') + '_';
      
      for (let i = 0; i < el.files.length; i++) {
        const file = el.files[i];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event: any) => {
          const url = event.target.result;
          if (!this.files.find(a => a.data.name === file.name)) {
            this.files.push({
              data: file,
              url: url,
              namedate: dateStr,
              progress: 0,
              inProgress: false
            });
            this.refreshImageObject();
          }
        };
      }
      el.value = '';
    };
    el.click();
  }

  // 3. 執行上傳
  uploadFiles() {
    this.files.forEach(fileItem => {
      if (fileItem.progress === 100) return;

      const formData = new FormData();
      // 依照你的要求，檔名加上時間戳
      const newName = fileItem.namedate + fileItem.data.name;
      formData.append('files', fileItem.data, newName);

      fileItem.inProgress = true;
      this.apiSvc.uploadFiles(this.controllerName, this.id, this.category, formData).pipe(
        map(event => {
          if (event.type === HttpEventType.UploadProgress) {
            fileItem.progress = Math.round(event.loaded * 100 / event.total);
          }
          return event;
        }),
        catchError(err => {
          this.snackbar.open('上傳失敗', '確定', { duration: 2000 });
          fileItem.inProgress = false;
          return of(null);
        })
      ).subscribe(res => {
        if (res?.type === HttpEventType.Response) {
          this.toastr.success(`${fileItem.data.name} 上傳成功`);
          // 全部傳完後重刷
          if (this.files.every(f => f.progress === 100)) {
            this.onLoad();
          }
        }
      });
    });
  }

  cancel(index: number) {
    this.files.splice(index, 1);
    this.refreshImageObject();
  }

  sanitize(url: string) {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }
}