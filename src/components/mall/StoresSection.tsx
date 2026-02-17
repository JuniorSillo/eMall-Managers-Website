// 'use client';

// import { useState, useEffect } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { authAPI } from '@/lib/api';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Badge } from '@/components/ui/badge';
// import { ArrowLeft, Search, Edit, Plus, Trash, Briefcase } from 'lucide-react';
// import { toast } from 'sonner';
// import { Shop } from '@/lib/authTypes';

// interface ShopManager {
//   userID: number;
//   roleID: number;
//   uName: string;
//   uSurname: string;
// }

// interface AuthContextUser {
//   id?: number;
//   mallID?: number;
// }

// export default function StoresSection() {
//   const { user } = useAuth() as { user: AuthContextUser | null };
//   const [view, setView] = useState<'list' | 'add' | 'details'>('list');
//   const [selectedStore, setSelectedStore] = useState<Shop | null>(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [stores, setStores] = useState<Shop[]>([]);
//   const [managers, setManagers] = useState<ShopManager[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [mallID, setMallID] = useState<string>('');

//   const [newStore, setNewStore] = useState({
//     shopName: '',
//     shopType: '',
//     mangrID: '',
//     mallID: '',
//     image: undefined as File | undefined,
//   });

//   useEffect(() => {
//     const fetchData = async () => {
//       if (!user?.id) {
//         console.error('[StoresSection] User ID not found:', user);
//         toast.error('User ID not found. Please log in again.');
//         return;
//       }

//       setLoading(true);
//       try {
//         // Fetch roleID for Mall Manager
//         console.log('[StoresSection] Fetching user by ID:', user.id);
//         const userResponse = await authAPI.getUserById(Number(user.id));
//         console.log('[StoresSection] getUserById Response:', JSON.stringify(userResponse, null, 2));
//         const roleID = userResponse?.roleID;
//         if (!roleID || typeof roleID !== 'number') {
//           console.error('[StoresSection] Invalid or missing roleID:', userResponse);
//           throw new Error('User role ID not found.');
//         }

//         // Fetch mall ID
//         let fetchedMallID: number;
//         if (user.mallID && typeof user.mallID === 'number') {
//           console.log('[StoresSection] Using mallID from AuthContext:', user.mallID);
//           fetchedMallID = user.mallID;
//         } else {
//           console.log('[StoresSection] Fetching mall ID for roleID:', roleID);
//           const mallIdResponse = await authAPI.getMallIdByManagerId(roleID);
//           console.log('[StoresSection] getMallIdByManagerId Response:', JSON.stringify(mallIdResponse, null, 2));
//           fetchedMallID = mallIdResponse?.mallID;
//           if (!fetchedMallID || typeof fetchedMallID !== 'number') {
//             console.error('[StoresSection] Invalid or missing mallID:', mallIdResponse);
//             throw new Error('Mall ID not found for manager.');
//           }
//         }
//         setMallID(fetchedMallID.toString());
//         setNewStore((prev) => ({ ...prev, mallID: fetchedMallID.toString() }));

//         // Fetch managers
//         console.log('[StoresSection] Fetching shop managers for mallID:', fetchedMallID);
//         const managersResponse = await authAPI.getShopManagers(fetchedMallID);
//         console.log('[StoresSection] getShopManagers Response:', JSON.stringify(managersResponse, null, 2));
//         if (!Array.isArray(managersResponse)) {
//           console.error('[StoresSection] getShopManagers did not return an array:', managersResponse);
//           throw new Error('Invalid shop managers data format.');
//         }

//         const fetchedManagers = managersResponse
//           .map((m: any) => {
//             if (!m?.uName || !m?.uSurname || !m?.roleID || m.uName === '---' || m.uSurname === '---') {
//               console.warn('[StoresSection] Invalid manager data:', m);
//               return null;
//             }
//             return {
//               userID: m.userID || m.roleID,
//               roleID: m.roleID,
//               uName: m.uName,
//               uSurname: m.uSurname,
//             };
//           })
//           .filter((m: ShopManager | null) => m !== null) as ShopManager[];

//         if (fetchedManagers.length === 0) {
//           console.warn('[StoresSection] No valid managers found for mallID:', fetchedMallID);
//           toast.info('No shop managers found for this mall.');
//         }
//         setManagers(fetchedManagers);

