import { Invoices } from 'app/_models/invoices';
export interface ProformaInvoices {
  id?: number;
  organization_id: number;
  // 後端填寫
  pi_number?: number;
  cust_id: number;
  cust_name: string;
  // editable
  status_id: string;
  status: string;
  currency_id: number;
  // editable
  amount: number;
  // editable
  description?: string;
  pi_date: Date;

  // not addable and editable
  created_by?: string;
  created_by_id?: number;
  created_time?: Date;
  updated_by?: string;
  updated_by_id?: number;
  updated_time?: Date;
  organization_name: string;
  customer_name: string;
  currency: string;
  invoices: Invoices[];

  pi_remain_amount: number;
  invoices_amount: number;
}
export const ProformaInvoicesTableConfig = {
  checkable: true,
  serverSide: true,
  sort: {
    active: true,
    direction: 'desc',
    diableClear: true
  },
  columns: [
    // { name: 'id', displayName: 'id' },
    { name: 'pi_number', displayName: '報價單編號' },
    { name: 'pi_date', displayName: '日期', templateRef: 'date' },
    { name: 'organization_name', displayName: '單位名稱' },
    { name: 'cust_id', displayName: '客戶編號' },
    { name: 'cust_name', displayName: '客戶名稱', width: 200 },
    // { name: 'organization_id', displayName: 'organization_id' },
    // { name: 'cust_id', displayName: 'cust_id' },
    { name: 'status', displayName: '狀態' },
    // { name: 'currency_id', displayName: 'currency_id' },
    { name: 'amount', displayName: '金額(含稅)',templateRef:'number' },
    { name: 'invoices_amount', displayName: '已開立金額', templateRef: 'number' },
    { name: 'pi_remain_amount', displayName: '未開立金額', templateRef: 'number' },
    { name: 'currency', displayName: '幣別' },
    { name: 'description', displayName: '說明', width: 300 },
    { name: 'contract', displayName: '合約',templateRef:'number' },

    { name: 'created_time', displayName: '建立時間', templateRef: 'date_long' },
    { name: 'created_by', displayName: '建立者' },
    { name: 'updated_time', displayName: '更新時間', templateRef: 'date_long' },
    { name: 'updated_by', displayName: '更新者' },
  ]
}
