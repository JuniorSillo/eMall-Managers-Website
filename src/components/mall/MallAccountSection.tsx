// 'use client';

// import { useState, useEffect } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { useRouter } from 'next/navigation';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Separator } from '@/components/ui/separator';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Badge } from '@/components/ui/badge';
// import { 
//   Edit, 
//   Upload, 
//   Save, 
//   X, 
//   User, 
//   Phone, 
//   Mail, 
//   MapPin, 
//   Building, 
//   Shield,
//   LogOut,
//   Trash2,
//   Camera
// } from 'lucide-react';
// import { toast } from 'sonner';

// interface UserProfile {
//   id: string;
//   name: string;
//   contacts: string;
//   email: string;
//   mallName: string;
//   address: string;
//   profileImage?: string;
//   accountNumber: string;
//   role: string;
// }

// export default function MallAccountSection() {
//   const { user, logout } = useAuth();
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);
//   const [isEditing, setIsEditing] = useState({
//     contacts: false,
//     email: false,
//     mallName: false,
//     address: false
//   });

//   const [userProfile, setUserProfile] = useState<UserProfile>({
//     id: user?.id || '',
//     name: user?.name || '',
//     contacts: user?.contacts || '',
//     email: user?.email || '',
//     mallName: user?.mallName || 'Sandton City Mall',
//     address: user?.address || 'Sandton Drive, Sandton, Johannesburg, 2196',
//     profileImage: user?.profileImage || '',
//     accountNumber: user?.accountNumber || 'MM225JM890' ,
//     role: user?.role || 'Mall Manager'
//   });

//   // Fetch user profile data from backend
//   useEffect(() => {
//     const fetchUserProfile = async () => {
//       if (!user?.id) return;
      
//       setLoading(true);
//       try {
//         const response = await fetch(`/api/user/profile/${user.id}`, {
//           method: 'GET',
//           headers: {
//             'Authorization': `Bearer ${user.token}`,
//             'Content-Type': 'application/json'
//           }
//         });

//         if (response.ok) {
//           const profileData = await response.json();
//           setUserProfile(prev => ({
//             ...prev,
//             ...profileData,
//             accountNumber: profileData.accountNumber || prev.accountNumber
//           }));
//         }
//       } catch (error) {
//         console.error('Failed to fetch user profile:', error);
//         toast.error('Failed to load profile information');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUserProfile();
//   }, [user?.id, user?.token]);

//   const handleEdit = (field: keyof typeof isEditing) => {
//     setIsEditing(prev => ({ ...prev, [field]: !prev[field] }));
//   };

//   const handleSave = async (field: keyof typeof isEditing) => {
//     setLoading(true);
//     try {
//       const response = await fetch(`/api/user/profile/${user?.id}`, {
//         method: 'PATCH',
//         headers: {
//           'Authorization': `Bearer ${user?.token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           [field]: userProfile[field as keyof UserProfile]
//         })
//       });

//       if (response.ok) {
//         setIsEditing(prev => ({ ...prev, [field]: false }));
//         toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);
//       } else {
//         throw new Error('Failed to update profile');
//       }
//     } catch (error) {
//       console.error(`Failed to update ${field}:`, error);
//       toast.error(`Failed to update ${field}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = (field: keyof typeof isEditing) => {
//     setIsEditing(prev => ({ ...prev, [field]: false }));
//     // Reset field to original value if needed
//   };

//   const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     const formData = new FormData();
//     formData.append('profileImage', file);

//     setLoading(true);
//     try {
//       const response = await fetch(`/api/user/profile/${user?.id}/image`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${user?.token}`
//         },
//         body: formData
//       });

//       if (response.ok) {
//         const { imageUrl } = await response.json();
//         setUserProfile(prev => ({ ...prev, profileImage: imageUrl }));
//         toast.success('Profile image updated successfully');
//       } else {
//         throw new Error('Failed to upload image');
//       }
//     } catch (error) {
//       console.error('Failed to upload image:', error);
//       toast.error('Failed to upload profile image');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSignOut = async () => {
//     try {
//       await logout();
//       router.push('/login');
//       toast.success('Signed out successfully');
//     } catch (error) {
//       console.error('Sign out error:', error);
//       toast.error('Failed to sign out');
//     }
//   };