//         // Fetch all shops for the mall
//         console.log('[StoresSection] Fetching all shops for mallID:', fetchedMallID);
//         const allShopsResponse = await authAPI.getShops(fetchedMallID);
//         if (!Array.isArray(allShopsResponse)) {
//           console.error('[StoresSection] getShops did not return an array:', allShopsResponse);
//           throw new Error('Invalid shops data format.');
//         }

//         // Fetch shop IDs for each manager
//         const managerShopIds: { [key: number]: number } = {};
//         for (const manager of fetchedManagers) {
//           try {
//             const shopId = await authAPI.getShopByMngrID(manager.roleID);
//             console.log(`[StoresSection] getShopByMngrID Response for roleID ${manager.roleID}:`, shopId);
//             if (typeof shopId === 'number') {
//               managerShopIds[manager.roleID] = shopId;
//             } else {
//               console.warn(`[StoresSection] Invalid shopId for roleID ${manager.roleID}:`, shopId);
//             }
//           } catch (error: any) {
//             console.warn(`[StoresSection] No shop found for manager roleID ${manager.roleID}:`, error.message);
//           }
//         }

//         // Fetch full shop details for manager-assigned shops
//         const allShops: Shop[] = [];
//         for (const [roleID, shopId] of Object.entries(managerShopIds)) {
//           try {
//             const shopResponse = await authAPI.getShopByID(Number(shopId));
//             console.log(`[StoresSection] getShopByID Response for shopId ${shopId}:`, JSON.stringify(shopResponse, null, 2));
//             const shopData = shopResponse.dto;
//             const manager = fetchedManagers.find((m) => m.roleID === Number(roleID));
//             allShops.push({
//               id: shopData.id,
//               shopName: shopData.shopName,
//               shopType: shopData.shopType || 'Unknown',
//               mangrID: shopData.mangrID || Number(roleID),
//               mallID: fetchedMallID,
//               managerName: manager ? `${manager.uName} ${manager.uSurname}` : 'Unassigned',
//               shopImage: shopData.shopImage,
//               imageBase64: shopResponse.imageBase64,
//             });
//           } catch (error: any) {
//             console.warn(`[StoresSection] Failed to fetch shop details for shopId ${shopId}:`, error.message);
//           }
//         }

//         // Include unassigned shops from getShops
//         allShopsResponse.forEach((s: { dto: any; imageBase64?: string }) => {
//           const shopData = s.dto;
//           if (!allShops.find((shop) => shop.id === shopData.id)) {
//             const mangrID = shopData.mangrID || 0;
//             const manager = fetchedManagers.find((m) => m.roleID === mangrID);
//             allShops.push({
//               id: shopData.id,
//               shopName: shopData.shopName,
//               shopType: shopData.shopType || 'Unknown',
//               mangrID,
//               mallID: fetchedMallID,
//               managerName: manager ? `${manager.uName} ${manager.uSurname}` : 'Unassigned',
//               shopImage: shopData.shopImage,
//               imageBase64: s.imageBase64,
//             });
//           }
//         });

//         setStores(allShops);
//         if (allShops.length === 0) {
//           console.warn('[StoresSection] No stores found for mallID:', fetchedMallID);
//           toast.info('No stores found for this mall.');
//         } else {
//           console.log('[StoresSection] Stores loaded:', JSON.stringify(allShops, null, 2));
//         }
//       } catch (error: any) {
//         console.error('[StoresSection] Failed to fetch stores or managers:', {
//           message: error.message || 'Unknown error',
//           name: error.name || 'Unknown',
//           stack: error.stack || 'No stack trace',
//           response: error.response
//             ? {
//                 status: error.response.status,
//                 data: JSON.stringify(error.response.data, null, 2),
//                 headers: JSON.stringify(error.response.headers, null, 2),
//               }
//             : 'No response data',
//           userId: user?.id,
//           mallId: user?.mallID,
//           timestamp: new Date().toISOString(),
//         });
//         toast.error(error.message || 'Failed to load stores or managers.');
//         setStores([]);
//         setManagers([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [user?.id, user?.mallID]);

