'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Edit, Trash, Plus, ArrowLeft, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

interface ShopManager {
  id: number;
  roleID: number;
  uName: string;
  uSurname: string;
  uGender: string;
  uPhone: string;
  uEmail: string;
  username: string;
  uType: string;
}

interface AuthContextUser {
  id?: number;
  mallID?: number;
}

export default function StoresManager() {
  const { user } = useAuth() as { user: AuthContextUser | null };
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [editManager, setEditManager] = useState<ShopManager | null>(null);
  const [managers, setManagers] = useState<ShopManager[]>([]);
  const [loading, setLoading] = useState(false);
  const [mallID, setMallID] = useState<number>(0);
  const [newManager, setNewManager] = useState({
    name: '',
    surname: '',
    gender: '',
    contacts: '',
    email: '',
    password: '',
    type: 'ShopManager',
    mallManagerId: 0, // Updated to mallID
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('[StoresManager] User from useAuth:', JSON.stringify(user, null, 2));
        if (!user) {
          console.error('[StoresManager] User is null or undefined');
          throw new Error('User not found. Please log in again.');
        }
        if (!user.id || typeof user.id !== 'number') {
          console.error('[StoresManager] Invalid or missing user.id:', user.id);
          throw new Error('Invalid user ID. Please log in again.');
        }

        let fetchedMallID: number;

        if (user.mallID && typeof user.mallID === 'number') {
          console.log('[StoresManager] Using mallID from AuthContext:', user.mallID);
          fetchedMallID = user.mallID;
        } else {
          console.log('[StoresManager] Fetching user by ID:', user.id);
          const userResponse = await authAPI.getUserById(user.id);
          console.log('[StoresManager] getUserById Response:', JSON.stringify(userResponse, null, 2));
          const roleID = userResponse?.roleID;
          if (!roleID || typeof roleID !== 'number') {
            console.error('[StoresManager] Invalid or missing roleID:', userResponse);
            throw new Error('User role ID not found.');
          }

          console.log('[StoresManager] Fetching mall ID for roleID:', roleID);
          const mallIdResponse = await authAPI.getMallIdByManagerId(roleID);
          console.log('[StoresManager] getMallIdByManagerId Response:', JSON.stringify(mallIdResponse, null, 2));
          fetchedMallID = mallIdResponse?.mallID;
          if (!fetchedMallID || typeof fetchedMallID !== 'number') {
            console.error('[StoresManager] Invalid or missing mallID:', mallIdResponse);
            throw new Error('Mall ID not found for manager.');
          }
        }

        setMallID(fetchedMallID);
        setNewManager((prev) => ({ ...prev, mallManagerId: fetchedMallID }));

        console.log('[StoresManager] Fetching shop managers for mallID:', fetchedMallID);
        const managersResponse = await authAPI.getShopManagers(fetchedMallID);
        console.log('[StoresManager] getShopManagers Response:', JSON.stringify(managersResponse, null, 2));
        if (!Array.isArray(managersResponse)) {
          console.error('[StoresManager] getShopManagers did not return an array:', managersResponse);
          throw new Error('Invalid shop managers data format.');
        }

        const mappedManagers = managersResponse
          .map((m: any) => {
            if (!m?.uName || !m?.uSurname) {
              console.warn('[StoresManager] Invalid manager data:', m);
              return null;
            }
            return {
              id: m.userID || m.roleID,
              roleID: m.roleID,
              uName: m.uName,
              uSurname: m.uSurname,
              uGender: m.uGender || '',
              uPhone: m.uPhone || '',
              uEmail: m.uEmail || '',
              username: m.uEmail || '',
              uType: m.uType || 'ShopManager',
            };
          })
          .filter((m: ShopManager | null) => m !== null) as ShopManager[];

        if (mappedManagers.length === 0) {
          console.warn('[StoresManager] No valid managers found for mallID:', fetchedMallID);
          toast.info('No shop managers found for this mall.');
        }

        setManagers(mappedManagers);
      } catch (error: any) {
        console.error('[StoresManager] Failed to fetch data:', {
          message: error.message || 'Unknown error',
          name: error.name || 'Unknown',
          stack: error.stack || 'No stack trace',
          response: error.response
            ? {
                status: error.response.status,
                data: JSON.stringify(error.response.data, null, 2),
                headers: JSON.stringify(error.response.headers, null, 2),
              }
            : 'No response data',
          userId: user?.id,
          mallId: user?.mallID,
          timestamp: new Date().toISOString(),
        });
        toast.error(error.message || 'Failed to load shop managers or user role.');
        setManagers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, user?.mallID]);

  const handleAddManager = async () => {
    if (
      !newManager.name ||
      !newManager.surname ||
      !newManager.gender ||
      !newManager.contacts ||
      !newManager.email ||
      !newManager.password ||
      !newManager.mallManagerId
    ) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (!mallID) {
      console.error('[StoresManager] Cannot add manager: mallID is 0');
      toast.error('Cannot add manager: Mall ID not found.');
      return;
    }

    try {
      console.log('[StoresManager] Registering new manager with mallID:', mallID, 'data:', newManager);
      const response = await authAPI.registerPacManager({
        name: newManager.name,
        surname: newManager.surname,
        gender: newManager.gender,
        contacts: newManager.contacts,
        email: newManager.email,
        password: newManager.password,
        type: newManager.type,
        username: newManager.email,
        mallManagerId: newManager.mallManagerId,
      });
      console.log('[StoresManager] registerPacManager Response:', JSON.stringify(response, null, 2));

      if (response.statusCode === 200) {
        setManagers((prev) => [
          ...prev,
          {
            id: response.data?.userID || Date.now(),
            roleID: response.data?.roleID || Date.now(),
            uName: newManager.name,
            uSurname: newManager.surname,
            uGender: newManager.gender,
            uPhone: newManager.contacts,
            uEmail: newManager.email,
            username: newManager.email,
            uType: newManager.type,
          },
        ]);
        setNewManager({
          name: '',
          surname: '',
          gender: '',
          contacts: '',
          email: '',
          password: '',
          type: 'ShopManager',
          mallManagerId: mallID,
        });
        setView('list');
        toast.success(
          <div className="flex flex-col space-y-2">
            <span className="font-semibold">Shop Manager Registered Successfully!</span>
            <span>{response.message || 'Email and temporary password sent to the new manager.'}</span>
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
        console.error('[StoresManager] Register manager failed:', response);
        toast.error(response.message || 'Failed to register Shop Manager.');
      }
    } catch (error: any) {
      console.error('[StoresManager] Register manager error:', {
        message: error.message || 'Unknown error',
        response: error.response
          ? {
              status: error.response.status,
              data: JSON.stringify(error.response.data, null, 2),
            }
          : 'No response data',
      });
      toast.error(error.message || 'Failed to register Shop Manager.');
    }
  };

  const handleEditManager = async () => {
    if (
      !editManager?.uName ||
      !editManager.uSurname ||
      !editManager.uGender ||
      !editManager.uPhone ||
      !editManager.uEmail
    ) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      console.log('[StoresManager] Updating manager:', editManager.id, 'data:', editManager);
      const response = await authAPI.updateManager({
        id: editManager.id,
        name: editManager.uName,
        surname: editManager.uSurname,
        gender: editManager.uGender,
        contacts: editManager.uPhone,
        email: editManager.uEmail,
        username: editManager.uEmail,
        type: editManager.uType,
      });
      console.log('[StoresManager] updateManager Response:', JSON.stringify(response, null, 2));
      if (response.statusCode === 200) {
        setManagers((prev) =>
          prev.map((m) => (m.id === editManager.id ? { ...editManager, username: editManager.uEmail } : m))
        );
        setEditManager(null);
        setView('list');
        toast.success('Shop Manager updated successfully!');
      } else {
        console.error('[StoresManager] Update manager failed:', response);
        toast.error(response.message || 'Failed to update Shop Manager.');
      }
    } catch (error: any) {
      console.error('[StoresManager] Edit manager error:', {
        message: error.message || 'Unknown error',
        response: error.response
          ? {
              status: error.response.status,
              data: JSON.stringify(error.response.data, null, 2),
            }
          : 'No response data',
      });
      toast.error(error.message || 'Failed to update Shop Manager.');
    }
  };

  const handleDeleteManager = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this Shop Manager?')) {
      try {
        console.log('[StoresManager] Deleting manager:', id);
        const response = await authAPI.deleteManager(id);
        console.log('[StoresManager] deleteManager Response:', JSON.stringify(response, null, 2));
        if (response.statusCode === 200) {
          setManagers((prev) => prev.filter((m) => m.id !== id));
          toast.success('Shop Manager deleted successfully!');
        } else {
          console.error('[StoresManager] Delete manager failed:', response);
          toast.error(response.message || 'Failed to delete Shop Manager.');
        }
      } catch (error: any) {
        console.error('[StoresManager] Delete manager error:', {
          message: error.message || 'Unknown error',
          response: error.response
            ? {
                status: error.response.status,
                data: JSON.stringify(error.response.data, null, 2),
              }
            : 'No response data',
        });
        toast.error(error.message || 'Failed to delete Shop Manager.');
      }
    }
  };

  const filteredManagers = managers.filter(
    (manager) =>
      `${manager.uName} ${manager.uSurname}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      manager.uEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center py-12">
        <div className="animate-pulse">
          <Briefcase className="h-12 w-12 text-green-600" />
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
            Back to Managers
          </Button>
        </div>
        <Card className="w-full shadow-lg border border-gray-100">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-2xl font-semibold text-green-600">Add Shop Manager</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">First Name</Label>
                <Input
                  id="name"
                  value={newManager.name}
                  onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
                  placeholder="Enter first name"
                  className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <Label htmlFor="surname" className="text-sm font-medium text-gray-700">Surname</Label>
                <Input
                  id="surname"
                  value={newManager.surname}
                  onChange={(e) => setNewManager({ ...newManager, surname: e.target.value })}
                  placeholder="Enter surname"
                  className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="gender" className="text-sm font-medium text-gray-700">Gender</Label>
              <Select
                value={newManager.gender}
                onValueChange={(value) => setNewManager({ ...newManager, gender: value })}
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
                value={newManager.contacts}
                onChange={(e) => setNewManager({ ...newManager, contacts: e.target.value })}
                placeholder="Enter phone number"
                className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={newManager.email}
                onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                placeholder="Enter email address"
                className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={newManager.password}
                onChange={(e) => setNewManager({ ...newManager, password: e.target.value })}
                placeholder="Enter password"
                className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <Label htmlFor="type" className="text-sm font-medium text-gray-700">Type</Label>
              <Input
                id="type"
                value={newManager.type}
                disabled
                className="mt-1 rounded-lg border-gray-300 bg-gray-100"
              />
            </div>
            <div>
              <Label htmlFor="mallManagerId" className="text-sm font-medium text-gray-700">Mall ID</Label>
              <Input
                id="mallManagerId"
                value={newManager.mallManagerId}
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
                onClick={handleAddManager}
              >
                Add Manager
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'edit' && editManager) {
    return (
      <div className="space-y-6 px-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setView('list')}
            className="text-green-600 hover:text-green-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Managers
          </Button>
        </div>
        <Card className="w-full shadow-lg border border-gray-100">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-2xl font-semibold text-green-600">Edit Shop Manager</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700">First Name</Label>
                <Input
                  id="edit-name"
                  value={editManager.uName}
                  onChange={(e) => setEditManager({ ...editManager, uName: e.target.value })}
                  placeholder="Enter first name"
                  className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-surname" className="text-sm font-medium text-gray-700">Surname</Label>
                <Input
                  id="edit-surname"
                  value={editManager.uSurname}
                  onChange={(e) => setEditManager({ ...editManager, uSurname: e.target.value })}
                  placeholder="Enter surname"
                  className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-gender" className="text-sm font-medium text-gray-700">Gender</Label>
              <Select
                value={editManager.uGender}
                onValueChange={(value) => setEditManager({ ...editManager, uGender: value })}
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
                value={editManager.uPhone}
                onChange={(e) => setEditManager({ ...editManager, uPhone: e.target.value })}
                placeholder="Enter phone number"
                className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editManager.uEmail}
                onChange={(e) =>
                  setEditManager({ ...editManager, uEmail: e.target.value, username: e.target.value })
                }
                placeholder="Enter email address"
                className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditManager(null)}
                className="rounded-lg border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 rounded-lg"
                onClick={handleEditManager}
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
        <h1 className="text-3xl font-bold text-green-600">Shop Managers</h1>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search managers..."
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
          <span>Add New Manager</span>
        </Button>
      </div>
      <div>
        <h2 className="text-green-600 text-lg font-medium mb-4">Available Managers</h2>
        <Card className="bg-white rounded-lg border shadow-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ManagerID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredManagers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    No shop managers available.
                  </TableCell>
                </TableRow>
              ) : (
                filteredManagers.map((manager) => (
                  <TableRow key={manager.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell>{String(manager.roleID).padStart(4, '0')}</TableCell>
                    <TableCell>{`${manager.uName} ${manager.uSurname}`}</TableCell>
                    <TableCell>{manager.uPhone || 'N/A'}</TableCell>
                    <TableCell>{manager.uEmail}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditManager(manager);
                          setView('edit');
                        }}
                      >
                        <Edit className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteManager(manager.id)}
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