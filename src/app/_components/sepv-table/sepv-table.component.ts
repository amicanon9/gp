import { Component, EventEmitter, forwardRef, Input, OnChanges, OnInit, Output, SimpleChanges, TemplateRef, ViewChild } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from "@angular/router";
import * as XLSX from 'xlsx';

export interface NamiTableConfig {
  sort?: NamiTableSort;
  serverSide?: boolean;
  checkable?: boolean;
  columns: NamiTableColumns[];
  templateRef:string;
}

export interface NamiTableSort {
  active: string;
  direction: 'asc' | 'desc';
  disableClear?: boolean;
}

export interface NamiTableColumns {
  name: string;
  displayName?: string;
  inVisible?: boolean;
  sticky?: boolean;
  stickyEnd?: boolean;
  sortable?: boolean;
}

@Component({
  selector: 'sepv-table',
  templateUrl: './sepv-table.component.html',
  styleUrls: ['./sepv-table.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TableComponent),
      multi: true
    }
  ]
})
export class TableComponent implements OnInit, OnChanges {
  selectedId: number = -1;
  innerDataSource: any;
  permissionMap = {
    1: '查看',
    2: '新增',
    3: '新增與編輯',
    4: '完整功能'
  };
  @Input() statusConfig: any = {};
  @Input() translate_table: Map<string, string> | null = null;
  @Input() maxTableHeight!: string;
  @Input() minTableHeight!: string;
  @Input() config!: NamiTableConfig | any;
  @Input() templateRef!: TemplateRef<any>[];
  @Input() disabled!: boolean;
  @Input() search!: string;
  @Input() status: any;
  @Input() stype: any={
    name:'狀態',
    key:'status'
  };
  @Input() stype_filter: string = "";
  @Output() stype_filterChange = new EventEmitter<string>();

  @Output() select = new EventEmitter<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @Output() detailClick = new EventEmitter<any>();

  @Input() dataSource!: any;
  @Input() displayedColumns!: string[];
  @Output() actionClick = new EventEmitter<{btn: any, row: any}>();
  ToDetail(btn: any, row: any) {
  if (btn.url) {
    // 原有的跳轉邏輯
    this.router.navigate([btn.url], { queryParams: { id: btn.id } });
  } else {
    // 丟出事件給父元件處理彈窗
    this.actionClick.emit({ btn: btn, row: row });
  }
}
  translate_back: Map<string, string> | null = null;
  compareById = (a: any, b: any) => +a === +b;


  temp_data: string[] = [];

  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {

  }

  getValue(element: any, colName: string) {
  if (!element || !colName) return '';
  // 支援 a.b.c 的寫法
  return colName.split('.').reduce((obj, key) => (obj ? obj[key] : ''), element);
}
 exportToExcel() {
  const filteredData = this.filterStatus(); // 先過濾

  if (!filteredData || filteredData.length === 0) {
    alert('沒有符合條件的資料可匯出');
    return;
  }
  
  // 用 displayName 當欄位名稱
  const exportData = filteredData.map(row => {
    const newRow: any = {};
    this.config.columns.forEach(col => {
      // 避免是 templateRef 的欄位，這種通常沒直接值
      if (!col.templateRef) {
        newRow[col.displayName] = row[col.name];
      }
    });
    return newRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '資料');
  XLSX.writeFile(workbook, '匯出資料.xlsx');
}




  filterStatus() {
    let test = this.dataSource as MatTableDataSource<any>;
    let filtered = this.temp_data.filter(data => data[this.stype.pk_key] == this.stype_filter);

    if (filtered.length === 0) {
      filtered = this.temp_data.filter(data => this.stype_filter === "" || data[this.stype.pk_key] == this.stype_filter);
    }
    test.data = JSON.parse(JSON.stringify(filtered));
    
     // ✅ 更新 URL 查詢參數
  if (this.stype_filter === "") {
    // 移除 id 參數
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: null },
      queryParamsHandling: 'merge',
    });
  } else {
    // 設定 id 參數為 stype_filter
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: this.stype_filter },
      queryParamsHandling: 'merge',
    });
    this.stype_filterChange.emit(this.stype_filter)
    
  }
    return test.data;
  }
