'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, User, Phone, Mail, Building, Shield, LogOut, Trash2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api';

interface ShopProfile {
  id: number;
  roleID: number;
  name: string;
  surname: string;
  gender: string;
  phone: string;
  email: string;
  username: string;
  type: string;
  accountNumber: string;
  role: string;
  shop?: {
    shopID: number;
    shopName: string;
    shopType: string;
    shopImage?: string;
    imageBase64?: string;
  };
}

export default function ProfileSection() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState({
    phone: false,
    email: false,
  });

  const [shopProfile, setShopProfile] = useState<ShopProfile>({
    id: Number(user?.id) || 0,
    roleID: 0,
    name: user?.name || '',
    surname: user?.surname || '',
    gender: user?.gender || '',
    phone: user?.contacts || '',
    email: user?.email || '',
    username: user?.username || '',
    type: user?.type || 'ShopManager',
    accountNumber: user?.username || '',
    role: user?.type || 'ShopManager',
    shop: undefined,
  });

  // Fetch user profile and shop data
  useEffect(() => {
    const fetchShopProfile = async () => {
      if (!user?.id) {
        console.error('[ProfileSection] User ID not found:', user);
        toast.error('User ID not found. Please log in again.');
        return;
      }

      setLoading(true);
      try {
        console.log('[ProfileSection] Fetching user by ID:', user.id);
        const userResponse = await authAPI.getUserById(Number(user.id));
        console.log('[ProfileSection] getUserById Response:', JSON.stringify(userResponse, null, 2));
        const userData = userResponse.user;
        const roleID = userResponse.roleID || 0;

        let shopData: ShopProfile['shop'] = {
          shopID: 0,
          shopName: 'Not assigned',
          shopType: 'Not assigned',
        };

        try {
          const shopIdResponse = await authAPI.getShopByMngrID(roleID);
          console.log('[ProfileSection] getShopByMngrID Response:', shopIdResponse);
          const shopId = shopIdResponse;
          if (typeof shopId === 'number') {
            const shopResponse = await authAPI.getShopByID(shopId);
            console.log('[ProfileSection] getShopByID Response:', JSON.stringify(shopResponse, null, 2));
            shopData = {
              shopID: shopResponse.dto.id,
              shopName: shopResponse.dto.shopName || 'Not assigned',
              shopType: shopResponse.dto.shopType || 'Not assigned',
              shopImage: shopResponse.dto.shopImage,
              imageBase64: shopResponse.imageBase64,
            };
          }
        } catch (shopError: any) {
          if (shopError.response?.status === 404) {
            console.log('[ProfileSection] No shop assigned to roleID:', roleID);
          } else {
            console.error('[ProfileSection] Failed to fetch shop data:', shopError);
          }
        }

        setShopProfile({
          id: Number(user.id),
          roleID,
          name: userData.uName || user?.name || 'Unknown',
          surname: userData.uSurname || user?.surname || 'Unknown',
          gender: userData.uGender || user?.gender || 'Other',
          phone: userData.uPhone || user?.contacts || '',
          email: userData.uEmail || user?.email || '',
          username: user?.username || userData.uEmail || '',
          type: userData.uType || user?.type || 'ShopManager',
          accountNumber: user?.username || userData.uEmail || '',
          role: userData.uType || user?.type || 'ShopManager',
          shop: shopData,
        });
      } catch (error: any) {
        console.error('[ProfileSection] Failed to fetch profile:', error);
        toast.error('Failed to load profile or shop information');
        setShopProfile((prev) => ({
          ...prev,
          shop: {
            shopID: 0,
            shopName: 'Not assigned',
            shopType: 'Not assigned',
          },
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchShopProfile();
  }, [user?.id, user?.username, user?.name, user?.surname, user?.gender, user?.contacts, user?.email, user?.type]);

  const handleEdit = (field: keyof typeof isEditing) => {
    setIsEditing((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async (field: keyof typeof isEditing) => {
    setLoading(true);
    try {
      const response = await authAPI.updateManager({
        id: shopProfile.id,
        name: shopProfile.name,
        surname: shopProfile.surname,
        gender: shopProfile.gender,
        contacts: shopProfile.phone,
        email: shopProfile.email,
        username: shopProfile.username,
        type: shopProfile.type,
      });
      console.log('[ProfileSection] updateManager Response:', JSON.stringify(response, null, 2));
      if (response.statusCode === 200) {
        setIsEditing((prev) => ({ ...prev, [field]: false }));
        toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error(`[ProfileSection] Failed to update ${field}:`, error);
      toast.error(`Failed to update ${field}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (field: keyof typeof isEditing) => {
    setIsEditing((prev) => ({ ...prev, [field]: false }));
  };

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/login');
      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('[ProfileSection] Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setLoading(true);
      try {
        const response = await authAPI.deleteManager(shopProfile.id);
        console.log('[ProfileSection] deleteManager Response:', JSON.stringify(response, null, 2));
        if (response.statusCode === 200) {
          await logout();
          router.push('/login');
          toast.success('Account deleted successfully');
        } else {
          throw new Error(response.message || 'Failed to delete account');
        }
      } catch (error: any) {
        console.error('[ProfileSection] Delete account error:', error);
        toast.error('Failed to delete account');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChangePassword = () => {
    router.push('/change-password');
  };

  // Derive shop image src
  const shopImageSrc = shopProfile.shop?.imageBase64
    ? `data:image/jpeg;base64,${shopProfile.shop.imageBase64}`
    : shopProfile.shop?.shopImage || null;

  if (loading && !shopProfile.name) {
    return (
      <div className="w-full h-screen flex items-center justify-center py-12">
        <div className="animate-pulse">
          <Briefcase className="h-12 w-12 text-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">

      {/* ── Shop Image Hero Banner ────────────────────────────────────────── */}
      {shopImageSrc && (
        <div className="w-full h-52 overflow-hidden">
          <img
            src={shopImageSrc}
            alt={shopProfile.shop?.shopName || 'Shop'}
            className="w-full h-full object-cover object-center"
          />
        </div>
      )}

      {/* ── Header: Avatar + Name ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 px-4 md:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20 ring-4 ring-green-100">
            <AvatarFallback className="text-xl font-semibold bg-green-100 text-green-700">
              {shopProfile.shop?.shopName
                ? shopProfile.shop.shopName.slice(0, 2).toUpperCase()
                : 'SM'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {`${shopProfile.name} ${shopProfile.surname}`}
            </h1>
            <Badge variant="secondary" className="mt-1 bg-green-100 text-green-700">
              {shopProfile.role}
            </Badge>
            <p className="text-sm text-gray-600 mt-1">
              Reference Number: {shopProfile.accountNumber}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div className="px-4 md:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Account Information */}
          <Card className="w-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-green-700">
                <User className="h-5 w-5" />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Name (read-only) */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2 text-sm font-medium">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>Full Name</span>
                </Label>
                <Input
                  value={`${shopProfile.name} ${shopProfile.surname}`}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  Name cannot be changed. Contact support if needed.
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2 text-sm font-medium">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>Contact Number</span>
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={shopProfile.phone}
                    onChange={(e) => setShopProfile({ ...shopProfile, phone: e.target.value })}
                    disabled={!isEditing.phone}
                    className={isEditing.phone ? 'border-green-300 focus:border-green-500' : ''}
                  />
                  <div className="flex items-center space-x-1">
                    {isEditing.phone ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSave('phone')}
                          disabled={loading}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel('phone')}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit('phone')}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2 text-sm font-medium">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>Email Address</span>
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={shopProfile.email}
                    onChange={(e) =>
                      setShopProfile({ ...shopProfile, email: e.target.value, username: e.target.value })
                    }
                    disabled={!isEditing.email}
                    className={isEditing.email ? 'border-green-300 focus:border-green-500' : ''}
                  />
                  <div className="flex items-center space-x-1">
                    {isEditing.email ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSave('email')}
                          disabled={loading}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel('email')}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit('email')}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shop Information */}
          <Card className="w-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-green-700">
                <Building className="h-5 w-5" />
                <span>Shop Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center space-x-2 text-sm font-medium">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span>Shop Name</span>
                </Label>
                <Input
                  value={shopProfile.shop?.shopName || 'Not assigned'}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center space-x-2 text-sm font-medium">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span>Shop Type</span>
                </Label>
                <Input
                  value={shopProfile.shop?.shopType || 'Not assigned'}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security & Actions */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-green-700">
              <Shield className="h-5 w-5" />
              <span>Security & Account Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                onClick={handleChangePassword}
                className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
              >
                <Shield className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button
                onClick={handleSignOut}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>

            <Separator />

            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={handleDeleteAccount}
                disabled={loading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}