//   const handleAddStore = async () => {
//     if (!newStore.shopName || !newStore.shopType || !newStore.mangrID || !newStore.mallID) {
//       toast.error('Please fill in all required fields');
//       return;
//     }

//     try {
//       console.log('[StoresSection] Adding new store:', newStore);
//       const response = await authAPI.addShop({
//         ShopName: newStore.shopName,
//         ShopType: newStore.shopType,
//         MangrID: Number(newStore.mangrID),
//         MallID: Number(newStore.mallID),
//         image: newStore.image,
//       });
//       console.log('[StoresSection] addShop Response:', JSON.stringify(response, null, 2));

//       if (response.statusCode === 200) {
//         const newShopId = response.data?.shopId || Date.now();
//         const manager = managers.find((m) => m.roleID === Number(newStore.mangrID));
//         const managerName = manager ? `${manager.uName} ${manager.uSurname}` : 'Unassigned';

//         setStores((prev) => [
//           ...prev,
//           {
//             id: newShopId,
//             shopName: newStore.shopName,
//             shopType: newStore.shopType,
//             mangrID: Number(newStore.mangrID),
//             mallID: Number(newStore.mallID),
//             managerName,
//             shopImage: response.data?.shopImage,
//             imageBase64: response.data?.imageBase64,
//           },
//         ]);
//         setNewStore({
//           shopName: '',
//           shopType: '',
//           mangrID: '',
//           mallID: newStore.mallID,
//           image: undefined,
//         });
//         setView('list');
//         toast.success('Store added successfully!');
//       } else {
//         console.error('[StoresSection] Add store failed:', response);
//         toast.error(response.message || 'Failed to add store');
//       }
//     } catch (error: any) {
//       console.error('[StoresSection] Add store error:', {
//         message: error.message || 'Unknown error',
//         response: error.response
//           ? {
//               status: error.response.status,
//               data: JSON.stringify(error.response.data, null, 2),
//             }
//           : 'No response data',
//       });
//       toast.error(error.message || 'Failed to add store');
//     }
//   };

//   const handleDeleteStore = async (shopId: number) => {
//     if (window.confirm('Are you sure you want to delete this store?')) {
//       try {
//         console.log('[StoresSection] Deleting store:', shopId);
//         const response = await authAPI.deleteShop(shopId);
//         console.log('[StoresSection] deleteShop Response:', JSON.stringify(response, null, 2));
//         if (response.statusCode === 200) {
//           setStores((prev) => prev.filter((s) => s.id !== shopId));
//           toast.success('Store deleted successfully!');
//         } else {
//           console.error('[StoresSection] Delete store failed:', response);
//           toast.error(response.message || 'Failed to delete store');
//         }
//       } catch (error: any) {
//         console.error('[StoresSection] Delete store error:', {
//           message: error.message || 'Unknown error',
//           response: error.response
//             ? {
//                 status: error.response.status,
//                 data: JSON.stringify(error.response.data, null, 2),
//               }
//             : 'No response data',
//         });
//         toast.error(error.message || 'Failed to delete store');
//       }
//     }
//   };

//   const handleViewStore = (store: Shop) => {
//     setSelectedStore(store);
//     setView('details');
//   };

//   const filteredStores = stores.filter(
//     (store) =>
//       store.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       store.managerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       store.shopType.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   if (loading) {
//     return (
//       <div className="w-full h-screen flex items-center justify-center py-12">
//         <div className="animate-pulse">
//           <Briefcase className="h-12 w-12 text-green-600" />
//         </div>
//       </div>
//     );
//   }

