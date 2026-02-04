import { ApiService } from 'app/_services/api.service';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { catchError, map } from 'rxjs/operators';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { environment } from 'environments/environment';

@Component({
  selector: 'file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit {
  @ViewChild("fileUpload", { static: false }) fileUpload: ElementRef;

  @Input() id: number;              // 關聯 ID
  @Input() controllerName: string;  // 如 'TaskMaster'
  @Input() category: string;        // 如 'task'

  files: any[] = [];       // 待上傳列表
  cloudfiles: any[] = [];  // 已在雲端的檔案清單

  constructor(
    private apiSvc: ApiService,
    private snackbar: MatSnackBar,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.onLoad();
  }

  onLoad() {
    if (!this.id || this.id <= 0) return;
    this.files = [];
    this.apiSvc.getTaskList(this.controllerName, this.category, this.id).subscribe(x => {
      this.cloudfiles = x || [];
    });
  }

  // 判斷是否為圖片，用來決定要不要顯示縮圖
  isImage(fileName: string): boolean {
    if (!fileName) return false;
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const ext = fileName.split('.').pop()?.toLowerCase();
    return extensions.includes(ext!);
  }

  // 獲取已上傳圖片的預覽 URL (透過 API 下載端點)
  getCloudPreview(fileName: string): string {
    return `${environment.apiUrl}/${this.controllerName}/${this.id}/images/${this.category}/${fileName}`;
  }

  onClick() {
    const fileUpload = this.fileUpload.nativeElement;
    fileUpload.onchange = () => {
      for (let index = 0; index < fileUpload.files.length; index++) {
        const file = fileUpload.files[index];
        const previewUrl = file.type.startsWith('image/') 
          ? this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file)) 
          : null;

        this.files.push({
          file: file,
          preview: previewUrl,
          progress: 0,
          inProgress: false
        });
      }
      fileUpload.value = '';
    };
    fileUpload.click();
  }

  uploadFiles() {
    this.files.forEach(fileItem => {
      if (!fileItem.inProgress && fileItem.progress === 0) {
        this.upload(fileItem);
      }
    });
  }

  upload(fileItem: any) {
    const formData = new FormData();
    formData.append('files', fileItem.file);
    fileItem.inProgress = true;

    this.apiSvc.uploadFiles(this.controllerName, this.id, this.category, formData).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          fileItem.progress = Math.round(event.loaded * 100 / event.total);
        }
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        this.snackbar.open('上傳失敗', '確定', { duration: 3000 });
        fileItem.inProgress = false;
        fileItem.progress = 0;
        return of(null);
      })
    ).subscribe(result => {
      if (result && result.type === HttpEventType.Response) {
        this.toastr.success("檔案上傳成功");
        this.onLoad();
      }
    });
  }

  download(fileName: string) {
    this.apiSvc.downloadFile(this.controllerName, this.id, this.category, fileName).subscribe(res => {
      const blob = new Blob([res.body], { type: res.headers.get('Content-Type') });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  delete(fileName: string) {
    const ref = this.snackbar.open(`確定要刪除 ${fileName} 嗎?`, '確定', { duration: 3000 });
    ref.onAction().subscribe(() => {
      this.apiSvc.deleteFile(this.controllerName, this.id, this.category, fileName).subscribe(() => {
        this.toastr.info("已刪除檔案");
        this.onLoad();
      });
    });
  }

  cancelSelection(index: number) {
    this.files.splice(index, 1);
  }
}