'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import Image from 'next/image';
// import { useAuthStore } from '@/lib/store/authStore';
// import toast from 'react-hot-toast';
// import { FaEye, FaEyeSlash } from 'react-icons/fa';
// import { IoClose } from 'react-icons/io5';
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { motion } from "framer-motion";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  
  const { register, loading, error, clearError } = useAuthStore();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.username || !formData.email || !formData.password || !formData.name) {
      toast.error('Please fill in all fields');
      return;
    }
    
    // Optimistically update UI
    const toastId = toast.loading('Creating your account...');
    
    try {
      await register(formData);
      toast.success('Account created successfully!', { id: toastId });
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed', { id: toastId });
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-pink-50 via-pink-100 to-rose-100">
      <div className="relative flex flex-col items-center justify-center w-full max-w-5xl p-6 mx-auto my-8 bg-white rounded-2xl shadow-lg md:flex-row">
        {/* Close button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 right-4 z-10 hover:bg-gray-100 rounded-full"
          onClick={() => router.push('/')}
        >
          <IoClose size={24} className="text-gray-700" />
        </Button>

        {/* Left side - Illustration */}
        <div className="hidden w-full p-6 mb-8 bg-pink-100 rounded-xl md:block md:w-1/2 md:mb-0">
          <div className="relative w-full h-64 md:h-80">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ 
                duration: 6,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="relative w-full h-full"
            >
              <Image
                src="/authpageimage.png"
                alt="Signup illustration"
                fill
                className="object-contain drop-shadow-lg"
                priority
              />
            </motion.div>
          </div>
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center mt-4 space-x-2"
          >
            <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
            <div className="w-16 h-2 bg-purple-300 rounded-full"></div>
          </motion.div>
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="flex items-center mt-2 space-x-2"
          >
            <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
            <div className="w-24 h-2 bg-purple-300 rounded-full"></div>
          </motion.div>
        </div>
        
        {/* Right side - Signup form */}
        <div className="w-full p-6 md:w-1/2 md:p-8">
          <h2 className="mb-8 text-3xl font-bold text-center text-gray-900">Create an Account</h2>
          
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div>
              <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  className="pl-10 border border-gray-300 rounded-md focus:border-amber-300 focus:ring-0 focus:outline-none text-gray-900"
                  style={{ boxShadow: 'none' }}
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                  </svg>
                </div>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="johndoe"
                  required
                  className="pl-10 border border-gray-300 rounded-md focus:border-amber-300 focus:ring-0 focus:outline-none text-gray-900"
                  style={{ boxShadow: 'none' }}
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  required
                  className="pl-10 border border-gray-300 rounded-md focus:border-amber-300 focus:ring-0 focus:outline-none text-gray-900"
                  style={{ boxShadow: 'none' }}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10 border border-gray-300 rounded-md focus:border-amber-300 focus:ring-0 focus:outline-none text-gray-900"
                  style={{ boxShadow: 'none' }}
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <FaEyeSlash className="w-5 h-5 text-gray-400" />
                  ) : (
                    <FaEye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-100 rounded-md">
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-400 hover:bg-red-500 text-white font-bold"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
          
          <div className="flex items-center w-full my-6">
            <div className="flex-grow h-px bg-gray-200"></div>
            <span className="px-4 text-sm font-medium text-gray-500">Or Continue With</span>
            <div className="flex-grow h-px bg-gray-200"></div>
          </div>
          
          <Button 
            variant="outline" 
            className="flex items-center justify-center w-full gap-3 py-3 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 bg-white"
            onClick={() => {/* Add Google login logic here */}}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="text-base font-medium text-gray-700">Google</span>
          </Button>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account? 
              <Link href="/login" className="ml-1 font-bold text-red-400 hover:text-red-500">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}