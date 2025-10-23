export interface User {
  id: number;
  username: string;
  name: string;
  surname: string;
  email: string;
  contacts: string;
  gender: string;
  type: string;
}

export interface UserResponse {
  roleID: number;
  user: {
    uName: string;
    uSurname: string;
    uGender: string;
    uPhone: string;
    uEmail: string;
    uType: string;
  };
}

export interface AuthResponse {
  statusCode: number;
  message: string;
  token?: string;
  data?: any;
}

export interface RegisterManagerData {
  name: string;
  surname: string;
  gender: string;
  contacts: string;
  email: string;
  password?: string; // Made optional for updateManager
  type: string;
  username?: string;
}

export interface Shop {
  id: number;
  shopName: string;
  shopType: string;
  mangrID: number;
  mallID: number;
  managerName: string;
  shopImage?: string;
  imageBase64?: string;
}

export interface Mall {
  mallID: number;
  mallName: string;
  mallAddr: string;
  mallContacts: string;
  mallImage?: string;
  imageBase64?: string;
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
  onSaleOffer?: string;
  type: string;
  variants?: { id: number; size: string; color: string; quantity: number }[];
}