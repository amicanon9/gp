export interface SetOfBooks {
  book_id: number;
  name: string;
  description?: string;
}

export const SetOfBooksTableConfig = {
  checkable: true,
  serverSide: true,
  sort: {
    active: true,
    direction: 'desc',
    diableClear: true
  },
  columns: [
    { name: 'book_id', displayName: 'ID' },
    { name: 'name', displayName: '所屬' },
    { name: 'description', displayName: '說明' }
  ]
}
