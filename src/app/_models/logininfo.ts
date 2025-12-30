export interface LoginInfo {
  id?: number;
  book_id: number;
  username: string;
  password?: string;
  description?: string;
  disabled: boolean;
  company_name: string;
  roles: any[];
}
export const LoginInfoTableConfig = {
  checkable: true,
  serverSide: true,
  sort: {
    active: true,
    direction: 'desc',
    diableClear: true
  },
  columns: [
    // { name: 'id', displayName: '使用者ID' },
    { name: 'username', displayName: '使用者名稱' },
    { name: 'description', displayName: '說明' },
    { name: 'company_name', displayName: '所屬' },
    { name: 'roles', displayName: '角色職位', templateRef: 'roles' },
    { name: 'disabled', displayName: '是否停用', templateRef:'disabled'},
  ]
}
