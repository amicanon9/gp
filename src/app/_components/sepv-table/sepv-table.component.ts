import { Component, EventEmitter, forwardRef, Input, AfterViewInit, OnChanges, OnInit, Output, SimpleChanges, TemplateRef, ViewChild } from "@angular/core";
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
  templateRef: string;
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
export class TableComponent implements OnInit, AfterViewInit, OnChanges {
  selectedId: number = -1;
  innerDataSource: any;
  permissionMap = {
    1: '查看',
    2: '新增',
    3: '新增與編輯',
    4: '完整功能'
  };
  weekbtn = { name: '編輯週報', type: 'weekly_report' };

  @Input() statusConfig: any = {};
  @Input() translate_table: Map<string, string> | null = null;
  @Input() maxTableHeight!: string;
  @Input() minTableHeight!: string;
  @Input() config!: NamiTableConfig | any;
  @Input() templateRef!: TemplateRef<any>[];
  @Input() disabled!: boolean;
  @Input() search!: string;
  @Input() status: any;
  @Input() stype: any = {
    name: '狀態',
    key: 'status'
  };
  @Input() stype_filter: string = "";
  @Output() stype_filterChange = new EventEmitter<string>();
  @Output() select = new EventEmitter<any>();
  @Output() detailClick = new EventEmitter<any>();
  @Output() actionClick = new EventEmitter<{ btn: any, row: any, weekitem?: any }>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  @Input() dataSource!: any;
  @Input() displayedColumns!: string[];

  translate_back: Map<string, string> | null = null;
  compareById = (a: any, b: any) => +a === +b;
  temp_data: string[] = [];

  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    // 不在這裡處理 dataSource，統一由 ngOnChanges 處理
  }

  ngAfterViewInit() {
    // View 初始化完成後綁定 sort
    if (this.innerDataSource) {
      this.innerDataSource.sort = this.sort;
      this.innerDataSource.paginator = this.paginator;
      this.setSortingAccessor(this.innerDataSource);
    }
  }

  // 統一的排序設定，抽成共用 function
  private setSortingAccessor(ds: MatTableDataSource<any>) {
    ds.sortingDataAccessor = (item: any, property: string) => {
       const column = this.config.columns.find((c: any) => c.name === property);
      switch (property) {
        case 'ags':
          return item.ags_status || '';
        default:
          if (column?.templateRef === 'dynamic_week_content') {
          const weekData = this.getProjectWeekContent(item.week_data, column.displayName);
          return weekData?.content || '';  // 用 ags_status 排序，也可以改成 content
        }
          return item[property] ?? '';
      }
    };
  }

  // 每次點排序箭頭時重新確保 sortingDataAccessor 存在
  onSortChange() {
    if (this.innerDataSource) {
      this.setSortingAccessor(this.innerDataSource);
    }
  }

  ToDetail(btn: any, row: any, weekitem?: any) {
    if (btn.url) {
      this.router.navigate([btn.url], { queryParams: { id: btn.id } });
    } else {
      this.actionClick.emit({ btn: btn, row: row, weekitem: weekitem });
    }
  }

  getValue(element: any, colName: string) {
    if (!element || !colName) return '';
    return colName.split('.').reduce((obj, key) => (obj ? obj[key] : ''), element);
  }

  exportToExcel() {
    const filteredData = this.filterStatus();

    if (!filteredData || filteredData.length === 0) {
      alert('沒有符合條件的資料可匯出');
      return;
    }

    const exportData = filteredData.map(row => {
      const newRow: any = {};
      this.config.columns.forEach(col => {
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
    let test = this.innerDataSource as MatTableDataSource<any>;
    let filtered = this.temp_data.filter(data => data[this.stype.pk_key] == this.stype_filter);

    if (filtered.length === 0) {
      filtered = this.temp_data.filter(data => this.stype_filter === "" || data[this.stype.pk_key] == this.stype_filter);
    }
    test.data = JSON.parse(JSON.stringify(filtered));

    if (this.stype_filter === "") {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { id: null },
        queryParamsHandling: 'merge',
      });
    } else {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { id: this.stype_filter },
        queryParamsHandling: 'merge',
      });
      this.stype_filterChange.emit(this.stype_filter);
    }
    return test.data;
  }

  applyFilter(value: string) {
    if (!this.innerDataSource) {
      return;
    }

    const filterValue = value || '';

    this.innerDataSource.filterPredicate = (data: any, filter: string) => {
      if (!filter) return true;

      const keywords = filter.replace(/，/g, ',').split(',').map(k => k.trim().toLowerCase()).filter(k => k !== '');

      const dataStr = Object.keys(data)
        .map(key => data[key])
        .join(' ')
        .toLowerCase();

      return keywords.every(keyword => dataStr.includes(keyword));
    };

    this.innerDataSource.filter = filterValue.trim().toLowerCase();
  }

  stripHtml(html: string): string {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  ngOnChanges(changes: SimpleChanges): void {

    if (changes.search) {
      const currentValue = changes.search.currentValue;
      this.applyFilter(currentValue !== undefined ? currentValue : '');
    }

    if (this.translate_table !== null) {
      this.translate_back = this.reverseMap(this.translate_table);
    }

    if (changes.config) {
      if (this.config) {
        if (this.config.checkable !== true || this.disabled) {
          this.displayedColumns = [...this.config.columns.filter((a: any) => a.inVisible !== true).map((a: any) => a.name)];
        } else {
          this.displayedColumns = ['checkbox', ...this.config.columns.filter((a: any) => a.inVisible !== true).map((a: any) => a.name)];
        }
      } else {
        this.displayedColumns = [];
      }
    }

    if (changes.dataSource) {
      if (this.dataSource) {
        if (this.config.serverSide) {
          // 伺服器端模式：直接使用傳入的實體
          this.innerDataSource = this.dataSource;
        } else {
          // 本地模式：包裝成 MatTableDataSource
          this.innerDataSource = new MatTableDataSource(this.dataSource);
        }

        // 立即設定 sortingDataAccessor
        this.setSortingAccessor(this.innerDataSource);

        // 延遲綁定確保 ViewChild 已初始化
        setTimeout(() => {
          if (this.innerDataSource) {
            this.innerDataSource.paginator = this.paginator;
            this.innerDataSource.sort = this.sort;
            // sort 綁定後再設定一次確保不被覆蓋
            this.setSortingAccessor(this.innerDataSource);
          }
        });

        if (this.translate_table !== null) {
          this.innerDataSource.data.forEach((data: any) => {
            Object.keys(data).forEach(key => {
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
      } else {
        this.selectedId = -1;
        this.select.emit(null);
      }
    }
  }

  goToDetail(detail: any) {
    this.router.navigate([detail.url], {
      queryParams: {
        id: detail.id
      }
    });
  }

  reverseMap(origin: Map<any, any>) {
    return new Map(Array.from(this.translate_table, entry => [entry[1], entry[0]]));
  }

  getProjectWeekContent(projectWeeks: any[], weekKey: string) {
    if (!projectWeeks) return null;
    return projectWeeks.find(w => `${w.year}/W${w.week}` === weekKey);
  }
}