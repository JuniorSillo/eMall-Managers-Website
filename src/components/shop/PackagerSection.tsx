'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { UserResponse } from '@/lib/authTypes'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Edit, Trash, Plus, ArrowLeft, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Packager {
  id: number;
  roleID: number;
  name: string;
  surname: string;
  gender: string;
  phone: string;
  email: string;
  username: string;
  type: string;
  storeName?: string;
}

interface UserData {
  id: number;
  name: string;
  surname: string;
  email: string;
  contacts: string;
  gender: string;
  type: string;
  username: string;
}

export default function PackagerSection() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [editPackager, setEditPackager] = useState<Packager | null>(null);
  const [packagers, setPackagers] = useState<Packager[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [shopID, setShopID] = useState<number>(0);
  const [roleID, setRoleID] = useState<number>(0);
  const [newPackager, setNewPackager] = useState({
    name: '',
    surname: '',
    gender: '',
    contacts: '',
    email: '',
    password: '',
    type: 'Packager',
    shopID: 0,
  });

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (!user || !user.id) {
      console.error('[PackagerSection] Invalid or missing user data:', user);
      toast.error('Please log in to access packagers.');
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      setDataLoading(true);
      try {
        console.log('[PackagerSection] User from useAuth:', JSON.stringify(user, null, 2));
        // Fetch roleID from authAPI.getUserById
        console.log('[PackagerSection] Fetching user details for id:', user.id);
        const userData: UserResponse = await authAPI.getUserById(user.id);
        console.log('[PackagerSection] getUserById Response:', JSON.stringify(userData, null, 2));
        if (!userData || !userData.roleID) {
          console.error('[PackagerSection] Invalid user data:', userData);
          throw new Error('Invalid user data from API');
        }
        const userRoleID = userData.roleID;
        setRoleID(userRoleID);

        console.log('[PackagerSection] Fetching shop ID for roleID:', userRoleID);
        const shopIdResponse = await authAPI.getShopByMngrID(userRoleID);
        console.log('[PackagerSection] getShopByMngrID Response:', JSON.stringify(shopIdResponse, null, 2));
        if (typeof shopIdResponse !== 'number') {
          console.error('[PackagerSection] Invalid shopID:', shopIdResponse);
          throw new Error('Shop ID not found for manager.');
        }

        setShopID(shopIdResponse);
        setNewPackager((prev) => ({ ...prev, shopID: shopIdResponse }));

        console.log('[PackagerSection] Fetching packagers for shopID:', shopIdResponse);
        const packagersResponse = await authAPI.getPackagers(shopIdResponse);
        console.log('[PackagerSection] getPackagers Response:', JSON.stringify(packagersResponse, null, 2));
        if (!Array.isArray(packagersResponse)) {
          console.error('[PackagerSection] getPackagers did not return an array:', packagersResponse);
          throw new Error('Invalid packagers data format.');
        }

        const shopResponse = await authAPI.getShopByID(shopIdResponse);
        console.log('[PackagerSection] getShopByID Response:', JSON.stringify(shopResponse, null, 2));
        const storeName = shopResponse.dto.shopName || 'Unknown';

        const mappedPackagers = packagersResponse
          .map((p: any) => {
            if (!p?.user?.uName || !p?.user?.uSurname) {
              console.warn('[PackagerSection] Invalid packager data:', p);
              return null;
            }
            return {
              id: p.user.userID || p.roleID,
              roleID: p.roleID,
              name: p.user.uName,
              surname: p.user.uSurname,
              gender: p.user.uGender || '',
              phone: p.user.uPhone || '',
              email: p.user.uEmail || '',
              username: p.user.uEmail || '',
              type: p.user.uType || 'Packager',
              storeName,
            };
          })
          .filter((p: Packager | null) => p !== null) as Packager[];

        if (mappedPackagers.length === 0) {
          console.warn('[PackagerSection] No valid packagers found for shopID:', shopIdResponse);
          toast.info('No packagers found for this shop.');
        }

        setPackagers(mappedPackagers);
      } catch (error: any) {
        console.error('[PackagerSection] Failed to fetch data:', {
          message: error.message || 'Unknown error',
          response: error.response
            ? { status: error.response.status, data: JSON.stringify(error.response.data, null, 2) }
            : 'No response data',
          userId: user?.id,
          roleId: roleID,
          timestamp: new Date().toISOString(),
        });
        toast.error(error.message || 'Failed to load packagers.');
        setPackagers([]);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [user, loading, router]);

  const handleAddPackager = async () => {
    if (
      !newPackager.name ||
      !newPackager.surname ||
      !newPackager.gender ||
      !newPackager.contacts ||
      !newPackager.email ||
      !newPackager.password ||
      !newPackager.shopID
    ) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      console.log('[PackagerSection] Registering new packager with shopID:', newPackager.shopID, 'data:', newPackager);
      const response = await authAPI.registerPacManager({
        name: newPackager.name,
        surname: newPackager.surname,
        gender: newPackager.gender,
        contacts: newPackager.contacts,
        email: newPackager.email,
        password: newPackager.password,
        type: newPackager.type,
        username: newPackager.email,
        mallManagerId: newPackager.shopID,
      });
      console.log('[PackagerSection] registerPacManager Response:', JSON.stringify(response, null, 2));

      if (response.statusCode === 200) {
        const storeName = packagers[0]?.storeName || 'Unknown';
        setPackagers((prev) => [
          ...prev,
          {
            id: response.data?.userID || Date.now(),
            roleID: response.data?.roleID || Date.now(),
            name: newPackager.name,
            surname: newPackager.surname,
            gender: newPackager.gender,
            phone: newPackager.contacts,
            email: newPackager.email,
            username: newPackager.email,
            type: newPackager.type,
            storeName,
          },
        ]);
        setNewPackager({
          name: '',
          surname: '',
          gender: '',
          contacts: '',
          email: '',
          password: '',
          type: 'Packager',
          shopID,
        });
        setView('list');
        toast.success(
          <div className="flex flex-col space-y-2">
            <span className="font-semibold">Packager Registered Successfully!</span>
            <span>{response.message || 'Email and temporary password sent to the new packager.'}</span>
          </div>,
          {
            style: {
              background: '#f0fdf4',
              color: '#15803d',
              border: '1px solid #15803d',
              borderRadius: '8px',
              padding: '16px',
            },
            duration: 5000,
          }
        );
      } else {
        console.error('[PackagerSection] Register packager failed:', response);
        toast.error(response.message || 'Failed to register packager.');
      }
    } catch (error: any) {
      console.error('[PackagerSection] Register packager error:', {
        message: error.message || 'Unknown error',
        response: error.response
          ? {
              status: error.response.status,
              data: JSON.stringify(error.response.data, null, 2),
            }
          : 'No response data',
      });
      toast.error(error.message || 'Failed to register packager.');
    }
  };

  const handleEditPackager = async () => {
    if (
      !editPackager?.name ||
      !editPackager.surname ||
      !editPackager.gender ||
      !editPackager.phone ||
      !editPackager.email
    ) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      console.log('[PackagerSection] Updating packager:', editPackager.id, 'data:', editPackager);
      const response = await authAPI.updateManager({
        id: editPackager.id,
        name: editPackager.name,
        surname: editPackager.surname,
        gender: editPackager.gender,
        contacts: editPackager.phone,
        email: editPackager.email,
        username: editPackager.email,
        type: editPackager.type,
      });
      console.log('[PackagerSection] updateManager Response:', JSON.stringify(response, null, 2));
      if (response.statusCode === 200) {
        setPackagers((prev) =>
          prev.map((p) => (p.id === editPackager.id ? { ...editPackager, username: editPackager.email } : p))
        );
        setEditPackager(null);
        setView('list');
        toast.success('Packager updated successfully!');
      } else {
        console.error('[PackagerSection] Update packager failed:', response);
        toast.error(response.message || 'Failed to update packager.');
      }
    } catch (error: any) {
      console.error('[PackagerSection] Edit packager error:', {
        message: error.message || 'Unknown error',
        response: error.response
          ? {
              status: error.response.status,
              data: JSON.stringify(error.response.data, null, 2),
            }
          : 'No response data',
      });
      toast.error(error.message || 'Failed to update packager.');
    }
  };

  const handleDeletePackager = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this packager?')) {
      try {
        console.log('[PackagerSection] Deleting packager:', id);
        const response = await authAPI.deleteManager(id);
        console.log('[PackagerSection] deleteManager Response:', JSON.stringify(response, null, 2));
        if (response.statusCode === 200) {
          setPackagers((prev) => prev.filter((p) => p.id !== id));
          toast.success('Packager deleted successfully!');
        } else {
          console.error('[PackagerSection] Delete packager failed:', response);
          toast.error(response.message || 'Failed to delete packager.');
        }
      } catch (error: any) {
        console.error('[PackagerSection] Delete packager error:', {
          message: error.message || 'Unknown error',
          response: error.response
            ? {
                status: error.response.status,
                data: JSON.stringify(error.response.data, null, 2),
              }
            : 'No response data',
        });
        toast.error(error.message || 'Failed to delete packager.');
      }
    }
  };

  const filteredPackagers = packagers.filter(
    (packager) =>
      `${packager.name} ${packager.surname}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      packager.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center py-12">
        <div className="animate-pulse">
          <Briefcase className="h-12 w-12 text-green-600" />
          <p className="text-gray-500 mt-2">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.id) {
    return null; // Will redirect via useEffect
  }

  if (dataLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center py-12">
        <div className="animate-pulse">
          <Briefcase className="h-12 w-12 text-green-600" />
          <p className="text-gray-500 mt-2">Loading packagers...</p>
        </div>
      </div>
    );
  }

  if (view === 'add') {
    return (
      <div className="space-y-6 px-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setView('list')}
            className="text-green-600 hover:text-green-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Packagers
          </Button>
        </div>
        <Card className="w-full shadow-lg border border-gray-100">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-2xl font-semibold text-green-600">Add Packager</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">First Name</Label>
                <Input
                  id="name"
                  value={newPackager.name}
                  onChange={(e) => setNewPackager({ ...newPackager, name: e.target.value })}
                  placeholder="Enter first name"
                  className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <Label htmlFor="surname" className="text-sm font-medium text-gray-700">Surname</Label>
                <Input
                  id="surname"
                  value={newPackager.surname}
                  onChange={(e) => setNewPackager({ ...newPackager, surname: e.target.value })}
                  placeholder="Enter surname"
                  className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="gender" className="text-sm font-medium text-gray-700">Gender</Label>
              <Select
                value={newPackager.gender}
                onValueChange={(value) => setNewPackager({ ...newPackager, gender: value })}
              >
                <SelectTrigger className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="contacts" className="text-sm font-medium text-gray-700">Phone Number</Label>
              <Input
                id="contacts"
                value={newPackager.contacts}
                onChange={(e) => setNewPackager({ ...newPackager, contacts: e.target.value })}
                placeholder="Enter phone number (e.g., +27123456789)"
                className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={newPackager.email}
                onChange={(e) => setNewPackager({ ...newPackager, email: e.target.value })}
                placeholder="Enter email address"
                className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={newPackager.password}
                onChange={(e) => setNewPackager({ ...newPackager, password: e.target.value })}
                placeholder="Enter temporary password"
                className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <Label htmlFor="type" className="text-sm font-medium text-gray-700">Type</Label>
              <Input
                id="type"
                value={newPackager.type}
                disabled
                className="mt-1 rounded-lg border-gray-300 bg-gray-100"
              />
            </div>
            <div>
              <Label htmlFor="shopID" className="text-sm font-medium text-gray-700">Shop ID</Label>
              <Input
                id="shopID"
                value={newPackager.shopID}
                disabled
                className="mt-1 rounded-lg border-gray-300 bg-gray-100"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setView('list')}
                className="rounded-lg border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 rounded-lg"
                onClick={handleAddPackager}
              >
                Add Packager
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'edit' && editPackager) {
    return (
      <div className="space-y-6 px-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => {
              setEditPackager(null);
              setView('list');
            }}
            className="text-green-600 hover:text-green-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Packagers
          </Button>
        </div>
        <Card className="w-full shadow-lg border border-gray-100">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-2xl font-semibold text-green-600">Edit Packager</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700">First Name</Label>
                <Input
                  id="edit-name"
                  value={editPackager.name}
                  onChange={(e) => setEditPackager({ ...editPackager, name: e.target.value })}
                  placeholder="Enter first name"
                  className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-surname" className="text-sm font-medium text-gray-700">Surname</Label>
                <Input
                  id="edit-surname"
                  value={editPackager.surname}
                  onChange={(e) => setEditPackager({ ...editPackager, surname: e.target.value })}
                  placeholder="Enter surname"
                  className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-gender" className="text-sm font-medium text-gray-700">Gender</Label>
              <Select
                value={editPackager.gender}
                onValueChange={(value) => setEditPackager({ ...editPackager, gender: value })}
              >
                <SelectTrigger className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-contacts" className="text-sm font-medium text-gray-700">Phone Number</Label>
              <Input
                id="edit-contacts"
                value={editPackager.phone}
                onChange={(e) => setEditPackager({ ...editPackager, phone: e.target.value })}
                placeholder="Enter phone number"
                className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editPackager.email}
                onChange={(e) => setEditPackager({ ...editPackager, email: e.target.value, username: e.target.value })}
                placeholder="Enter email address"
                className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <Label htmlFor="edit-storeName" className="text-sm font-medium text-gray-700">Store Name</Label>
              <Input
                id="edit-storeName"
                value={editPackager.storeName || ''}
                disabled
                className="mt-1 rounded-lg border-gray-300 bg-gray-100"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditPackager(null);
                  setView('list');
                }}
                className="rounded-lg border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 rounded-lg"
                onClick={handleEditPackager}
              >
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4">
      <div>
        <h1 className="text-3xl font-bold text-green-600">Packagers</h1>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search packagers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
        />
      </div>
      <div className="flex items-center space-x-4">
        <Button
          className="bg-green-600 hover:bg-green-700 flex items-center space-x-2 rounded-lg"
          onClick={() => setView('add')}
        >
          <Plus className="h-4 w-4" />
          <span>Add New Packager</span>
        </Button>
      </div>
      <div>
        <h2 className="text-green-600 text-lg font-medium mb-4">Available Packagers</h2>
        <Card className="bg-white rounded-lg border shadow-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPackagers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    No packagers available.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPackagers.map((packager) => (
                  <TableRow key={packager.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell>{packager.roleID}</TableCell>
                    <TableCell>{`${packager.name} ${packager.surname}`}</TableCell>
                    <TableCell>{packager.storeName || '-'}</TableCell>
                    <TableCell>{packager.phone || 'N/A'}</TableCell>
                    <TableCell>{packager.email}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditPackager(packager);
                          setView('edit');
                        }}
                      >
                        <Edit className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePackager(packager.id)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}