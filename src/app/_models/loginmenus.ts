export interface LoginMenus {
  id: number;
  name: string;
  menus: Menus[];
}
export interface Menus {
  id: number;
  name: string;
  description: string;
  children: Children[];
}
export interface Children {
  id: number;
  name: string;
  description: string;
  url: string;
  icon: string;
}
