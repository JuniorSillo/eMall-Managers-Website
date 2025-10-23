export interface User {
    id: number;
    name: string;
    surname: string;
    email: string;
    contacts: string;
    gender: string;
    type: 'ShopManager' | 'MallManager' | 'Customer';
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface RegisterData {
    name: string;
    surname: string;
    gender: string;
    contacts: string;
    email: string;
    password: string;
    type: string;
  }
  
  export interface Product {
    id: number;
    prod_Name: string;
    prod_Desc: string;
    prod_Categ: string;
    prod_Subcateg: string;
    price: number;
    prod_Weight: string;
    quantity: number;
    shopId: number;
    imageUrl?: string;
    variants?: ProductVariant[];
  }
  
  export interface ProductVariant {
    id: number;
    name: string;
    value: string;
  }
  
  export interface Shop {
    id: number;
    shopName: string;
    shopType: string;
    mangrID: number;
    mallID: number;
    imageUrl?: string;
  }
  
  export interface Mall {
    id: number;
    mallName: string;
    mallAddr: string;
    mallContacts: string;
    mallManagerID: number;
    imageUrl?: string;
  }
  
  export interface Packager {
    id: number;
    name: string;
    contacts: string;
    email: string;
    shopId: number;
    storeName: string;
    type: string;
  }
  