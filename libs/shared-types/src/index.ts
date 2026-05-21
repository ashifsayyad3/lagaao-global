// ─── Shared DTOs and interfaces used by both frontend and backend ─

export interface PaginatedResponse<T> {
  success: boolean;
  data:    T[];
  meta: {
    page:       number;
    limit:      number;
    total:      number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?:   T;
  message?: string;
}

// User
export interface UserDTO {
  id:        number;
  name:      string;
  email:     string;
  phone?:    string;
  role:      'customer' | 'vendor' | 'admin' | 'super_admin';
  avatar?:   string;
  createdAt: string;
}

// Product
export interface ProductDTO {
  id:          number;
  name:        string;
  slug:        string;
  description: string;
  price:       number;
  salePrice?:  number;
  sku:         string;
  stock:       number;
  images:      string[];
  category:    CategoryDTO;
  brand?:      BrandDTO;
  rating:      number;
  reviewCount: number;
  tags:        string[];
  createdAt:   string;
}

// Category
export interface CategoryDTO {
  id:       number;
  name:     string;
  slug:     string;
  image?:   string;
  parentId: number | null;
}

// Brand
export interface BrandDTO {
  id:    number;
  name:  string;
  slug:  string;
  logo?: string;
}

// Order
export interface OrderDTO {
  id:          number;
  orderNumber: string;
  status:      OrderStatus;
  items:       OrderItemDTO[];
  total:       number;
  createdAt:   string;
}

export type OrderStatus =
  | 'pending' | 'confirmed' | 'processing' | 'shipped'
  | 'delivered' | 'cancelled' | 'refunded';

export interface OrderItemDTO {
  productId:   number;
  productName: string;
  image:       string;
  quantity:    number;
  price:       number;
}