applyFilter(value: string) {
  // 1. 如果 dataSource 還沒準備好，就先跳出，避免噴錯
  if (!this.dataSource) {
    return;
  }

  const filterValue = value || '';
  
  // 2. 定義篩選邏輯
  this.dataSource.filterPredicate = (data: any, filter: string) => {
    console.log(data)
    if (!filter) return true;

    const keywords = filter.replace(/，/g, ',').split(',').map(k => k.trim().toLowerCase()).filter(k => k !== '');

    // 合併 CustomerPLM 的所有欄位進行搜尋
    const dataStr = Object.keys(data)
      .map(key => data[key])
      .join(' ')
      .toLowerCase();

    return keywords.every(keyword => dataStr.includes(keyword));
  };

  // 3. 執行過濾
  this.dataSource.filter = filterValue.trim().toLowerCase();
}
  ngOnChanges(changes: SimpleChanges): void {

    if (changes.search) {
    // 確保即使是 null 也能處理，觸發 applyFilter
      const currentValue = changes.search.currentValue;
      this.applyFilter(currentValue !== undefined ? currentValue : '');
    }
    if (this.translate_table !== null) {
      this.translate_back = this.reverseMap(this.translate_table);
    }

    // Config Change event
    if (changes.config) {
      if (this.config) {
        // Check columns is hidden or banned
        if (this.config.checkable !== true || this.disabled){
          this.displayedColumns = [...this.config.columns.filter((a: any) => a.inVisible !== true).map((a:any) => a.name)];
        }
        else {
          this.displayedColumns = ['checkbox', ...this.config.columns.filter((a: any) => a.inVisible !== true).map((a:any) =>  a.name)];
        }
      }
      else {
        this.displayedColumns = [];
      }
    }

    if (changes.dataSource) {
      if (this.dataSource) {
        if (this.config.serverSide) {
          this.dataSource.sort = this.sort;
          this.dataSource.paginator = this.paginator;
          this.innerDataSource = this.dataSource;
        }
        else {
          this.innerDataSource = new MatTableDataSource(this.dataSource);
          console.log("I am bug");
        }
        if (this.translate_table !== null) {
          this.innerDataSource.data.forEach((data: any) => {
            let keys = Object.keys(data);
            keys.forEach(key => {
              if (this.translate_table.has(data[key])) {
                data[key] = this.translate_table.get(data[key]);
              }
            });
          });
        }
        this.temp_data = JSON.parse(JSON.stringify(this.innerDataSource.data));
        if (this.stype_filter) {
          this.filterStatus();
        }
      }
      this.selectedId = -1;
    }
  }
  onSelect(row: any, i: number) {
    if (!this.disabled) {
      if (this.selectedId !== i) {
        let temp = JSON.parse(JSON.stringify(row));
        if (this.translate_back !== null) {
          let keys = Object.keys(temp);
          keys.forEach(key => {
            if (this.translate_back.has(temp[key]))
              temp[key] = this.translate_back.get(temp[key]);
            });
        }
        this.selectedId = i;
        this.select.emit(temp);
      }
      else {
        this.selectedId = -1;
        this.select.emit(null);
      }
    }
  }
  goToDetail(detail: any) {
    console.log(detail)
     this.router.navigate([detail.url], {
      queryParams: {
        id:detail.id
      }
  });
  }
  reverseMap(origin: Map<any, any>){
    return new Map(Array.from(this.translate_table, entry => [entry[1], entry[0]]));
  }
  // 輔助函式：讓 HTML 根據欄位標題找到對應的週報紀錄
  getProjectWeekContent(projectWeeks: any[], weekKey: string) {
    if (!projectWeeks) return null;
    return projectWeeks.find(w => `${w.year}/W${w.week}` === weekKey);
  }
}
