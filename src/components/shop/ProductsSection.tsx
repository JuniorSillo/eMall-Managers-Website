'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Search, Package, ShoppingBag, Plus, RefreshCw, Eye, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Variant {
  id: number;
  size: string;
  color: string;
  colorPic?: string; // base64 preview URL (for display)
  colorPicFile?: File; // actual file for upload
  quantity: number;
}

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
  variants?: {
    id: number;
    size: string;
    color: string;
    colorPic?: string;
    quantity: number;
  }[];
}

export default function ProductsSection() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All products');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isViewProductOpen, setIsViewProductOpen] = useState(false);
  const [viewedProduct, setViewedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(['All products']);
  const [shopId, setShopId] = useState<number>(0);
  const [shopType, setShopType] = useState<string>('');
  const [roleID, setRoleID] = useState<number | null>(null);

  const [newProduct, setNewProduct] = useState<{
    name: string;
    description: string;
    category: string;
    subCategory: string;
    price: string;
    weight: string;
    quantity: string;
    imageFile: File | null;
    discPerc: string;
    discAmount: string;
    variants: Variant[];
  }>({
    name: '',
    description: '',
    category: '',
    subCategory: '',
    price: '',
    weight: '',
    quantity: '',
    imageFile: null,
    discPerc: '',
    discAmount: '',
    variants: [],
  });

  const [variant, setVariant] = useState<{
    size: string;
    color: string;
    colorPicFile: File | null;
    colorPicPreview: string;
    quantity: string;
  }>({
    size: '',
    color: '#000000',
    colorPicFile: null,
    colorPicPreview: '',
    quantity: '',
  });

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  useEffect(() => {
    if (loading) return;
    if (!user || !user.id) {
      toast.error('Please log in to access products.');
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      setIsFetching(true);
      setFetchError(null);
      try {
        const userData = await authAPI.getUserById(user.id);
        if (!userData || !userData.roleID) throw new Error('Invalid user data — missing roleID');

        setRoleID(userData.roleID);

        const shopIdResponse = await authAPI.getShopByMngrID(userData.roleID);
        if (typeof shopIdResponse !== 'number') throw new Error('Shop ID not found for this manager');

        setShopId(shopIdResponse);

        const shopResponse = await authAPI.getShopByID(shopIdResponse);
        setShopType(shopResponse.dto.shopType || 'General');

        await fetchProducts(shopIdResponse);
      } catch (error: any) {
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
      if (!Array.isArray(productsResponse)) throw new Error('Products response is not an array');
      setProducts(productsResponse);
      const uniqueCategories = Array.from(
        new Set(productsResponse.map((p) => p.prod_Categ.trim()))
      );
      setCategories(['All products', ...uniqueCategories]);
    } catch (error: any) {
      setFetchError(error.message || 'Failed to load products.');
      toast.error(error.message || 'Failed to load products.');
      setProducts([]);
    } finally {
      setIsFetching(false);
    }
  };

  const validateProductForm = () => {
    if (!newProduct.name.trim()) { toast.error('Product name is required'); return false; }
    if (!newProduct.price || isNaN(Number(newProduct.price)) || Number(newProduct.price) <= 0) {
      toast.error('Valid price is required'); return false;
    }
    if (!newProduct.category.trim()) { toast.error('Category is required'); return false; }
    if (newProduct.variants.length === 0 && (!newProduct.quantity || Number(newProduct.quantity) <= 0)) {
      toast.error('Quantity is required when no variants are added'); return false;
    }
    return true;
  };

  // ─── Variant helpers ────────────────────────────────────────────────────────

  const handleVariantColorPicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setVariant((prev) => ({ ...prev, colorPicFile: file, colorPicPreview: previewUrl }));
  };

  const addVariant = () => {
    if (!variant.size || !variant.quantity || Number(variant.quantity) <= 0) {
      toast.error('Size and valid quantity are required for variant');
      return;
    }
    const newVariant: Variant = {
      id: Date.now(),
      size: variant.size,
      color: variant.color,
      colorPic: variant.colorPicPreview || undefined,
      colorPicFile: variant.colorPicFile || undefined,
      quantity: Number(variant.quantity),
    };
    setNewProduct((prev) => ({ ...prev, variants: [...prev.variants, newVariant] }));
    setVariant({ size: '', color: '#000000', colorPicFile: null, colorPicPreview: '', quantity: '' });
    toast.success('Variant added');
  };

  const deleteVariant = (id: number) => {
    setNewProduct((prev) => ({
      ...prev,
      variants: prev.variants.filter((v) => v.id !== id),
    }));
    toast.success('Variant removed');
  };

  const updateVariantQuantity = (id: number, value: number) => {
    setNewProduct((prev) => ({
      ...prev,
      variants: prev.variants.map((v) => (v.id === id ? { ...v, quantity: value } : v)),
    }));
  };

  const calculateTotalQuantity = () =>
    newProduct.variants.reduce((sum, v) => sum + v.quantity, 0);

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleAddProduct = async () => {
    if (!validateProductForm() || !roleID || shopId === 0) {
      toast.error('Missing required shop or manager information');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();

      formData.append('Prod_Name', newProduct.name.trim());
      formData.append('Prod_Desc', newProduct.description.trim() || '');
      formData.append('Prod_Categ', newProduct.category.trim());
      formData.append('Prod_Subcateg', newProduct.subCategory.trim() || '');
      formData.append('Price', newProduct.price);
      formData.append('DiscPerc', newProduct.discPerc || '');
      formData.append('DiscAmount', newProduct.discAmount || '');
      formData.append('Prod_Weight', newProduct.weight.trim() || '0g');
      formData.append(
        'Quantity',
        (newProduct.variants.length > 0
          ? calculateTotalQuantity()
          : Number(newProduct.quantity) || 0
        ).toString()
      );
      formData.append('ShopId', shopId.toString());
      formData.append('MangrID', roleID.toString());

      // Build variantsJson — exclude the File object; only send serialisable fields.
      // The colorPic field in the JSON will be the field name used by the backend
      // to match up against the appended file(s) below.
      const variantsForJson = newProduct.variants.map((v, index) => ({
        size: v.size,
        color: v.color,
        quantity: v.quantity,
        // Tell the backend which form-field key holds the image for this variant
        colorPicKey: v.colorPicFile ? `variantColorPic_${index}` : null,
      }));
      formData.append('varientsJson', JSON.stringify(variantsForJson));

      // Append each variant's colorPic file under its keyed field name
      newProduct.variants.forEach((v, index) => {
        if (v.colorPicFile) {
          formData.append(`variantColorPic_${index}`, v.colorPicFile);
        }
      });

      if (newProduct.imageFile) {
        formData.append('image', newProduct.imageFile);
      }

      // Debug
      console.log('[Upload] FormData entries:');
      for (const [key, val] of formData.entries()) {
        if (val instanceof File) {
          console.log(`  • ${key}: [File] ${val.name} (${val.size} bytes)`);
        } else {
          console.log(`  • ${key}: ${val}`);
        }
      }

      const response = await authAPI.uploadProduct(formData);

      if (response.statusCode === 200 || response.message?.toLowerCase().includes('success')) {
        await fetchProducts(shopId);
        resetForm();
        setIsAddProductOpen(false);
        toast.success('Product added successfully!');
      } else {
        toast.error(response.message || 'Failed to add product');
      }
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message || error.message || 'Failed to upload product.';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewProduct({
      name: '',
      description: '',
      category: '',
      subCategory: '',
      price: '',
      weight: '',
      quantity: '',
      imageFile: null,
      discPerc: '',
      discAmount: '',
      variants: [],
    });
    setVariant({ size: '', color: '#000000', colorPicFile: null, colorPicPreview: '', quantity: '' });
  };

  const handleViewProduct = (product: Product) => {
    setViewedProduct(product);
    setIsViewProductOpen(true);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.prod_Name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All products' || product.prod_Categ === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // ─── Loading / auth guards ───────────────────────────────────────────────────

  if (loading || isFetching) {
    return (
      <div className="w-full h-screen flex items-center justify-center py-12">
        <div className="animate-pulse text-center">
          <ShoppingBag className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-gray-500">{loading ? 'Authenticating...' : 'Loading products...'}</p>
        </div>
      </div>
    );
  }

  if (!user || !user.id) return null;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 w-full">
      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchProducts(shopId)} disabled={isFetching}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>

          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-green-700">Add New Product</DialogTitle>
              </DialogHeader>

              <div className="space-y-8 py-4">
                {/* Image & Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Product Image</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="w-full h-40 rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden">
                        {newProduct.imageFile ? (
                          <img
                            src={URL.createObjectURL(newProduct.imageFile)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-10 w-10 text-gray-400" />
                        )}
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, imageFile: e.target.files?.[0] ?? null })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="e.g. Wireless Earbuds"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      placeholder="Product features, materials, etc."
                      rows={4}
                    />
                  </div>
                </div>

                {/* ── Variants ── */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Variants (optional)</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Size */}
                    <div>
                      <Label>Size</Label>
                      <Select
                        value={variant.size}
                        onValueChange={(value) => setVariant({ ...variant, size: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {sizes.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Color Pic */}
                    <div>
                      <Label>Color Picture</Label>
                      <div className="mt-1 flex items-center gap-2">
                        {/* Preview thumbnail */}
                        <div className="w-10 h-10 rounded border bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {variant.colorPicPreview ? (
                            <img
                              src={variant.colorPicPreview}
                              alt="Color preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          className="text-xs"
                          onChange={handleVariantColorPicChange}
                        />
                      </div>
                    </div>

                    {/* Fallback hex color */}
                    <div>
                      <Label>Fallback Color</Label>
                      <Input
                        type="color"
                        value={variant.color}
                        onChange={(e) => setVariant({ ...variant, color: e.target.value })}
                        className="h-10 p-1"
                      />
                    </div>

                    {/* Quantity */}
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={variant.quantity}
                        onChange={(e) => setVariant({ ...variant, quantity: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={addVariant}
                    disabled={!variant.size || !variant.quantity}
                  >
                    Add Variant
                  </Button>

                  {newProduct.variants.length > 0 && (
                    <div className="mt-6 border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="p-3 text-left">Size</th>
                            <th className="p-3 text-left">Color</th>
                            <th className="p-3 text-left">Quantity</th>
                            <th className="p-3 text-left w-20">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {newProduct.variants.map((v) => (
                            <tr key={v.id} className="border-t">
                              <td className="p-3">{v.size}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  {/* Show colorPic if available, otherwise hex swatch */}
                                  {v.colorPic ? (
                                    <img
                                      src={v.colorPic}
                                      alt="color"
                                      className="w-8 h-8 rounded border object-cover"
                                    />
                                  ) : (
                                    <div
                                      className="w-8 h-8 rounded border"
                                      style={{ backgroundColor: v.color }}
                                    />
                                  )}
                                  <span className="text-xs text-gray-500">{v.color}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <Input
                                  type="number"
                                  min="1"
                                  value={v.quantity}
                                  onChange={(e) =>
                                    updateVariantQuantity(v.id, Number(e.target.value))
                                  }
                                  className="w-24"
                                />
                              </td>
                              <td className="p-3">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteVariant(v.id)}
                                >
                                  Remove
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      placeholder="e.g. Electronics"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subCategory">Sub-Category</Label>
                    <Input
                      id="subCategory"
                      value={newProduct.subCategory}
                      onChange={(e) => setNewProduct({ ...newProduct, subCategory: e.target.value })}
                      placeholder="e.g. Audio"
                    />
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <Label>
                      Quantity *{newProduct.variants.length > 0 && ' (calculated from variants)'}
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={
                        newProduct.variants.length > 0
                          ? calculateTotalQuantity()
                          : newProduct.quantity
                      }
                      onChange={(e) =>
                        newProduct.variants.length === 0 &&
                        setNewProduct({ ...newProduct, quantity: e.target.value })
                      }
                      disabled={newProduct.variants.length > 0}
                    />
                  </div>

                  <div>
                    <Label>Price (R) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={newProduct.price}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewProduct((prev) => {
                          const amt =
                            val && prev.discPerc
                              ? (Number(val) * (Number(prev.discPerc) / 100)).toFixed(2)
                              : prev.discAmount;
                          return { ...prev, price: val, discAmount: amt };
                        });
                      }}
                    />
                  </div>

                  <div>
                    <Label>Discount %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={newProduct.discPerc}
                      onChange={(e) => {
                        const perc = e.target.value;
                        setNewProduct((prev) => {
                          const amt =
                            prev.price && perc
                              ? (Number(prev.price) * (Number(perc) / 100)).toFixed(2)
                              : prev.discAmount;
                          return { ...prev, discPerc: perc, discAmount: amt };
                        });
                      }}
                    />
                  </div>

                  <div>
                    <Label>Discount Amount (R)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newProduct.discAmount}
                      onChange={(e) => {
                        const amt = e.target.value;
                        setNewProduct((prev) => {
                          const perc =
                            prev.price && amt
                              ? ((Number(amt) / Number(prev.price)) * 100).toFixed(2)
                              : prev.discPerc;
                          return { ...prev, discAmount: amt, discPerc: perc };
                        });
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Weight (e.g. 250g)</Label>
                    <Input
                      value={newProduct.weight}
                      onChange={(e) => setNewProduct({ ...newProduct, weight: e.target.value })}
                      placeholder="e.g. 0.78g"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button variant="outline" onClick={() => { resetForm(); setIsAddProductOpen(false); }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddProduct}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Uploading...' : 'Upload Product'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 bg-white p-3 rounded-lg shadow-sm border">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className={selectedCategory === cat ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Products Grid */}
      {fetchError ? (
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <p className="text-red-600 mb-4">{fetchError}</p>
          <Button onClick={() => fetchProducts(shopId)}>Try Again</Button>
        </div>
      ) : isFetching ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No products found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || selectedCategory !== 'All products'
              ? 'Try adjusting your search or filter'
              : 'Get started by adding your first product'}
          </p>
          {!searchQuery && selectedCategory === 'All products' && (
            <Button onClick={() => setIsAddProductOpen(true)}>Add Your First Product</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square relative bg-gray-100">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.prod_Name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <Package className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                  <Button variant="secondary" size="sm" onClick={() => handleViewProduct(product)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium line-clamp-2 mb-1">{product.prod_Name}</h3>
                <p className="text-sm text-gray-500 mb-2">
                  {product.prod_Categ}
                  {product.prod_Subcateg && ` > ${product.prod_Subcateg}`}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-700">
                    R{product.price.toFixed(2)}
                  </span>
                  <Badge variant={product.quantity <= 5 ? 'destructive' : 'secondary'}>
                    {product.quantity} left
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── View Product Dialog ── */}
      <Dialog open={isViewProductOpen} onOpenChange={setIsViewProductOpen}>
        <DialogContent className="max-w-3xl">
          {viewedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{viewedProduct.prod_Name}</DialogTitle>
                <DialogDescription>Product details</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                {/* Left — product image */}
                <div>
                  {viewedProduct.imageUrl ? (
                    <img
                      src={viewedProduct.imageUrl}
                      alt={viewedProduct.prod_Name}
                      className="w-full rounded-lg object-cover aspect-square"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="h-24 w-24 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Right — details */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Category</h4>
                    <p>
                      {viewedProduct.prod_Categ}
                      {viewedProduct.prod_Subcateg && ` > ${viewedProduct.prod_Subcateg}`}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Price</h4>
                    <p className="text-2xl font-bold text-green-700">
                      R{viewedProduct.price.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Stock</h4>
                    <p className={viewedProduct.quantity <= 5 ? 'text-red-600' : ''}>
                      {viewedProduct.quantity} units available
                    </p>
                  </div>

                  {viewedProduct.prod_Weight && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Weight</h4>
                      <p>{viewedProduct.prod_Weight}</p>
                    </div>
                  )}

                  {/* Variants with colorPic support */}
                  {viewedProduct.variants && viewedProduct.variants.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">Variants</h4>
                      <div className="space-y-3">
                        {viewedProduct.variants.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center gap-3 p-2 rounded-lg border bg-gray-50"
                          >
                            {/* Color representation — prefer colorPic, fall back to hex */}
                            {v.colorPic ? (
                              <img
                                src={v.colorPic}
                                alt={`Color for size ${v.size}`}
                                className="w-10 h-10 rounded-md border object-cover flex-shrink-0"
                              />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-md border flex-shrink-0"
                                style={{ backgroundColor: v.color }}
                                title={v.color}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">Size: {v.size}</p>
                              <p className="text-xs text-gray-500">{v.quantity} units</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewedProduct.prod_Desc && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                      <p className="text-gray-600">{viewedProduct.prod_Desc}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsViewProductOpen(false)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}