//   const handleDeleteAccount = async () => {
//     if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
//       setLoading(true);
//       try {
//         const response = await fetch(`/api/user/profile/${user?.id}`, {
//           method: 'DELETE',
//           headers: {
//             'Authorization': `Bearer ${user?.token}`,
//             'Content-Type': 'application/json'
//           }
//         });

//         if (response.ok) {
//           await logout();
//           router.push('/login');
//           toast.success('Account deleted successfully');
//         } else {
//           throw new Error('Failed to delete account');
//         }
//       } catch (error) {
//         console.error('Delete account error:', error);
//         toast.error('Failed to delete account');
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   const handleChangePassword = () => {
//     router.push('/change-password');
//   };

//   const getInitials = (name: string) => {
//     return name.split(' ').map(n => n[0]).join('').toUpperCase();
//   };

//   if (loading && !userProfile.name) {
//     return (
//       <div className="w-full flex items-center justify-center py-12">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full space-y-6 px-4 md:px-6 lg:px-8">
//       {/* Header Section */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
//         <div className="flex items-center space-x-4">
//           <div className="relative">
//             <Avatar className="h-20 w-20 ring-4 ring-green-100">
//               <AvatarImage src={userProfile.profileImage} alt={userProfile.name} />
//               <AvatarFallback className="text-xl font-semibold bg-green-100 text-green-700">
//                 {getInitials(userProfile.name)}
//               </AvatarFallback>
//             </Avatar>
//             <label htmlFor="profile-upload" className="absolute -bottom-1 -right-1 bg-green-600 hover:bg-green-700 text-white rounded-full p-2 cursor-pointer transition-colors">
//               <Camera className="h-3 w-3" />
//               <input
//                 id="profile-upload"
//                 type="file"
//                 accept="image/*"
//                 onChange={handleImageUpload}
//                 className="hidden"
//               />
//             </label>
//           </div>
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">{userProfile.name}</h1>
//             <Badge variant="secondary" className="mt-1 bg-green-100 text-green-700">
//               {userProfile.role}
//             </Badge>
//             <p className="text-sm text-gray-600 mt-1">
//               Reference Number: {userProfile.accountNumber}
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Account Information */}
//         <Card className="w-full">
//           <CardHeader className="pb-4">
//             <CardTitle className="flex items-center space-x-2 text-green-700">
//               <User className="h-5 w-5" />
//               <span>Account Information</span>
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-6">
//             {/* Name Field */}
//             <div className="space-y-2">
//               <Label className="flex items-center space-x-2 text-sm font-medium">
//                 <User className="h-4 w-4 text-gray-500" />
//                 <span>Full Name</span>
//               </Label>
//               <Input
//                 value={userProfile.name}
//                 disabled
//                 className="bg-gray-50"
//               />
//               <p className="text-xs text-gray-500">Name cannot be changed. Contact support if needed.</p>
//             </div>

