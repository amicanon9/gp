export interface Organizations {
  organization_id: number;
  book_id: number;
  name: string;
  description?: string;
  company_name?: string;
}
export const OrganizationsTableConfig = {
  checkable: true,
  serverSide: true,
  sort: {
    active: true,
    direction: 'desc',
    diableClear: true
  },
  columns: [
    { name: 'organization_id', displayName: '組織ID' },
    { name: 'name', displayName: '單位名稱' },
    { name: 'company_name', displayName: '公司名稱' },
    { name: 'description', displayName: '說明' }
  ]
}
