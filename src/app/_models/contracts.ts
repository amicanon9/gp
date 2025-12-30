export interface Contracts {
  id: number;
  contract_number: string;
  pi_id: number;
  pi_number: number;
  start_date: Date;
  end_date: Date;
  description: string;
  created_by_id: number;
  created_by: string;
  created_time: Date;
  updated_by_id: number;
  updated_by: string;
  updated_time: Date;
  customer_id: string;
  customer_name: string;
}
export const ContractsTableConfig = {
  checkable: true,
  serverSide: true,
  sort: {
    active: true,
    direction: 'desc',
    diableClear: true
  },
  columns: [
    { name: 'contract_number', displayName: '合約編號' },
    { name: 'pi_number', displayName: '報價單編號' },
    { name: 'customer_id', displayName: '客戶編號' },
    { name: 'customer_name', displayName: '客戶名稱', width: 200 },
    { name: 'status', displayName: '狀態' },
    { name: 'start_date', displayName: '開始日期', templateRef: 'date'},
    { name: 'end_date', displayName: '結束日期', templateRef: 'date'},
    { name: 'description', displayName: '說明' },
    { name: 'created_time', displayName: '建立時間', templateRef: 'date_long' },
    { name: 'created_by', displayName: '建立者' },
    { name: 'updated_time', displayName: '更新時間', templateRef: 'date_long' },
    { name: 'updated_by', displayName: '更新者' },
  ]
}
