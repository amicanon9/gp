import { ApiService } from 'app/_services/api.service';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { catchError, finalize, map } from 'rxjs/operators';
import { HttpErrorResponse, HttpEventType, HttpResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, pipe } from 'rxjs';
import { isRegularExpressionLiteral } from 'typescript';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit {
  @ViewChild("fileUpload", { static: false })
  fileUpload: ElementRef;
  files = [];
  @Input() pi_number: number;
  data: any;
  version: string;
  versions = Array.from(Array(26)).map((e, i) => i + 65).map(x => String.fromCharCode(x));
  cloudfiles: string[];
  constructor(
    private apiSvc: ApiService,
    private snackbar: MatSnackBar,
    private toastr: ToastrService,
  ) {
    this.version = 'A'
  }

  ngOnInit(): void {
    this.onLoad();
  }
  onLoad() {
    this.files = [];
    this.data = {
      pi_number: this.pi_number,
      version: this.version
    }
    this.apiSvc.getProformaInvoicesFileList(this.data).subscribe(x => {
      if (x) {
        this.cloudfiles = x.result
      }
    })
  }
  onClick() {
    const fileUpload = this.fileUpload.nativeElement; fileUpload.onchange = () => {
      for (let index = 0; index < fileUpload.files.length; index++) {
        const files = fileUpload.files[index];
        var reader = new FileReader();

        reader.readAsDataURL(files);
        reader.onload = (event) => {
          this.files.push({
            files: files,
            pi_number: this.pi_number,
            version: this.version,
            category: 'pi',
            inProgress: false,
            progress: 0,
          })
        }
      }
    };
    fileUpload.click();
  }
  uploadFiles() {
    this.fileUpload.nativeElement.value = '';
    this.files.forEach(file => {
      this.upload(file);
    });
  }
  upload(file) {
    const formData = new FormData();
    formData.append('files', file.files);
    formData.append('pi_number', file.pi_number);
    formData.append('version', file.version);
    formData.append('category', 'pi');
    file.inProgress = true;
    this.apiSvc.uploadProformaInvoicesFile(formData).pipe(
      map(event => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            file.progress = Math.round(event.loaded * 100 / event.total);

            break;
          case HttpEventType.Response:
            return event;
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status >= 200 && error.status <= 226) {
          if (this.files.find(a => a.status == 0) == undefined) {
            this.snackbar.open('上傳成功。', '確定', { duration: 3000 })
          }

        } else {
          this.snackbar.open('上傳失敗，請確認場所地點是否已選擇及網路連線狀態。', '確定', { duration: 3000 })
          file.progress = 0
        }
        return of(`${file.data.name} 上傳失敗`);
      })).subscribe(x => x ? this.onLoad() : null);
  }
  onchange() {
    this.files = []
    this.onLoad()
  }
  download(name) {
    this.apiSvc.downloadProformaInvoicesFile({
      file_name: name,
      pi_number: this.pi_number,
      version: this.version
    }).subscribe(res => {
      console.log(res.body);
      const blob = new Blob([res.body], { type: '*' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.setAttribute('style', 'display: none');
      a.href = url;
      a.download = name;
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove(); // remove the element
    })
  }
  delete(name) {
    const ref = this.snackbar.open(`你確定要刪除${name}嗎?`, '確定', { duration: 3000, panelClass: ['alert-danger', 'alert'], });
    ref.onAction().subscribe(() => {
      this.apiSvc.deleteProformaInvoicesFile({
        file_name: name,
        pi_number: this.pi_number,
        version: this.version
      }).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status == 200) {

          } else {
            this.snackbar.open('刪除失敗，請確認場所地點是否已選擇及網路連線狀態。', '確定', { duration: 3000 })
          }
          return of(`${name} 刪除失敗`);
        }),
        finalize(() => {
          this.onLoad();
        })
      ).subscribe((e: any) => {
        if (e.result == "刪除成功") {
          this.toastr.success(
            '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
            '刪除成功'
            + '</span>',
            "",
            {
              timeOut: 3000,
              closeButton: true,
              enableHtml: true,
              toastClass: "alert alert-success alert-with-icon",
              positionClass: "toast-top-center"
            }
          );
        }
      });
    });
  }
  cancel(index) {
    this.files.splice(index, 1);
    const fileUpload = this.fileUpload.nativeElement;
    fileUpload.value = '';
    fileUpload.onchange = () => {
      console.log("HELLO");
    }
  }
}
