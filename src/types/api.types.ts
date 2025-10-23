// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
  }
  
  // Authentication Types
  export interface LoginModel {
    email: string;
    password: string;
  }
  
  export interface RegisterModel {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }
  
  export interface AuthResponse {
    token: string;
    expiration: string;
    userId: string;
    role: string;
  }
  
  // User Types
  export interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    role: string;
  }
  
  export interface UpdateProfileModel {
    firstName: string;
    lastName: string;
    email: string;
  }
  
  export interface ChangePasswordModel {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }
  
  // Address Types
  export interface Address {
    id: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }
  
  export interface AddressModel {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }
  
  // Bank Card Types
  export interface BankCard {
    id: string;
    cardNumber: string;
    nameOnCard: string;
    expiryMonth: number;
    expiryYear: number;
    isDefault: boolean;
  }
  
  export interface BankCardModel {
    cardNumber: string;
    nameOnCard: string;
    expiryMonth: number;
    expiryYear: number;
    cvv: string;
    isDefault: boolean;
  }
  
  // Product Types
  export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    category: string;
    imageUrl: string;
    shopId: string;
    variants: ProductVariant[];
  }
  
  export interface ProductVariant {
    id: string;
    name: string;
    price: number;
    stockQuantity: number;
    productId: string;
  }
  
  export interface ProductModel {
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    category: string;
    shopId: string;
  }
  
  // Shop Types
  export interface Shop {
    id: number;
    shopName: string;
    shopType: string;
    mangrID: number;
    mallID: number;
    image?: string;
  }
  
  export interface ShopModel {
    name: string;
    description: string;
    mallId: string;
  }
  
  // Mall Types
  export interface Mall {
    id: string;
    name: string;
    description: string;
    logo: string;
    banner: string;
    ownerId: string;
    isActive: boolean;
  }
  
  export interface MallModel {
    name: string;
    description: string;
  }
  
  // Cart Types
  export interface CartItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    imageUrl: string;
    variantId?: string;
    variantName?: string;
  }
  
  export interface AddToCartModel {
    productId: string;
    quantity: number;
    variantId?: string;
  }
  
  // Order Types
  export interface Order {
    id: string;
    orderNumber: string;
    orderDate: string;
    status: string;
    totalAmount: number;
    userId: string;
    items: OrderItem[];
    shippingAddress: Address;
    paymentMethod: BankCard;
  }
  
  export interface OrderItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    variantId?: string;
    variantName?: string;
  }
  
  export interface CheckoutModel {
    addressId: string;
    bankCardId: string;
  }
  
  // Packager Types
  export interface Packager {
    id: string;
    name: string;
    description: string;
    contactEmail: string;
    contactPhone: string;
    shopId: string;
  }
  
  export interface PackagerModel {
    name: string;
    description: string;
    contactEmail: string;
    contactPhone: string;
    shopId: string;
  }
  
  // Pagination Types
  export interface PaginatedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
  }
  
  export interface PaginationParams {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }