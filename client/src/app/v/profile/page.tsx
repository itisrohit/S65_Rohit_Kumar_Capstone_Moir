"use client";

import { useState, useEffect, memo, useCallback, useMemo } from "react";
import useAuth from "@/hooks/useAuth";
import { Camera, Check, Save, Lock, AlertCircle, Pencil, Mail, User as UserIcon, AtSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import axios from 'axios';
import  { User } from "@/store/authStore";

// Split the success alert into a memoized component
const SuccessAlert = memo(({ message }: { message: string }) => (
  <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
    <Check className="h-4 w-4" />
    <AlertTitle>Success</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
));
SuccessAlert.displayName = "SuccessAlert";

// Split the profile form into a memoized component
const ProfileForm = memo(({ 
  name, setName, 
  username, setUsername, 
  email, setEmail,
  error, 
  handleSubmit,
  isSubmitting // Add isSubmitting prop
}: {
  name: string;
  setName: (name: string) => void;
  username: string;
  setUsername: (username: string) => void;
  email: string;
  setEmail: (email: string) => void;
  error: string | null;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean; // Add this prop
}) => (
  <form onSubmit={handleSubmit} className="space-y-6">
    <div className="space-y-2">
      <Label htmlFor="name" className="text-sm font-medium">Display Name</Label>
      <Input
        id="name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="rounded-md"
        disabled={isSubmitting}
      />
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="username" className="text-sm font-medium">Username</Label>
      <Input
        id="username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="username"
        className="rounded-md"
        disabled={isSubmitting}
      />
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
      <Input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@example.com"
        className="rounded-md"
        disabled={isSubmitting}
      />
    </div>
    
    {error && (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}
  </form>
));
ProfileForm.displayName = "ProfileForm";

// Split the profile info view into a memoized component
const ProfileInfo = memo(({ name, username, email }: { 
  name: string; 
  username: string; 
  email: string; 
}) => (
  <div className="space-y-6">
    <div className="flex items-center space-x-3 p-3 rounded-md bg-muted/50">
      <UserIcon className="h-5 w-5 text-muted-foreground" />
      <div>
        <p className="text-sm text-muted-foreground">Name</p>
        <p className="font-medium">{name || "Not set"}</p>
      </div>
    </div>
    
    <div className="flex items-center space-x-3 p-3 rounded-md bg-muted/50">
      <AtSign className="h-5 w-5 text-muted-foreground" />
      <div>
        <p className="text-sm text-muted-foreground">Username</p>
        <p className="font-medium">{username || "Not set"}</p>
      </div>
    </div>
    
    <div className="flex items-center space-x-3 p-3 rounded-md bg-muted/50">
      <Mail className="h-5 w-5 text-muted-foreground" />
      <div>
        <p className="text-sm text-muted-foreground">Email</p>
        <p className="font-medium">{email || "Not set"}</p>
      </div>
    </div>
  </div>
));
ProfileInfo.displayName = "ProfileInfo";

// Split the password dialog into a memoized component
const PasswordDialog = memo(({
  isOpen,
  setIsOpen,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordError,
  loading,
  handleSubmit
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentPassword: string;
  setCurrentPassword: (currentPassword: string) => void;
  newPassword: string;
  setNewPassword: (newPassword: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  passwordError: string;
  loading: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}) => (
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogTrigger asChild>
      <Button variant="outline" className="w-full sm:w-auto">
        <Lock className="mr-2 h-4 w-4" />
        Change Password
      </Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Change Password</DialogTitle>
        <DialogDescription>
          Enter your current password and choose a new one.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            minLength={8}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={confirmPassword && newPassword !== confirmPassword ? "border-red-500" : ""}
            placeholder="••••••••"
            required
          />
          
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-sm text-red-500 mt-1">Passwords don&apos;t match</p>
          )}
        </div>
        
        {passwordError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{passwordError}</AlertDescription>
          </Alert>
        )}
        
        <DialogFooter className="mt-6">
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading || (confirmPassword !== "" && newPassword !== confirmPassword)}
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
));
PasswordDialog.displayName = "PasswordDialog";

// Memoize the profile avatar
const ProfileAvatar = memo(({ 
  imagePreview, 
  name, 
  isEditMode, 
  handleImageChange,
  user 
}: { 
  imagePreview: string; 
  name: string;
  isEditMode: boolean;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  user: User | null; // Replace "any" with proper type
}) => (
  <div className="relative">
    <Avatar className="h-28 w-28 border-4 border-background shadow-md">
      <AvatarImage src={imagePreview} alt={name} />
      <AvatarFallback className="text-3xl bg-primary/10 text-primary font-medium">
        {user?.name?.charAt(0)?.toUpperCase() || "?"}
      </AvatarFallback>
    </Avatar>
    {isEditMode && (
      <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-primary/90 transition-colors">
        <Camera size={16} />
        <input 
          type="file" 
          className="hidden" 
          accept="image/*" 
          onChange={handleImageChange}
        />
      </label>
    )}
  </div>
));
ProfileAvatar.displayName = "ProfileAvatar";