//             {/* Contacts Field */}
//             <div className="space-y-2">
//               <Label className="flex items-center space-x-2 text-sm font-medium">
//                 <Phone className="h-4 w-4 text-gray-500" />
//                 <span>Contact Number</span>
//               </Label>
//               <div className="flex items-center space-x-2">
//                 <Input
//                   value={userProfile.contacts}
//                   onChange={(e) => setUserProfile({...userProfile, contacts: e.target.value})}
//                   disabled={!isEditing.contacts}
//                   className={isEditing.contacts ? 'border-green-300 focus:border-green-500' : ''}
//                 />
//                 <div className="flex items-center space-x-1">
//                   {isEditing.contacts ? (
//                     <>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleSave('contacts')}
//                         disabled={loading}
//                         className="text-green-600 hover:text-green-700"
//                       >
//                         <Save className="h-4 w-4" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleCancel('contacts')}
//                         className="text-gray-500 hover:text-gray-700"
//                       >
//                         <X className="h-4 w-4" />
//                       </Button>
//                     </>
//                   ) : (
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => handleEdit('contacts')}
//                       className="text-blue-600 hover:text-blue-700"
//                     >
//                       <Edit className="h-4 w-4" />
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Email Field */}
//             <div className="space-y-2">
//               <Label className="flex items-center space-x-2 text-sm font-medium">
//                 <Mail className="h-4 w-4 text-gray-500" />
//                 <span>Email Address</span>
//               </Label>
//               <div className="flex items-center space-x-2">
//                 <Input
//                   value={userProfile.email}
//                   onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
//                   disabled={!isEditing.email}
//                   className={isEditing.email ? 'border-green-300 focus:border-green-500' : ''}
//                 />
//                 <div className="flex items-center space-x-1">
//                   {isEditing.email ? (
//                     <>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleSave('email')}
//                         disabled={loading}
//                         className="text-green-600 hover:text-green-700"
//                       >
//                         <Save className="h-4 w-4" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleCancel('email')}
//                         className="text-gray-500 hover:text-gray-700"
//                       >
//                         <X className="h-4 w-4" />
//                       </Button>
//                     </>
//                   ) : (
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => handleEdit('email')}
//                       className="text-blue-600 hover:text-blue-700"
//                     >
//                       <Edit className="h-4 w-4" />
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Mall Information */}
//         <Card className="w-full">
//           <CardHeader className="pb-4">
//             <CardTitle className="flex items-center space-x-2 text-green-700">
//               <Building className="h-5 w-5" />
//               <span>Mall Information</span>
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-6">
//             {/* Mall Name Field */}
//             <div className="space-y-2">
//               <Label className="flex items-center space-x-2 text-sm font-medium">
//                 <Building className="h-4 w-4 text-gray-500" />
//                 <span>Mall Name</span>
//               </Label>
//               <div className="flex items-center space-x-2">
//                 <Input
//                   value={userProfile.mallName}
//                   onChange={(e) => setUserProfile({...userProfile, mallName: e.target.value})}
//                   disabled={!isEditing.mallName}
//                   className={isEditing.mallName ? 'border-green-300 focus:border-green-500' : ''}
//                 />
//                 <div className="flex items-center space-x-1">
//                   {isEditing.mallName ? (
//                     <>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleSave('mallName')}
//                         disabled={loading}
//                         className="text-green-600 hover:text-green-700"
//                       >
//                         <Save className="h-4 w-4" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleCancel('mallName')}
//                         className="text-gray-500 hover:text-gray-700"
//                       >
//                         <X className="h-4 w-4" />
//                       </Button>
//                     </>
//                   ) : (
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => handleEdit('mallName')}
//                       className="text-blue-600 hover:text-blue-700"
//                     >
//                       <Edit className="h-4 w-4" />
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Address Field */}
//             <div className="space-y-2">
//               <Label className="flex items-center space-x-2 text-sm font-medium">
//                 <MapPin className="h-4 w-4 text-gray-500" />
//                 <span>Mall Address</span>
//               </Label>
//               <div className="space-y-2">
//                 <Textarea
//                   value={userProfile.address}
//                   onChange={(e) => setUserProfile({...userProfile, address: e.target.value})}
//                   disabled={!isEditing.address}
//                   rows={3}
//                   className={`resize-none ${isEditing.address ? 'border-green-300 focus:border-green-500' : ''}`}
//                 />
//                 <div className="flex justify-end">
//                   {isEditing.address ? (
//                     <div className="flex items-center space-x-1">
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleSave('address')}
//                         disabled={loading}
//                         className="text-green-600 hover:text-green-700"
//                       >
//                         <Save className="h-4 w-4 mr-1" />
//                         Save
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleCancel('address')}
//                         className="text-gray-500 hover:text-gray-700"
//                       >
//                         <X className="h-4 w-4 mr-1" />
//                         Cancel
//                       </Button>
//                     </div>
//                   ) : (
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => handleEdit('address')}
//                       className="text-blue-600 hover:text-blue-700"
//                     >
//                       <Edit className="h-4 w-4 mr-1" />
//                       Edit
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Security & Actions */}
//       <Card className="w-full">
//         <CardHeader className="pb-4">
//           <CardTitle className="flex items-center space-x-2 text-green-700">
//             <Shield className="h-5 w-5" />
//             <span>Security & Account Actions</span>
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="flex flex-col sm:flex-row gap-4">
//             <Button 
//               variant="outline" 
//               onClick={handleChangePassword}
//               className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
//             >
//               <Shield className="h-4 w-4 mr-2" />
//               Change Password
//             </Button>
//             <Button 
//               onClick={handleSignOut}
//               className="flex-1 bg-green-600 hover:bg-green-700 text-white"
//             >
//               <LogOut className="h-4 w-4 mr-2" />
//               Sign Out
//             </Button>
//           </div>

//           <Separator />

//           <div className="flex justify-center">
//             <Button
//               variant="ghost"
//               onClick={handleDeleteAccount}
//               disabled={loading}
//               className="text-red-600 hover:text-red-700 hover:bg-red-50"
//             >
//               <Trash2 className="h-4 w-4 mr-2" />
//               Delete Account
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// 'use client';

// import { useState, useEffect } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { useRouter } from 'next/navigation';
// import { apiService, UserResponse } from '@/lib/api';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Separator } from '@/components/ui/separator';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Badge } from '@/components/ui/badge';
// import { Edit, Upload, Save, X, User, Phone, Mail, MapPin, Building, Shield, LogOut, Trash2, Camera } from 'lucide-react';
// import { toast } from 'sonner';

// interface UserProfile {
//   id: string;
//   name: string;
//   contacts: string;
//   email: string;
//   mallName: string;
//   address: string;
//   profileImage?: string;
//   accountNumber: string;
//   role: string;
// }

// export default function MallAccountSection() {
//   const { user, logout } = useAuth();
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);
//   const [isEditing, setIsEditing] = useState({
//     contacts: false,
//     email: false,
//     mallName: false,
//     address: false,
//   });
//   const [userProfile, setUserProfile] = useState<UserProfile>({
//     id: user?.id || '',
//     name: user?.name || '',
//     contacts: user?.contacts || '',
//     email: user?.email || '',
//     mallName: user?.mallName || '',
//     address: user?.address || '',
//     profileImage: user?.profileImage || '',
//     accountNumber: user?.username || 'MM225JM890', // Use username from login (email field)
//     role: user?.role || 'Mall Manager',
//   });

//   useEffect(() => {
//     const fetchUserProfile = async () => {
//       if (!user?.id) return;
//       setLoading(true);
//       try {
//         const profileData: UserResponse = await apiService.getUserById(Number(user.id));
//         setUserProfile((prev) => ({
//           ...prev,
//           id: user.id,
//           name: `${profileData.user.uName} ${profileData.user.uSurname}`,
//           contacts: profileData.user.uPhone,
//           email: profileData.user.uEmail,
//           role: profileData.user.uType,
//           accountNumber: user.username || prev.accountNumber,
//           // mallName and address to be fetched via GET /api/Mall/GetMallByID if needed
//         }));
//       } catch (error: any) {
//         console.error('Failed to fetch user profile:', error);
//         toast.error(error.message || 'Failed to load profile information');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchUserProfile();
//   }, [user?.id, user?.username]);

//   const handleEdit = (field: keyof typeof isEditing) => {
//     setIsEditing((prev) => ({ ...prev, [field]: !prev[field] }));
//     toast.info('Profile updates disabled until backend endpoints are available');
//   };

//   const handleSave = async (field: keyof typeof isEditing) => {
//     // Placeholder: No update endpoints in Swagger
//     setLoading(true);
//     try {
//       // Await backend endpoint (e.g., PUT /api/UserManagement/UpdateUser)
//       setIsEditing((prev) => ({ ...prev, [field]: false }));
//       toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);
//     } catch (error: any) {
//       console.error(`Failed to update ${field}:`, error);
//       toast.error(`Failed to update ${field}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = (field: keyof typeof isEditing) => {
//     setIsEditing((prev) => ({ ...prev, [field]: false }));
//   };

