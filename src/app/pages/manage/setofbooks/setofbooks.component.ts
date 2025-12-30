import { ApiService } from 'app/_services/api.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { catchError, finalize, tap } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { TableComponent } from 'app/_components/sepv-table/sepv-table.component';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { throwError } from 'rxjs';
import { SetOfBooks, SetOfBooksTableConfig } from 'app/_models/setofbooks';
import { SetOfBooksModalComponent } from './setofbooks-modal/setofbooks-modal.component';
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SignalrService } from 'app/_services/signalr.service';
@Component({
  selector: 'sepvdb-setofbooks',
  templateUrl: './setofbooks.component.html',
  styleUrls: ['./setofbooks.component.scss']
})
export class SetOfBooksComponent implements OnInit {
  search: string;
  data: any;

  table_config: any = SetOfBooksTableConfig;
  dataSource!: MatTableDataSource<any>;
  subs: any;
  ticket: any;
  maxTableHeight = '700px';
  minTableHeight = 'unset';
  selected: any;
  @ViewChild('namiTable') namiTable!: TableComponent;
  loaded = false;

  constructor(
    private apiSvc: ApiService,
    private modalSvc: NgbModal,
    private toastr: ToastrService,
    private snackbar: MatSnackBar,
    public signalRSvc: SignalrService, 
    ) { }

  ngOnInit() {
    this.signalRSvc.StartConnection()
    this.signalRSvc.ReceiveListener()?.on('books', (data) => {
      this.onDataRefresh();
    })
    this.loadData();
  }

  onSelect($event: any) {
    this.selected = $event;
  }
  onAdd() {
    const modalRef = this.modalSvc.open(SetOfBooksModalComponent, { windowClass: "modal-mySize",backdrop:'static' });
    modalRef.componentInstance.title = "新增公司資訊";
    modalRef.result.then((res: any) => {
      let data: SetOfBooks = res;
      this.apiSvc.createSetOfBooks(data).pipe(
        catchError(err => {
          this.toastr.error(
            '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
            '新增失敗'
            + '</span>',
            "",
            {
              timeOut: 3000,
              closeButton: true,
              enableHtml: true,
              toastClass: "alert alert-error alert-with-icon",
              positionClass: "toast-top-center"
            }
          );
          return throwError(err);
        })
      )
        .subscribe(e=>{
          this.toastr.success(
            '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
            '新增成功'
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
        });
    }).catch(() => { });
  }
  onEdit() {
    const modalRef = this.modalSvc.open(SetOfBooksModalComponent, { windowClass: 'modal-mySize',backdrop:'static' });
    modalRef.componentInstance.title = "編輯公司資訊";
    modalRef.componentInstance.formData = JSON.parse(JSON.stringify(this.selected));
    modalRef.result.then((res: any) => {
      let data: SetOfBooks = res;
      console.log(data);
      this.apiSvc.updateSetOfBooks(this.selected.book_id,data).pipe(
        catchError(err => {
          this.toastr.error(
            '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
            '編輯失敗'
            + '</span>',
            "",
            {
              timeOut: 3000,
              closeButton: true,
              enableHtml: true,
              toastClass: "alert alert-error alert-with-icon",
              positionClass: "toast-top-center"
            }
          );
          return throwError(err);
        })
      ).subscribe(e=>{
        this.toastr.success(
          '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
          '編輯成功'
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
     );
    }).catch(() => { });
  }
  onDelete() {
    const ref = this.snackbar.open('你確定要刪除嗎?', '確定', {
  duration: 3000,
  panelClass: ['alert-danger', 'alert'],
  verticalPosition: 'top',         // 加這行：top、bottom（預設）
  horizontalPosition: 'center',    // 可選：start、center、end、left、right
});    ref.onAction().subscribe(() => {
      this.apiSvc.deleteSetOfBooks(this.selected.book_id).pipe(
        catchError(err => {
          this.toastr.error(
            '<span data-notify="icon" class="nc-icon nc-bell-55"></span><span data-notify="message">' +
            '刪除失敗'
            + '</span>',
            "",
            {
              timeOut: 3000,
              closeButton: true,
              enableHtml: true,
              toastClass: "alert alert-error alert-with-icon",
              positionClass: "toast-top-center"
            }
          );
          return throwError(err);
        })
      ).subscribe(e => {
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
      );
    })
  }
  onDataRefresh() {
    this.selected = null;
    this.loadData()
  }
  loadData() {
    this.apiSvc.getSetOfBooks()
    .pipe(
      tap((data: SetOfBooks[]) => {
        this.dataSource = new MatTableDataSource<any>(data);
        this.loaded = true;
      })
    )
    .subscribe()
  }

}