// Create a direct API client that doesn't trigger global loading state
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Direct API for profile updates - bypasses global loading state
const directApi = {
  async updateProfile(
    userData: Partial<{name: string, username: string, email: string}>, // Replace "any" with proper type
    image?: File
  ) {
    try {
      const formData = new FormData();
      if (userData.name) formData.append('name', userData.name);
      if (userData.username) formData.append('username', userData.username);
      if (userData.email) formData.append('email', userData.email);
      if (image) formData.append('image', image);
      
      const response = await axios.put(`${API_BASE_URL}/user/update`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  async updatePassword(currentPassword: string, newPassword: string) {
    try {
      const response = await axios.put(`${API_BASE_URL}/user/update-password`, 
        { currentPassword, newPassword }, 
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default function ProfilePage() {
  // Get only what we need from useAuth
  const { user, requireAuth, error, updateUserInStore } = useAuth();
  
  // UI state 
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  
  // Local status states - avoid global loading state
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [passwordError, setPasswordError] = useState("");

  // Memoize user data
  const userData = useMemo(() => ({
    name: user?.name || "",
    username: user?.username || "",
    email: user?.email || "",
    image: user?.image || ""
  }), [user]);

  // Load user data once when component mounts or user changes
  useEffect(() => {
    requireAuth();
    
    if (user) {
      setName(userData.name);
      setUsername(userData.username);
      setEmail(userData.email);
      setImagePreview(userData.image);
    }
  }, [user, requireAuth, userData]);

  // Handle image selection
  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }, []);

  // Profile update with direct API
  const handleProfileUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    // Initialize changes object
    const changes: Partial<{name: string, username: string, email: string}> = {};
    
    // Only add fields that have changed
    if (name !== userData.name) changes.name = name;
    if (username !== userData.username) changes.username = username;
    if (email !== userData.email) changes.email = email;
    
    // Only make API call if there are changes or a new image
    if (Object.keys(changes).length > 0 || profileImage) {
      try {
        const result = await directApi.updateProfile(
          changes,  // Only send changed fields
          profileImage || undefined
        );
        
        if (result.success) {
          if (result.data?.user) {
            updateUserInStore(result.data.user); // Using the one from useAuth
          }
          
          setStatus('success');
          setIsEditMode(false);
          setTimeout(() => setStatus('idle'), 3000);
        } else {
          setStatus('error');
        }
      } catch (err) {
        console.error("Profile update failed:", err);
        setStatus('error');
      }
    } else {
      // No changes to submit
      setStatus('success');
      setIsEditMode(false);
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [name, username, email, profileImage, userData, updateUserInStore]);

  // Password update with direct API
  const handlePasswordUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    
    setPasswordStatus('loading');
    setPasswordError("");
    
    try {
      const result = await directApi.updatePassword(currentPassword, newPassword);
      
      if (result.success) {
        setPasswordStatus('success');
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordDialogOpen(false);
        setTimeout(() => setPasswordStatus('idle'), 3000);
      } else {
        setPasswordError(result.message || "Failed to update password");
        setPasswordStatus('error');
      }
    } catch (err) {
      console.error("Password update failed:", err);
      setPasswordError("An error occurred while updating your password.");
      setPasswordStatus('error');
    }
  }, [currentPassword, newPassword, confirmPassword]);

  // Cancel edit
  const handleCancelEdit = useCallback(() => {
    setName(userData.name);
    setUsername(userData.username);
    setEmail(userData.email);
    setImagePreview(userData.image);
    setProfileImage(null);
    setIsEditMode(false);
  }, [userData]);

  return (
    <div className="flex justify-center items-center w-full min-h-[80vh] py-8 px-4">
      <div className="w-full max-w-md mx-auto">     
        {/* Success messages - based on local status */}
        {status === 'success' && <SuccessAlert message="Your profile has been updated successfully." />}
        {passwordStatus === 'success' && <SuccessAlert message="Your password has been updated successfully." />}

        {/* Main profile card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              {isEditMode ? "Edit your personal details" : "Your personal details"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Profile photo */}
            <div className="flex justify-center mb-6">
              <ProfileAvatar 
                imagePreview={imagePreview}
                name={name}
                isEditMode={isEditMode}
                handleImageChange={handleImageChange}
                user={user}
              />
            </div>

            {isEditMode ? (
              // Edit mode - Form with inputs
              <ProfileForm 
                name={name}
                setName={setName}
                username={username}
                setUsername={setUsername}
                email={email}
                setEmail={setEmail}
                error={status === 'error' ? error : null}
                handleSubmit={handleProfileUpdate}
                isSubmitting={status === 'loading'}
              />
            ) : (
              // View mode - Display information
              <ProfileInfo 
                name={name}
                username={username}
                email={email}
              />
            )}
          </CardContent>
          
          <Separator />
          
          <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-6">
            {isEditMode ? (
              // Edit mode buttons
              <>
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={handleCancelEdit}
                  className="w-full sm:w-auto"
                  disabled={status === 'loading'}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  onClick={handleProfileUpdate} 
                  disabled={status === 'loading'}
                  className="w-full sm:w-auto"
                >
                  {status === 'loading' ? (
                    <>
                      <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              // View mode buttons
              <>
                <PasswordDialog 
                  isOpen={passwordDialogOpen}
                  setIsOpen={setPasswordDialogOpen}
                  currentPassword={currentPassword}
                  setCurrentPassword={setCurrentPassword}
                  newPassword={newPassword}
                  setNewPassword={setNewPassword}
                  confirmPassword={confirmPassword}
                  setConfirmPassword={setConfirmPassword}
                  passwordError={passwordError}
                  loading={passwordStatus === 'loading'}
                  handleSubmit={handlePasswordUpdate}
                />
                
                <Button 
                  onClick={() => setIsEditMode(true)}
                  className="w-full sm:w-auto"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}