//   const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;
//     setLoading(true);
//     try {
//       const formData = new FormData();
//       formData.append('image', file);
//       const response = await apiService.uploadProfilePic(Number(user?.id), formData);
//       setUserProfile((prev) => ({ ...prev, profileImage: response.imageUrl })); // Adjust based on response
//       toast.success('Profile image updated successfully');
//     } catch (error: any) {
//       console.error('Failed to upload image:', error);
//       toast.error(error.message || 'Failed to upload profile image');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSignOut = async () => {
//     try {
//       await logout();
//       localStorage.removeItem('token');
//       router.push('/login');
//       toast.success('Signed out successfully');
//     } catch (error: any) {
//       console.error('Sign out error:', error);
//       toast.error('Failed to sign out');
//     }
//   };

//   const handleDeleteAccount = async () => {
//     toast.info('Account deletion disabled until backend endpoint is available');
//   };

//   const handleChangePassword = () => {
//     router.push('/change-password');
//   };

//   const getInitials = (name: string) => {
//     return name
//       .split(' ')
//       .map((n) => n[0])
//       .join('')
//       .toUpperCase();
//   };

//   if (loading && !userProfile.name) {
//     return (
//       <div className="w-full flex items-center justify-center py-12">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full space-y-6 px-4 md:px-6 lg:px-8">
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
//         <div className="flex items-center space-x-4">
//           <div className="relative">
//             <Avatar className="h-20 w-20 ring-4 ring-green-100">
//               <AvatarImage src={userProfile.profileImage} alt={userProfile.name} />
//               <AvatarFallback className="text-xl font-semibold bg-green-100 text-green-700">
//                 {getInitials(userProfile.name)}
//               </AvatarFallback>
//             </Avatar>
//             <label
//               htmlFor="profile-upload"
//               className="absolute -bottom-1 -right-1 bg-green-600 hover:bg-green-700 text-white rounded-full p-2 cursor-pointer transition-colors"
//             >
//               <Camera className="h-3 w-3" />
//               <input
//                 id="profile-upload"
//                 type="file"
//                 accept="image/*"
//                 onChange={handleImageUpload}
//                 className="hidden"
//               />
//             </label>
//           </div>
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">{userProfile.name}</h1>
//             <Badge variant="secondary" className="mt-1 bg-green-100 text-green-700">
//               {userProfile.role}
//             </Badge>
//             <p className="text-sm text-gray-600 mt-1">Reference Number: {userProfile.accountNumber}</p>
//           </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <Card className="w-full">
//           <CardHeader className="pb-4">
//             <CardTitle className="flex items-center space-x-2 text-green-700">
//               <User className="h-5 w-5" />
//               <span>Account Information</span>
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-6">
//             <div className="space-y-2">
//               <Label className="flex items-center space-x-2 text-sm font-medium">
//                 <User className="h-4 w-4 text-gray-500" />
//                 <span>Full Name</span>
//               </Label>
//               <Input value={userProfile.name} disabled className="bg-gray-50" />
//               <p className="text-xs text-gray-500">Name cannot be changed. Contact support if needed.</p>
//             </div>
//             <div className="space-y-2">
//               <Label className="flex items-center space-x-2 text-sm font-medium">
//                 <Phone className="h-4 w-4 text-gray-500" />
//                 <span>Contact Number</span>
//               </Label>
//               <div className="flex items-center space-x-2">
//                 <Input
//                   value={userProfile.contacts}
//                   onChange={(e) => setUserProfile({ ...userProfile, contacts: e.target.value })}
//                   disabled={!isEditing.contacts}
//                   className={isEditing.contacts ? 'border-green-300 focus:border-green-500' : ''}
//                 />
//                 <div className="flex items-center space-x-1">
//                   {isEditing.contacts ? (
//                     <>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleSave('contacts')}
//                         disabled={loading}
//                         className="text-green-600 hover:text-green-700"
//                       >
//                         <Save className="h-4 w-4" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleCancel('contacts')}
//                         className="text-gray-500 hover:text-gray-700"
//                       >
//                         <X className="h-4 w-4" />
//                       </Button>
//                     </>
//                   ) : (
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => handleEdit('contacts')}
//                       className="text-blue-600 hover:text-blue-700"
//                     >
//                       <Edit className="h-4 w-4" />
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             </div>
//             <div className="space-y-2">
//               <Label className="flex items-center space-x-2 text-sm font-medium">
//                 <Mail className="h-4 w-4 text-gray-500" />
//                 <span>Email Address</span>
//               </Label>
//               <div className="flex items-center space-x-2">
//                 <Input
//                   value={userProfile.email}
//                   onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
//                   disabled={!isEditing.email}
//                   className={isEditing.email ? 'border-green-300 focus:border-green-500' : ''}
//                 />
//                 <div className="flex items-center space-x-1">
//                   {isEditing.email ? (
//                     <>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleSave('email')}
//                         disabled={loading}
//                         className="text-green-600 hover:text-green-700"
//                       >
//                         <Save className="h-4 w-4" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleCancel('email')}
//                         className="text-gray-500 hover:text-gray-700"
//                       >
//                         <X className="h-4 w-4" />
//                       </Button>
//                     </>
//                   ) : (
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => handleEdit('email')}
//                       className="text-blue-600 hover:text-blue-700"
//                     >
//                       <Edit className="h-4 w-4" />
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="w-full">
//           <CardHeader className="pb-4">
//             <CardTitle className="flex items-center space-x-2 text-green-700">
//               <Building className="h-5 w-5" />
//               <span>Mall Information</span>
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-6">
//             <div className="space-y-2">
//               <Label className="flex items-center space-x-2 text-sm font-medium">
//                 <Building className="h-4 w-4 text-gray-500" />
//                 <span>Mall Name</span>
//               </Label>
//               <div className="flex items-center space-x-2">
//                 <Input
//                   value={userProfile.mallName}
//                   onChange={(e) => setUserProfile({ ...userProfile, mallName: e.target.value })}
//                   disabled={!isEditing.mallName}
//                   className={isEditing.mallName ? 'border-green-300 focus:border-green-500' : ''}
//                 />
//                 <div className="flex items-center space-x-1">
//                   {isEditing.mallName ? (
//                     <>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleSave('mallName')}
//                         disabled={loading}
//                         className="text-green-600 hover:text-green-700"
//                       >
//                         <Save className="h-4 w-4" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleCancel('mallName')}
//                         className="text-gray-500 hover:text-gray-700"
//                       >
//                         <X className="h-4 w-4" />
//                       </Button>
//                     </>
//                   ) : (
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => handleEdit('mallName')}
//                       className="text-blue-600 hover:text-blue-700"
//                     >
//                       <Edit className="h-4 w-4" />
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             </div>
//             <div className="space-y-2">
//               <Label className="flex items-center space-x-2 text-sm font-medium">
//                 <MapPin className="h-4 w-4 text-gray-500" />
//                 <span>Mall Address</span>
//               </Label>
//               <div className="space-y-2">
//                 <Textarea
//                   value={userProfile.address}
//                   onChange={(e) => setUserProfile({ ...userProfile, address: e.target.value })}
//                   disabled={!isEditing.address}
//                   rows={3}
//                   className={`resize-none ${isEditing.address ? 'border-green-300 focus:border-green-500' : ''}`}
//                 />
//                 <div className="flex justify-end">
//                   {isEditing.address ? (
//                     <div className="flex items-center space-x-1">
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleSave('address')}
//                         disabled={loading}
//                         className="text-green-600 hover:text-green-700"
//                       >
//                         <Save className="h-4 w-4 mr-1" />
//                         Save
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleCancel('address')}
//                         className="text-gray-500 hover:text-gray-700"
//                       >
//                         <X className="h-4 w-4 mr-1" />
//                         Cancel
//                       </Button>
//                     </div>
//                   ) : (
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => handleEdit('address')}
//                       className="text-blue-600 hover:text-blue-700"
//                     >
//                       <Edit className="h-4 w-4 mr-1" />
//                       Edit
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <Card className="w-full">
//         <CardHeader className="pb-4">
//           <CardTitle className="flex items-center space-x-2 text-green-700">
//             <Shield className="h-5 w-5" />
//             <span>Security & Account Actions</span>
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="flex flex-col sm:flex-row gap-4">
//             <Button
//               variant="outline"
//               onClick={handleChangePassword}
//               className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
//             >
//               <Shield className="h-4 w-4 mr-2" />
//               Change Password
//             </Button>
//             <Button
//               onClick={handleSignOut}
//               className="flex-1 bg-green-600 hover:bg-green-700 text-white"
//             >
//               <LogOut className="h-4 w-4 mr-2" />
//               Sign Out
//             </Button>
//           </div>
//           <Separator />
//           <div className="flex justify-center">
//             <Button
//               variant="ghost"
//               onClick={handleDeleteAccount}
//               disabled={loading}
//               className="text-red-600 hover:text-red-700 hover:bg-red-50"
//             >
//               <Trash2 className="h-4 w-4 mr-2" />
//               Delete Account
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, User, Phone, Mail, MapPin, Building, Shield, LogOut, Trash2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api';

