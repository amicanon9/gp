export interface Invoices {
  id?: number;
  // 後端填寫
  invoice_number?: string;
  invoice_date: Date;
  description?: string;
  currency_id: number;
  amount: number;
  status_id: string;
  pi_id: number;
  status: string;
  currency: string;
  notify:boolean;
  notify_date?:Date;
  created_by?: string;
  created_by_id?: number;
  created_time?: Date;
  updated_by?: string;
  updated_by_id?: number;
  updated_time?: Date;
  pi_number: string;
  customer_id: string;
  customer_name: string;
}
export const InvoicesTableConfig = {
  checkable: true,
  serverSide: true,
  sort: {
    active: true,
    direction: 'desc',
    diableClear: true
  },
  columns: [
    { name: 'invoice_number', displayName: '發票編號' },
    { name: 'invoice_date', displayName: '日期', templateRef: 'date' },
    { name: 'status', displayName: '狀態' },
    { name: 'pi_number', displayName: '報價單編號' },
    { name: 'customer_id', displayName: '客戶編號' },
    { name: 'customer_name', displayName: '客戶名稱', width: 200 },
    { name: 'amount', displayName: '發票金額', templateRef: 'number' },
    { name: 'currency', displayName: '幣別' },
    { name: 'notify', displayName: '通知啟用', templateRef: 'boolean'  },
    { name: 'notify_date', displayName: '通知日期', templateRef: 'date' },
    { name: 'description', displayName: '說明', width: 300 },
    { name: 'created_time', displayName: '建立時間', templateRef: 'date_long' },
    { name: 'created_by', displayName: '建立者' },
    { name: 'updated_time', displayName: '更新時間', templateRef: 'date_long' },
    { name: 'updated_by', displayName: '更新者' },
  ]
}
