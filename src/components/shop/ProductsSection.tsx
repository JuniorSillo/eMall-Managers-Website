'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Search, Package, ShoppingBag, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Product {
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

export default function ProductsSection() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All products');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categories, setCategories] = useState<string[]>(['All products']);
  const [shopId, setShopId] = useState<number>(0);
  const [shopType, setShopType] = useState<string>('');
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [newProduct, setNewProduct] = useState<{
    type: string;
    name: string;
    description: string;
    category: string;
    subCategory: string;
    price: string;
    weight: string;
    quantity: string;
    imageFile: File | null;
    onSaleOffer: string;
    variants: { id: number; size: string; color: string; quantity: number }[];
  }>({
    type: 'Pharmacy',
    name: '',
    description: '',
    category: '',
    subCategory: '',
    price: '',
    weight: '',
    quantity: '',
    imageFile: null,
    onSaleOffer: '',
    variants: [],
  });
  const [variant, setVariant] = useState({ size: '', color: '#000000', quantity: '' });
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  useEffect(() => {
    if (loading) return;
    if (!user || !user.id) {
      console.error('[ProductsSection] Invalid or missing user data:', user);
      toast.error('Please log in to access products.');
      router.push('/login');
      return;
    }
    const fetchData = async () => {
      setIsFetching(true);
      setFetchError(null);
      try {
        console.log('[ProductsSection] User from useAuth:', JSON.stringify(user, null, 2));
        const userData = await authAPI.getUserById(user.id);
        console.log('[ProductsSection] getUserById Response:', JSON.stringify(userData, null, 2));
        if (!userData || !userData.roleID) {
          console.error('[ProductsSection] Invalid user data:', userData);
          throw new Error('Invalid user data from API');
        }
        console.log('[ProductsSection] Fetching shop ID for roleID:', userData.roleID);
        const shopIdResponse = await authAPI.getShopByMngrID(userData.roleID);
        console.log('[ProductsSection] getShopByMngrID Response:', JSON.stringify(shopIdResponse, null, 2));
        if (typeof shopIdResponse !== 'number') {
          console.error('[ProductsSection] Invalid shopID:', shopIdResponse);
          throw new Error('Shop ID not found for manager.');
        }
        setShopId(shopIdResponse);
        const shopResponse = await authAPI.getShopByID(shopIdResponse);
        console.log('[ProductsSection] getShopByID Response:', JSON.stringify(shopResponse, null, 2));
        const shopType = shopResponse.dto.shopType || 'General';
        setShopType(shopType);
        // Set category suggestions and fallback categories based on shopType
        const suggestions: { [key: string]: string[] } = {
          Pharmacy: ['Pain Relief', 'Antibiotics', 'Vitamins', 'First Aid', 'Personal Care', 'Health & Pharmacy'],
          'Outdoor Retail': ['Camping Gear', 'Clothing', 'Footwear', 'Backpacks', 'Accessories'],
          General: ['Food', 'Stationary', 'Kitchenware', 'Clothes', 'Beverages', 'Snacks'],
        };
        const fallbackCategories = suggestions[shopType] || suggestions['General'];
        setCategorySuggestions(fallbackCategories);
        setCategories(['All products', ...fallbackCategories]);
        await fetchProducts(shopIdResponse);
      } catch (error: any) {
        console.error('[ProductsSection] Failed to fetch data:', {
          message: error.message || 'Unknown error',
          response: error.response
            ? { status: error.response.status, data: JSON.stringify(error.response.data, null, 2) }
            : 'No response data',
          userId: user?.id,
          timestamp: new Date().toISOString(),
        });
        setFetchError(error.message || 'Failed to load shop data.');
        toast.error(error.message || 'Failed to load shop data.');
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [user, loading, router]);

  const fetchProducts = async (shopId: number) => {
    setIsFetching(true);
    setFetchError(null);
    try {
      const productsResponse = await authAPI.getProducts(shopId);
      console.log('[ProductsSection] getProducts Response:', JSON.stringify(productsResponse, null, 2));
      if (!Array.isArray(productsResponse)) {
        console.error('[ProductsSection] getProducts did not return an array:', productsResponse);
        throw new Error('Invalid products data format.');
      }
      setProducts(productsResponse);
      const uniqueCategories = Array.from(new Set(productsResponse.map((p) => p.prod_Categ)));
      setCategories((prev) => {
        const newCategories = ['All products', ...uniqueCategories];
        // Ensure fallback categories are included if not already present
        const fallback = categorySuggestions.filter((cat) => !newCategories.includes(cat));
        return [...newCategories, ...fallback];
      });
    } catch (error: any) {
      console.error('[ProductsSection] Error fetching products:', {
        message: error.message || 'Unknown error',
        code: error.code,
        response: error.response
          ? { status: error.response.status, data: JSON.stringify(error.response.data, null, 2) }
          : 'No response data',
      });
      setFetchError(error.message || 'Failed to load products. Please try again.');
      toast.error(error.message || 'Failed to load products.');
      setProducts([]);
    } finally {
      setIsFetching(false);
    }
  };

  const validateProductForm = () => {
    if (!newProduct.name) {
      toast.error('Product name is required');
      return false;
    }
    if (!newProduct.price) {
      toast.error('Price is required');
      return false;
    }
    if (!newProduct.category) {
      toast.error('Category is required');
      return false;
    }
    if (newProduct.type !== 'Clothes' && !newProduct.quantity) {
      toast.error('Quantity is required for non-Clothes products');
      return false;
    }
    if (newProduct.type === 'Clothes' && newProduct.variants.length === 0) {
      toast.error('At least one variant is required for Clothes products');
      return false;
    }
    return true;
  };

  const addVariant = () => {
    if (variant.size && variant.color && variant.quantity) {
      setNewProduct({
        ...newProduct,
        variants: [...newProduct.variants, { ...variant, id: Date.now(), quantity: parseInt(variant.quantity) }],
      });
      setVariant({ size: '', color: '#000000', quantity: '' });
    } else {
      toast.error('All variant fields are required');
    }
  };

  const deleteVariant = (id: number) => {
    setNewProduct({
      ...newProduct,
      variants: newProduct.variants.filter((v) => v.id !== id),
    });
  };

  const updateVariant = (id: number, field: string, value: string | number) => {
    setNewProduct({
      ...newProduct,
      variants: newProduct.variants.map((v) =>
        v.id === id ? { ...v, [field]: value } : v
      ),
    });
  };

  const calculateTotalQuantity = () => {
    return newProduct.variants.reduce((sum, v) => sum + Number(v.quantity), 0);
  };

  const handleAddProduct = async () => {
    if (!validateProductForm()) {
      return;
    }
    setIsLoading(true);
    try {
      const productData = new FormData();
      productData.append('Prod_Name', newProduct.name);
      productData.append('Prod_Desc', newProduct.description);
      productData.append('Prod_Categ', newProduct.category === 'Health & Pharmarcy' ? 'Health & Pharmacy' : newProduct.category);
      productData.append('Prod_Subcateg', newProduct.subCategory);
      productData.append('Price', newProduct.price);
      productData.append('Prod_Weight', newProduct.weight);
      productData.append('Quantity', newProduct.type === 'Clothes' ? calculateTotalQuantity().toString() : newProduct.quantity);
      productData.append('ShopId', shopId.toString());
      productData.append('MangrID', user?.id.toString() || '1');
      productData.append('Type', newProduct.type);
      productData.append('varientsJson', JSON.stringify(newProduct.variants));
      if (newProduct.onSaleOffer) {
        productData.append('OnSaleOffer', newProduct.onSaleOffer);
      }
      if (newProduct.imageFile) {
        productData.append('image', newProduct.imageFile);
      }
      const response = await authAPI.uploadProduct(productData);
      console.log('[ProductsSection] uploadProduct Response:', JSON.stringify(response, null, 2));
      if (response.statusCode === 200) {
        const imageUrl = newProduct.imageFile ? URL.createObjectURL(newProduct.imageFile) : undefined;
        const newProductData: Product = {
          id: response.data?.id || Date.now(),
          prod_Name: newProduct.name,
          prod_Desc: newProduct.description,
          prod_Categ: newProduct.category === 'Health & Pharmarcy' ? 'Health & Pharmacy' : newProduct.category,
          prod_Subcateg: newProduct.subCategory,
          price: parseFloat(newProduct.price),
          prod_Weight: newProduct.weight,
          quantity: newProduct.type === 'Clothes' ? calculateTotalQuantity() : parseInt(newProduct.quantity),
          shopId,
          imageUrl: response.data?.imageUrl || imageUrl,
          onSaleOffer: newProduct.onSaleOffer || undefined,
          type: newProduct.type,
          variants: newProduct.type === 'Clothes' ? newProduct.variants : undefined,
        };
        setProducts((prev) => [...prev, newProductData]);
        if (!categories.includes(newProduct.category)) {
          setCategories((prev) => [...prev, newProduct.category]);
        }
        setNewProduct({
          type: shopType || 'Pharmacy',
          name: '',
          description: '',
          category: '',
          subCategory: '',
          price: '',
          weight: '',
          quantity: '',
          imageFile: null,
          onSaleOffer: '',
          variants: [],
        });
        setIsAddProductOpen(false);
        toast.success('Product added successfully!');
      } else {
        console.error('[ProductsSection] Upload product failed:', response);
        toast.error(response.message || 'Failed to add product.');
      }
    } catch (error: any) {
      console.error('[ProductsSection] Error adding product:', {
        message: error.message || 'Unknown error',
        response: error.response
          ? { status: error.response.status, data: JSON.stringify(error.response.data, null, 2) }
          : 'No response data',
      });
      toast.error(error.message || 'Failed to add product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }
    const normalizedCategory = newCategoryName.trim() === 'Health & Pharmarcy' ? 'Health & Pharmacy' : newCategoryName.trim();
    if (categories.includes(normalizedCategory)) {
      toast.error('Category already exists');
      return;
    }
    setCategories((prev) => [...prev, normalizedCategory]);
    setNewCategoryName('');
    setIsAddCategoryOpen(false);
    toast.success('Category added successfully!');
  };

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.prod_Name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All products' || product.prod_Categ === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading || isFetching) {
    return (
      <div className="w-full h-screen flex items-center justify-center py-12">
        <div className="animate-pulse">
          <ShoppingBag className="h-12 w-12 text-green-600" />
          <p className="text-gray-500 mt-2">{loading ? 'Loading authentication...' : 'Loading products...'}</p>
        </div>
      </div>
    );
  }

  if (!user || !user.id) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="space-y-6 w-full">
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-300 rounded-lg shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchProducts(shopId)}
              disabled={isFetching}
              className="flex items-center text-green-600 border-gray-300"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Product</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                <DialogHeader>
                  <DialogTitle className="text-green-700">Add New Product</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Product Info */}
                  <div>
                    <h3 className="text-green-700 font-medium text-lg mb-4">Product Info</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {newProduct.imageFile ? (
                            <img
                              src={URL.createObjectURL(newProduct.imageFile)}
                              alt="Preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="image" className="text-sm">Product Image</Label>
                          <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setNewProduct({
                                ...newProduct,
                                imageFile: e.target.files?.[0] || null,
                              })
                            }
                            className="border-gray-300"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="product-type" className="text-sm">Product Type *</Label>
                        <Select
                          value={newProduct.type}
                          onValueChange={(value) =>
                            setNewProduct({ ...newProduct, type: value, variants: [], quantity: '' })
                          }
                        >
                          <SelectTrigger className="border-gray-300">
                            <SelectValue placeholder="Select product type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={shopType || 'Pharmacy'}>{shopType || 'Pharmacy'}</SelectItem>
                            <SelectItem value="Clothes">Clothes</SelectItem>
                            <SelectItem value="Stationary">Stationary</SelectItem>
                            <SelectItem value="Kitchenware">Kitchenware</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="product-name" className="text-sm">Product Name *</Label>
                        <Input
                          id="product-name"
                          value={newProduct.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewProduct({ ...newProduct, name: e.target.value })
                          }
                          placeholder="Enter product name"
                          className="border-gray-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description" className="text-sm">Description</Label>
                        <Textarea
                          id="description"
                          value={newProduct.description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setNewProduct({ ...newProduct, description: e.target.value })
                          }
                          placeholder="Enter product description"
                          className="border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Variants (Only for Clothes) */}
                  {newProduct.type === 'Clothes' && (
                    <div>
                      <h3 className="text-green-700 font-medium text-lg mb-4">Variants</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="variant-size" className="text-sm">Size</Label>
                            <Select
                              value={variant.size}
                              onValueChange={(value) => setVariant({ ...variant, size: value })}
                            >
                              <SelectTrigger className="border-gray-300">
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                              <SelectContent>
                                {sizes.map((size) => (
                                  <SelectItem key={size} value={size}>
                                    {size}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="variant-color" className="text-sm">Color</Label>
                            <Input
                              id="variant-color"
                              type="color"
                              value={variant.color}
                              onChange={(e) => setVariant({ ...variant, color: e.target.value })}
                              className="border-gray-300 h-10"
                            />
                          </div>
                          <div>
                            <Label htmlFor="variant-quantity" className="text-sm">Quantity</Label>
                            <Input
                              id="variant-quantity"
                              type="number"
                              value={variant.quantity}
                              onChange={(e) => setVariant({ ...variant, quantity: e.target.value })}
                              placeholder="0"
                              min="1"
                              className="border-gray-300"
                            />
                          </div>
                        </div>
                        <Button
                          className="bg-green-600 hover:bg-green-700"
                          onClick={addVariant}
                          disabled={!variant.size || !variant.color || !variant.quantity}
                        >
                          Add Variant
                        </Button>
                        {newProduct.variants.length > 0 && (
                          <div className="mt-4">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="border p-2 text-left">Size</th>
                                  <th className="border p-2 text-left">Color</th>
                                  <th className="border p-2 text-left">Quantity</th>
                                  <th className="border p-2 text-left">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {newProduct.variants.map((v) => (
                                  <tr key={v.id}>
                                    <td className="border p-2">{v.size}</td>
                                    <td className="border p-2">
                                      <div className="flex items-center">
                                        <div
                                          className="w-6 h-6 mr-2"
                                          style={{ backgroundColor: v.color }}
                                        ></div>
                                        {v.color}
                                      </div>
                                    </td>
                                    <td className="border p-2">
                                      <Input
                                        type="number"
                                        value={v.quantity}
                                        onChange={(e) => updateVariant(v.id, 'quantity', parseInt(e.target.value))}
                                        className="border-gray-300 w-20"
                                        min="1"
                                      />
                                    </td>
                                    <td className="border p-2">
                                      <Button
                                        variant="destructive"
                                        onClick={() => deleteVariant(v.id)}
                                      >
                                        Delete
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Categories */}
                  <div>
                    <h3 className="text-green-700 font-medium text-lg mb-4">Categories</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category" className="text-sm">Category *</Label>
                        <Select
                          value={newProduct.category}
                          onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                        >
                          <SelectTrigger className="border-gray-300">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.slice(1).map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="subCategory" className="text-sm">Sub-Category</Label>
                        <Input
                          id="subCategory"
                          value={newProduct.subCategory}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewProduct({ ...newProduct, subCategory: e.target.value })
                          }
                          placeholder="Enter sub-category"
                          className="border-gray-300"
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Suggested categories for {shopType || 'shop'}: {categorySuggestions.join(', ')}
                    </div>
                  </div>
                  {/* Pricing & Inventory */}
                  <div>
                    <h3 className="text-green-700 font-medium text-lg mb-4">Pricing & Inventory</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="quantity" className="text-sm">
                          Quantity * {newProduct.type === 'Clothes' && '(Auto-calculated)'}
                        </Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={newProduct.type === 'Clothes' ? calculateTotalQuantity() : newProduct.quantity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            newProduct.type !== 'Clothes' &&
                            setNewProduct({ ...newProduct, quantity: e.target.value })
                          }
                          placeholder="0"
                          min="1"
                          className="border-gray-300"
                          disabled={newProduct.type === 'Clothes'}
                        />
                      </div>
                      <div>
                        <Label htmlFor="price" className="text-sm">Price (R) *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={newProduct.price}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewProduct({ ...newProduct, price: e.target.value })
                          }
                          placeholder="0.00"
                          min="0.01"
                          className="border-gray-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="weight" className="text-sm">Weight</Label>
                        <Input
                          id="weight"
                          value={newProduct.weight}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewProduct({ ...newProduct, weight: e.target.value })
                          }
                          placeholder="e.g., 500g"
                          className="border-gray-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="onSaleOffer" className="text-sm text-red-500">On-Sale Offer</Label>
                        <Input
                          id="onSaleOffer"
                          value={newProduct.onSaleOffer}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewProduct({ ...newProduct, onSaleOffer: e.target.value })
                          }
                          placeholder="e.g., 20% off"
                          className="border-red-500"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddProductOpen(false)}
                      className="border-gray-300 text-gray-700"
                    >
                      Discard
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleAddProduct}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 bg-white rounded-lg p-1 w-full shadow-sm">
          {categories.map((category) => (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? 'default' : 'ghost'}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {category}
            </Button>
          ))}
          <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-green-600 border-gray-200"
              >
                <Plus className="h-4 w-4" />
                Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-auto bg-white rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-green-700">Add New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category-name" className="text-sm">Category Name *</Label>
                  <Input
                    id="category-name"
                    value={newCategoryName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name"
                    className="border-gray-200"
                  />
                  <div className="mt-2 text-sm text-gray-600">
                    Suggested categories for {shopType || 'shop'}: {categorySuggestions.join(', ')}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddCategoryOpen(false)}
                    className="border-gray-200 text-gray-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleAddCategory}
                  >
                    Add Category
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {/* Error State */}
        {fetchError && !isFetching && (
          <div className="text-center py-8 bg-red-50 rounded-lg shadow-sm">
            <p className="text-red-600 mb-2">{fetchError}</p>
            <Button
              variant="outline"
              onClick={() => fetchProducts(shopId)}
              className="text-green-600 border-green-300"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        )}
        {/* Loading State */}
        {isFetching && (
          <div className="text-center py-8 bg-gray-50 rounded-lg shadow-sm">
            <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading products...</p>
          </div>
        )}
        {/* Products Grid */}
        {!isFetching && !fetchError && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredProducts.map((product: Product) => (
              <Card
                key={product.id}
                className="overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center relative group">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.prod_Name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                      <ShoppingBag className="h-8 w-8 mb-2" />
                      <span className="text-xs">No Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white text-green-600 hover:bg-green-50"
                    >
                      View
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-gray-900 truncate">{product.prod_Name}</h3>
                  <p
                    className="text-xs text-gray-600 mt-1 truncate"
                    title={`${product.prod_Categ}${product.prod_Subcateg ? ` > ${product.prod_Subcateg}` : ''}`}
                  >
                    {product.prod_Categ}
                    {product.prod_Subcateg && ` > ${product.prod_Subcateg}`}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-green-600">R{product.price.toFixed(2)}</span>
                    <Badge
                      variant="secondary"
                      className={product.quantity <= 5 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}
                    >
                      {product.quantity} left
                    </Badge>
                  </div>
                  {product.onSaleOffer && (
                    <p className="text-xs text-red-500 mt-1 truncate">{product.onSaleOffer}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {!isFetching && !fetchError && filteredProducts.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg shadow-sm">
            <ShoppingBag className="h-12 w-12 text-gray-300 mb-3 mx-auto" />
            <p className="text-gray-600 mb-2">No products found.</p>
            <p className="text-gray-500 text-sm">Try changing your search or category filter, or add a new product.</p>
          </div>
        )}
      </div>
    </div>
  );
}