interface UserProfile {
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
  mall?: {
    mallID: number;
    mallName: string;
    mallAddr: string;
    mallContacts: string;
    mallImage?: string;
    imageBase64?: string;
  };
}

export default function MallAccountSection() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState({
    phone: false,
    email: false,
  });

  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: Number(user?.id) || 0,
    roleID: 0,
    name: user?.name || '',
    surname: user?.surname || '',
    gender: user?.gender || '',
    phone: user?.contacts || '',
    email: user?.email || '',
    username: user?.username || '',
    type: user?.type || 'MallManager',
    accountNumber: user?.username || '',
    role: user?.type || 'MallManager',
    mall: undefined,
  });

  // Fetch user profile and mall data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) {
        toast.error('User ID not found. Please log in again.');
        return;
      }

      setLoading(true);
      try {
        // Fetch user details using UserID from login statusCode
        const userResponse = await authAPI.getUserById(Number(user.id));
        console.log('[MallAccountSection] getUserById Response:', userResponse);
        const userData = userResponse.user;
        const roleID = userResponse.roleID || 0;

        // Fetch mall ID using roleID
        let mallId: number;
        try {
          const mallIdResponse = await authAPI.getMallIdByManagerId(roleID);
          console.log('[MallAccountSection] getMallIdByManagerId Response:', mallIdResponse);
          mallId = mallIdResponse.mallID;
        } catch (mallIdError: any) {
          console.error('[MallAccountSection] Failed to fetch mall ID:', mallIdError);
          if (mallIdError.response) {
            console.error('[MallAccountSection] Error Status:', mallIdError.response.status);
            console.error('[MallAccountSection] Error Data:', mallIdError.response.data);
          }
          toast.error('Unable to fetch mall ID. Mall information may be incomplete.');
          setUserProfile((prev) => ({
            ...prev,
            roleID,
            mall: {
              mallID: 0,
              mallName: 'Not assigned',
              mallAddr: 'Not assigned',
              mallContacts: 'Not assigned',
            },
          }));
          setLoading(false);
          return;
        }

        // Fetch mall details
        const mallResponse = await authAPI.getMallById(mallId);
        console.log('[MallAccountSection] getMallById Response:', mallResponse);

        setUserProfile({
          id: Number(user.id),
          roleID,
          name: userData.uName || user?.name || 'Unknown',
          surname: userData.uSurname || user?.surname || 'Unknown',
          gender: userData.uGender || user?.gender || 'Other',
          phone: userData.uPhone || user?.contacts || '',
          email: userData.uEmail || user?.email || '',
          username: user?.username || userData.uEmail || '',
          type: userData.uType || user?.type || 'MallManager',
          accountNumber: user?.username || userData.uEmail || '',
          role: userData.uType || user?.type || 'MallManager',
          mall: {
            mallID: mallResponse.dto.mallID || 0,
            mallName: mallResponse.dto.mallName || 'Not assigned',
            mallAddr: mallResponse.dto.mallAddr || 'Not assigned',
            mallContacts: mallResponse.dto.mallContacts || 'Not assigned',
            mallImage: mallResponse.dto.mallImage,
            imageBase64: mallResponse.imageBase64,
          },
        });
      } catch (error: any) {
        console.error('[MallAccountSection] Failed to fetch user profile or mall data:', error);
        if (error.response) {
          console.error('[MallAccountSection] Error Status:', error.response.status);
          console.error('[MallAccountSection] Error Data:', error.response.data);
        }
        toast.error('Failed to load profile or mall information');
        setUserProfile((prev) => ({
          ...prev,
          mall: {
            mallID: 0,
            mallName: 'Not assigned',
            mallAddr: 'Not assigned',
            mallContacts: 'Not assigned',
          },
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.id, user?.username, user?.name, user?.surname, user?.gender, user?.contacts, user?.email, user?.type]);

  const handleEdit = (field: keyof typeof isEditing) => {
    setIsEditing((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async (field: keyof typeof isEditing) => {
    setLoading(true);
    try {
      const response = await authAPI.updateManager({
        id: userProfile.id,
        name: userProfile.name,
        surname: userProfile.surname,
        gender: userProfile.gender,
        contacts: userProfile.phone,
        email: userProfile.email,
        username: userProfile.username,
        type: userProfile.type,
      });

      if (response.statusCode === 200) {
        setIsEditing((prev) => ({ ...prev, [field]: false }));
        toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error(`[MallAccountSection] Failed to update ${field}:`, error);
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
      console.error('[MallAccountSection] Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setLoading(true);
      try {
        const response = await authAPI.deleteManager(userProfile.id);
        if (response.statusCode === 200) {
          await logout();
          router.push('/login');
          toast.success('Account deleted successfully');
        } else {
          throw new Error(response.message || 'Failed to delete account');
        }
      } catch (error: any) {
        console.error('[MallAccountSection] Delete account error:', error);
        toast.error('Failed to delete account');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChangePassword = () => {
    router.push('/change-password');
  };

  if (loading && !userProfile.name) {
    return (
      <div className="w-full h-screen flex items-center justify-center py-12">
        <div className="animate-pulse">
          <Briefcase className="h-12 w-12 text-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 md:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20 ring-4 ring-green-100">
            <AvatarImage src={userProfile.mall?.imageBase64 ? `data:image/jpeg;base64,${userProfile.mall.imageBase64}` : ''} alt={userProfile.mall?.mallName || 'Mall'} />
            <AvatarFallback className="text-xl font-semibold bg-green-100 text-green-700">
              {userProfile.mall?.mallName ? userProfile.mall.mallName.slice(0, 2).toUpperCase() : 'MM'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{`${userProfile.name} ${userProfile.surname}`}</h1>
            <Badge variant="secondary" className="mt-1 bg-green-100 text-green-700">
              {userProfile.role}
            </Badge>
            <p className="text-sm text-gray-600 mt-1">
              Reference Number: {userProfile.accountNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
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
            {/* Name Field */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2 text-sm font-medium">
                <User className="h-4 w-4 text-gray-500" />
                <span>Full Name</span>
              </Label>
              <Input
                value={`${userProfile.name} ${userProfile.surname}`}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Name cannot be changed. Contact support if needed.</p>
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2 text-sm font-medium">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>Contact Number</span>
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={userProfile.phone}
                  onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
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

            {/* Email Field */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2 text-sm font-medium">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>Email Address</span>
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={userProfile.email}
                  onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value, username: e.target.value })}
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

        {/* Mall Information */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-green-700">
              <Building className="h-5 w-5" />
              <span>Mall Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mall Name Field */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2 text-sm font-medium">
                <Building className="h-4 w-4 text-gray-500" />
                <span>Mall Name</span>
              </Label>
              <Input
                value={userProfile.mall?.mallName || 'Not assigned'}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* Address Field */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>Mall Address</span>
              </Label>
              <Textarea
                value={userProfile.mall?.mallAddr || 'Not assigned'}
                disabled
                rows={3}
                className="resize-none bg-gray-50"
              />
            </div>

            {/* Contacts Field */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2 text-sm font-medium">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>Mall Contacts</span>
              </Label>
              <Input
                value={userProfile.mall?.mallContacts || 'Not assigned'}
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
  );
}