//   if (view === 'add') {
//     return (
//       <div className="space-y-6 px-4">
//         <div className="flex items-center space-x-4">
//           <Button
//             variant="ghost"
//             onClick={() => setView('list')}
//             className="text-green-600 hover:text-green-800"
//           >
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Back to Stores
//           </Button>
//         </div>
//         <Card className="w-full shadow-lg border border-gray-100">
//           <CardHeader className="bg-green-50">
//             <CardTitle className="text-2xl font-semibold text-green-600">Add New Store</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-6 p-6">
//             <div>
//               <Label htmlFor="shopName" className="text-sm font-medium text-gray-700">Store Name</Label>
//               <Input
//                 id="shopName"
//                 value={newStore.shopName}
//                 onChange={(e) => setNewStore({ ...newStore, shopName: e.target.value })}
//                 placeholder="Enter store name"
//                 className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
//               />
//             </div>
//             <div>
//               <Label htmlFor="shopType" className="text-sm font-medium text-gray-700">Store Type</Label>
//               <Input
//                 id="shopType"
//                 value={newStore.shopType}
//                 onChange={(e) => setNewStore({ ...newStore, shopType: e.target.value })}
//                 placeholder="e.g., Retail, Restaurant, etc."
//                 className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
//               />
//             </div>
//             <div>
//               <Label htmlFor="mangrID" className="text-sm font-medium text-gray-700">Shop Manager</Label>
//               <Select
//                 value={newStore.mangrID}
//                 onValueChange={(value) => setNewStore({ ...newStore, mangrID: value })}
//               >
//                 <SelectTrigger className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500">
//                   <SelectValue placeholder="Select shop manager" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {managers.map((manager) => (
//                     <SelectItem key={manager.roleID} value={manager.roleID.toString()}>
//                       {`${manager.uName} ${manager.uSurname}`}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div>
//               <Label htmlFor="mallID" className="text-sm font-medium text-gray-700">Mall ID</Label>
//               <Input
//                 id="mallID"
//                 value={newStore.mallID}
//                 disabled
//                 className="mt-1 rounded-lg border-gray-300 bg-gray-100"
//               />
//             </div>
//             <div>
//               <Label htmlFor="image" className="text-sm font-medium text-gray-700">Store Image</Label>
//               <Input
//                 id="image"
//                 type="file"
//                 accept="image/*"
//                 onChange={(e) => setNewStore({ ...newStore, image: e.target.files?.[0] })}
//                 className="mt-1 rounded-lg border-gray-300"
//               />
//             </div>
//             <div className="flex justify-end space-x-3 pt-4">
//               <Button
//                 variant="outline"
//                 onClick={() => setView('list')}
//                 className="rounded-lg border-gray-300 hover:bg-gray-100"
//               >
//                 Cancel
//               </Button>
//               <Button
//                 className="bg-green-600 hover:bg-green-700 rounded-lg"
//                 onClick={handleAddStore}
//               >
//                 Add Store
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   if (view === 'details' && selectedStore) {
//     return (
//       <div className="space-y-6 px-4">
//         <div className="flex items-center space-x-4">
//           <Button
//             variant="ghost"
//             onClick={() => setView('list')}
//             className="text-green-600 hover:text-green-800"
//           >
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Back to Stores
//           </Button>
//           <div className="flex items-center space-x-4">
//             <span className="text-sm text-gray-600">Store no</span>
//             <span className="font-medium">{selectedStore.id}</span>
//             <span className="text-sm text-gray-600 ml-8">Store type</span>
//             <span className="font-medium">{selectedStore.shopType}</span>
//           </div>
//         </div>
//         <Card className="w-full shadow-lg border border-gray-100">
//           <CardHeader className="bg-green-50">
//             <CardTitle className="text-2xl font-semibold text-green-600">Store Details</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-6 p-6">
//             {selectedStore.imageBase64 && (
//               <div>
//                 <Label className="text-sm font-medium text-gray-700">Store Image</Label>
//                 <img
//                   src={`data:image/jpeg;base64,${selectedStore.imageBase64}`}
//                   alt={selectedStore.shopName}
//                   className="w-full h-48 object-cover rounded-lg"
//                 />
//               </div>
//             )}
//             <div>
//               <Label className="text-sm font-medium text-gray-700">Manager Name</Label>
//               <Input
//                 value={selectedStore.managerName}
//                 disabled
//                 className="mt-1 rounded-lg border-gray-300 bg-gray-100"
//               />
//             </div>
//             <div>
//               <Label className="text-sm font-medium text-gray-700">Store Name</Label>
//               <Input
//                 value={selectedStore.shopName}
//                 disabled
//                 className="mt-1 rounded-lg border-gray-300 bg-gray-100"
//               />
//             </div>
//             <div>
//               <Label className="text-sm font-medium text-gray-700">Store Type</Label>
//               <Input
//                 value={selectedStore.shopType}
//                 disabled
//                 className="mt-1 rounded-lg border-gray-300 bg-gray-100"
//               />
//             </div>
//             <div className="flex items-center justify-between pt-4">
//               <div className="flex items-center space-x-2">
//                 <span className="text-sm font-medium text-gray-700">Status</span>
//                 <Badge className="bg-green-100 text-green-700">Available</Badge>
//               </div>
//               <Button
//                 variant="ghost"
//                 onClick={() => handleDeleteStore(selectedStore.id)}
//                 className="text-red-600 hover:text-red-700"
//               >
//                 <Trash className="h-4 w-4 mr-2" />
//                 Delete Store
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6 px-4">
//       <div>
//         <h1 className="text-3xl font-bold text-green-600">Stores</h1>
//       </div>
//       <div className="relative max-w-md">
//         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//         <Input
//           placeholder="Search stores..."
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//           className="pl-10 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
//         />
//       </div>
//       <div className="flex items-center space-x-4">
//         <Button
//           className="bg-green-600 hover:bg-green-700 flex items-center space-x-2 rounded-lg"
//           onClick={() => setView('add')}
//         >
//           <Plus className="h-4 w-4" />
//           <span>Add New Store</span>
//         </Button>
//       </div>
//       <div>
//         <h2 className="text-green-600 text-lg font-medium mb-4">Available Stores</h2>
//         <Card className="bg-white rounded-lg border shadow-lg">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Shop ID</TableHead>
//                 <TableHead>Manager Name</TableHead>
//                 <TableHead>Store Name</TableHead>
//                 <TableHead>Store Type</TableHead>
//                 <TableHead>Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {filteredStores.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={5} className="text-center text-gray-500">
//                     No stores available.
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 filteredStores.map((store) => (
//                   <TableRow
//                     key={store.id}
//                     className="cursor-pointer hover:bg-gray-50"
//                     onClick={() => handleViewStore(store)}
//                   >
//                     <TableCell>{store.id}</TableCell>
//                     <TableCell>{store.managerName}</TableCell>
//                     <TableCell>{store.shopName}</TableCell>
//                     <TableCell>{store.shopType}</TableCell>
//                     <TableCell>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleViewStore(store);
//                         }}
//                       >
//                         <Edit className="h-4 w-4 text-green-600" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleDeleteStore(store.id);
//                         }}
//                       >
//                         <Trash className="h-4 w-4 text-red-500" />
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </Card>
//       </div>
//     </div>
//   );
// }


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
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Edit, Plus, Trash, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { Shop } from '@/lib/authTypes';

interface ShopManager {
  userID: number;
  roleID: number;
  uName: string;
  uSurname: string;
  uEmail: string;
}

interface AuthContextUser {
  id?: number;
  mallID?: number;
}

export default function StoresSection() {
  const { user } = useAuth() as { user: AuthContextUser | null };
  const [view, setView] = useState<'list' | 'add' | 'details'>('list');
  const [selectedStore, setSelectedStore] = useState<Shop | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stores, setStores] = useState<Shop[]>([]);
  const [managers, setManagers] = useState<ShopManager[]>([]);
  const [loading, setLoading] = useState(false);
  const [mallID, setMallID] = useState<string>('');

  const [newStore, setNewStore] = useState({
    shopName: '',
    shopType: '',
    mangrID: '' as string | number,
    mallID: '',
    image: undefined as File | undefined,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        console.error('[StoresSection] User ID not found:', user);
        toast.error('User ID not found. Please log in again.');
        return;
      }

      setLoading(true);
      try {
        // Fetch roleID for Mall Manager
        console.log('[StoresSection] Fetching user by ID:', user.id);
        const userResponse = await authAPI.getUserById(Number(user.id));
        console.log('[StoresSection] getUserById Response:', JSON.stringify(userResponse, null, 2));
        const roleID = userResponse?.roleID;
        if (!roleID || typeof roleID !== 'number') {
          console.error('[StoresSection] Invalid or missing roleID:', userResponse);
          throw new Error('User role ID not found.');
        }

        // Fetch mall ID
        let fetchedMallID: number;
        if (user.mallID && typeof user.mallID === 'number') {
          console.log('[StoresSection] Using mallID from AuthContext:', user.mallID);
          fetchedMallID = user.mallID;
        } else {
          console.log('[StoresSection] Fetching mall ID for roleID:', roleID);
          const mallIdResponse = await authAPI.getMallIdByManagerId(roleID);
          console.log('[StoresSection] getMallIdByManagerId Response:', JSON.stringify(mallIdResponse, null, 2));
          fetchedMallID = mallIdResponse?.mallID;
          if (!fetchedMallID || typeof fetchedMallID !== 'number') {
            console.error('[StoresSection] Invalid or missing mallID:', mallIdResponse);
            throw new Error('Mall ID not found for manager.');
          }
        }
        setMallID(fetchedMallID.toString());
        setNewStore((prev) => ({ ...prev, mallID: fetchedMallID.toString() }));

        // Fetch managers
        console.log('[StoresSection] Fetching shop managers for mallID:', fetchedMallID);
        const managersResponse = await authAPI.getShopManagers(fetchedMallID);
        console.log('[StoresSection] getShopManagers Raw Response:', JSON.stringify(managersResponse, null, 2));
        if (!Array.isArray(managersResponse)) {
          console.error('[StoresSection] getShopManagers did not return an array:', managersResponse);
          throw new Error('Invalid shop managers data format.');
        }

        const fetchedManagers = managersResponse
          .map((m: any) => {
            if (!m?.roleID) {
              console.warn('[StoresSection] Invalid manager data (missing roleID):', m);
              return null;
            }
            return {
              userID: m.userID || m.roleID,
              roleID: m.roleID,
              uName: m.uName || '',
              uSurname: m.uSurname || '',
              uEmail: m.uEmail || 'Unknown',
            };
          })
          .filter((m: ShopManager | null) => m !== null) as ShopManager[];

        if (fetchedManagers.length === 0) {
          console.warn('[StoresSection] No valid managers found for mallID:', fetchedMallID);
          toast.info('No shop managers found for this mall.');
        }
        setManagers(fetchedManagers);

        // Fetch all shops for the mall
        console.log('[StoresSection] Fetching all shops for mallID:', fetchedMallID);
        const allShopsResponse = await authAPI.getShops(fetchedMallID);
        if (!Array.isArray(allShopsResponse)) {
          console.error('[StoresSection] getShops did not return an array:', allShopsResponse);
          throw new Error('Invalid shops data format.');
        }

        // Fetch shop IDs for each manager
        const managerShopIds: { [key: number]: number } = {};
        for (const manager of fetchedManagers) {
          try {
            const shopId = await authAPI.getShopByMngrID(manager.roleID);
            console.log(`[StoresSection] getShopByMngrID Response for roleID ${manager.roleID}:`, shopId);
            if (typeof shopId === 'number') {
              managerShopIds[manager.roleID] = shopId;
            } else {
              console.log(`[StoresSection] No shop assigned to manager roleID ${manager.roleID}`);
            }
          } catch (error: any) {
            if (error.response?.status === 404) {
              console.log(`[StoresSection] No shop assigned to manager roleID ${manager.roleID}`);
            } else {
              console.warn(`[StoresSection] Error fetching shop for manager roleID ${manager.roleID}:`, error.message);
            }
          }
        }

        // Fetch full shop details for manager-assigned shops
        const allShops: Shop[] = [];
        for (const [roleID, shopId] of Object.entries(managerShopIds)) {
          try {
            const shopResponse = await authAPI.getShopByID(Number(shopId));
            console.log(`[StoresSection] getShopByID Response for shopId ${shopId}:`, JSON.stringify(shopResponse, null, 2));
            const shopData = shopResponse.dto;
            const manager = fetchedManagers.find((m) => m.roleID === Number(roleID));
            allShops.push({
              id: shopData.id,
              shopName: shopData.shopName,
              shopType: shopData.shopType || 'Unknown',
              mangrID: shopData.mangrID || Number(roleID),
              mallID: fetchedMallID,
              managerName: manager ? `${manager.uName} ${manager.uSurname}` : 'Unassigned',
              shopImage: shopData.shopImage,
              imageBase64: shopResponse.imageBase64,
            });
          } catch (error: any) {
            console.warn(`[StoresSection] Failed to fetch shop details for shopId ${shopId}:`, error.message);
          }
        }

        // Include unassigned shops from getShops
        allShopsResponse.forEach((s: { dto: any; imageBase64?: string }) => {
          const shopData = s.dto;
          if (!allShops.find((shop) => shop.id === shopData.id)) {
            const mangrID = shopData.mangrID || 0;
            const manager = fetchedManagers.find((m) => m.roleID === mangrID);
            allShops.push({
              id: shopData.id,
              shopName: shopData.shopName,
              shopType: shopData.shopType || 'Unknown',
              mangrID,
              mallID: fetchedMallID,
              managerName: manager ? `${manager.uName} ${manager.uSurname}` : 'Unassigned',
              shopImage: shopData.shopImage,
              imageBase64: s.imageBase64,
            });
          }
        });

        setStores(allShops);
        if (allShops.length === 0) {
          console.warn('[StoresSection] No stores found for mallID:', fetchedMallID);
          toast.info('No stores found for this mall.');
        } else {
          console.log('[StoresSection] Stores loaded:', JSON.stringify(allShops, null, 2));
        }
      } catch (error: any) {
        console.error('[StoresSection] Failed to fetch stores or managers:', {
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
        toast.error(error.message || 'Failed to load stores or managers.');
        setStores([]);
        setManagers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, user?.mallID]);

  const handleAddStore = async () => {
    if (!newStore.shopName || !newStore.shopType || !newStore.mallID) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      console.log('[StoresSection] Adding new store:', newStore);
      const response = await authAPI.addShop({
        ShopName: newStore.shopName,
        ShopType: newStore.shopType,
        MangrID: newStore.mangrID ? Number(newStore.mangrID) : 0,
        MallID: Number(newStore.mallID),
        image: newStore.image,
      });
      console.log('[StoresSection] addShop Response:', JSON.stringify(response, null, 2));

      if (response.statusCode === 200) {
        const newShopId = response.data?.shopId || Date.now();
        const manager = newStore.mangrID
          ? managers.find((m) => m.roleID === Number(newStore.mangrID))
          : null;
        const managerName = manager ? `${manager.uName} ${manager.uSurname}` : 'Unassigned';

        setStores((prev) => [
          ...prev,
          {
            id: newShopId,
            shopName: newStore.shopName,
            shopType: newStore.shopType,
            mangrID: newStore.mangrID ? Number(newStore.mangrID) : 0,
            mallID: Number(newStore.mallID),
            managerName,
            shopImage: response.data?.shopImage,
            imageBase64: response.data?.imageBase64,
          },
        ]);
        setNewStore({
          shopName: '',
          shopType: '',
          mangrID: '',
          mallID: newStore.mallID,
          image: undefined,
        });
        setView('list');
        toast.success('Store added successfully!');
      } else {
        console.error('[StoresSection] Add store failed:', response);
        toast.error(response.message || 'Failed to add store');
      }
    } catch (error: any) {
      console.error('[StoresSection] Add store error:', {
        message: error.message || 'Unknown error',
        response: error.response
          ? {
              status: error.response.status,
              data: JSON.stringify(error.response.data, null, 2),
            }
          : 'No response data',
      });
      toast.error(error.message || 'Failed to add store');
    }
  };

  const handleDeleteStore = async (shopId: number) => {
    if (window.confirm('Are you sure you want to delete this store?')) {
      try {
        console.log('[StoresSection] Deleting store:', shopId);
        const response = await authAPI.deleteShop(shopId);
        console.log('[StoresSection] deleteShop Response:', JSON.stringify(response, null, 2));
        if (response.statusCode === 200) {
          setStores((prev) => prev.filter((s) => s.id !== shopId));
          toast.success('Store deleted successfully!');
        } else {
          console.error('[StoresSection] Delete store failed:', response);
          toast.error(response.message || 'Failed to delete store');
        }
      } catch (error: any) {
        console.error('[StoresSection] Delete store error:', {
          message: error.message || 'Unknown error',
          response: error.response
            ? {
              status: error.response.status,
              data: JSON.stringify(error.response.data, null, 2),
            }
          : 'No response data',
        });
        toast.error(error.message || 'Failed to delete store');
      }
    }
  };

  const handleViewStore = (store: Shop) => {
    setSelectedStore(store);
    setView('details');
  };

  const filteredStores = stores.filter(
    (store) =>
      store.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.managerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.shopType.toLowerCase().includes(searchQuery.toLowerCase())
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
            Back to Stores
          </Button>
        </div>
        <Card className="w-full shadow-lg border border-gray-100">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-2xl font-semibold text-green-600">Add New Store</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div>
              <Label htmlFor="shopName" className="text-sm font-medium text-gray-700">Store Name</Label>
              <Input
                id="shopName"
                value={newStore.shopName}
                onChange={(e) => setNewStore({ ...newStore, shopName: e.target.value })}
                placeholder="Enter store name"
                className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <Label htmlFor="shopType" className="text-sm font-medium text-gray-700">Store Type</Label>
              <Input
                id="shopType"
                value={newStore.shopType}
                onChange={(e) => setNewStore({ ...newStore, shopType: e.target.value })}
                placeholder="e.g., Retail, Restaurant, etc."
                className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <Label htmlFor="mangrID" className="text-sm font-medium text-gray-700">Shop Manager</Label>
              <Select
                value={newStore.mangrID}
                onValueChange={(value : number) => setNewStore({ ...newStore, mangrID: value.toString() })}

              >
                <SelectTrigger className="mt-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500">
                  <SelectValue placeholder="Select shop manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Unassigned</SelectItem>
                  {managers.map((manager) => (
                    <SelectItem key={manager.roleID} value={manager.roleID.toString()}>
                      {manager.uName && manager.uSurname ? `${manager.uName} ${manager.uSurname}` : manager.uEmail}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mallID" className="text-sm font-medium text-gray-700">Mall ID</Label>
              <Input
                id="mallID"
                value={newStore.mallID}
                disabled
                className="mt-1 rounded-lg border-gray-300 bg-gray-100"
              />
            </div>
            <div>
              <Label htmlFor="image" className="text-sm font-medium text-gray-700">Store Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setNewStore({ ...newStore, image: e.target.files?.[0] })}
                className="mt-1 rounded-lg border-gray-300"
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
                onClick={handleAddStore}
              >
                Add Store
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'details' && selectedStore) {
    return (
      <div className="space-y-6 px-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setView('list')}
            className="text-green-600 hover:text-green-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Stores
          </Button>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Store no</span>
            <span className="font-medium">{selectedStore.id}</span>
            <span className="text-sm text-gray-600 ml-8">Store type</span>
            <span className="font-medium">{selectedStore.shopType}</span>
          </div>
        </div>
        <Card className="w-full shadow-lg border border-gray-100">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-2xl font-semibold text-green-600">Store Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {selectedStore.imageBase64 && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Store Image</Label>
                <img
                  src={`data:image/jpeg;base64,${selectedStore.imageBase64}`}
                  alt={selectedStore.shopName}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
            <div>
              <Label className="text-sm font-medium text-gray-700">Manager Name</Label>
              <Input
                value={selectedStore.managerName}
                disabled
                className="mt-1 rounded-lg border-gray-300 bg-gray-100"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Store Name</Label>
              <Input
                value={selectedStore.shopName}
                disabled
                className="mt-1 rounded-lg border-gray-300 bg-gray-100"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Store Type</Label>
              <Input
                value={selectedStore.shopType}
                disabled
                className="mt-1 rounded-lg border-gray-300 bg-gray-100"
              />
            </div>
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Status</span>
                <Badge className="bg-green-100 text-green-700">Available</Badge>
              </div>
              <Button
                variant="ghost"
                onClick={() => handleDeleteStore(selectedStore.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete Store
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
        <h1 className="text-3xl font-bold text-green-600">Stores</h1>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search stores..."
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
          <span>Add New Store</span>
        </Button>
      </div>
      <div>
        <h2 className="text-green-600 text-lg font-medium mb-4">Available Stores</h2>
        <Card className="bg-white rounded-lg border shadow-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop ID</TableHead>
                <TableHead>Manager Name</TableHead>
                <TableHead>Store Name</TableHead>
                <TableHead>Store Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    No stores available.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStores.map((store) => (
                  <TableRow
                    key={store.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleViewStore(store)}
                  >
                    <TableCell>{store.id}</TableCell>
                    <TableCell>{store.managerName}</TableCell>
                    <TableCell>{store.shopName}</TableCell>
                    <TableCell>{store.shopType}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewStore(store);
                        }}
                      >
                        <Edit className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStore(store.id);
                        }}
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