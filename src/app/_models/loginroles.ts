export interface LoginRoles {
  id?: number;
  role_name: string;
  description: string;
  disabled: boolean;
  book_id: number;
  company_name:string;
  is_admin: boolean;
}
export const LoginRolesTableConfig = {
  checkable: true,
  serverSide: true,
  sort: {
    active: true,
    direction: 'desc',
    diableClear: true
  },
  columns: [
    // { name: 'id', displayName: '角色ID' },
    { name: 'role_name', displayName: '角色名稱' },
    { name: 'description', displayName: '說明', width: 200 },
    { name: 'company_name', displayName: '所屬' },
    { name: 'menus', displayName: '目錄權限', templateRef:'menus' },
    { name: 'disabled', displayName: '是否停用', templateRef: 'disabled' },
    { name: 'permissions', displayName: '功能權限',templateRef: 'permissions'},
    { name: 'is_admin', displayName: '最高權限', templateRef: 'boolean' }
  ]
}
