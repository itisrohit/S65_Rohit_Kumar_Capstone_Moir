"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useAuth from "@/hooks/useAuth";
import { toastSuccess, toastError } from "@/utility/toastStyle";

export default function AuthPage() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Remove all firefly-related state
  // const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  // const [fireflyPosition, setFireflyPosition] = useState({ x: -100, y: -100 });
  // const [isFollowing, setIsFollowing] = useState(false);
  // const [isMounted, setIsMounted] = useState(false);
  // const [isFireflyVisible, setIsFireflyVisible] = useState(false);
  // const [isFireflySpeaking, setIsFireflySpeaking] = useState(false);
  // const [hasFlySpoken, setHasFlySpoken] = useState(false);
  // const [isMobileView, setIsMobileView] = useState(false);
  // const [hasShownInitialGreeting, setHasShownInitialGreeting] = useState(false);
  // const greetingShownRef = useRef(false);
  // const [conversationHistory, setConversationHistory] = useState<{role: string, content: string}[]>([]);
  // const [isThinking, setIsThinking] = useState(false);
  // const requestRef = useRef<number>();
  // const lastSpeechRef = useRef<number>(0);
  // const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

  // Add auth-related state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
  });

  const [validationErrors, setValidationErrors] = useState<{
    login: string | null;
    signup: string | null;
  }>({
    login: null,
    signup: null,
  });

  // Get auth methods
  const { login, register, error, clearError, redirectIfAuthenticated } = useAuth();


  // Redirect if already authenticated
  useEffect(() => {
    redirectIfAuthenticated();
  }, [redirectIfAuthenticated]);

  // Show error from auth store as toast
  useEffect(() => {
    if (error) {
      toastError("Authentication Failed", {
        description: error,
        duration: 5000,
      });
      clearError();
    }
  }, [error, clearError]);

  // Handle mounting state with reset functionality and check for mobile
  useEffect(() => {
    // Check if we've already shown the greeting before
    
    // Check if we're on mobile
    const checkIfMobile = () => {
      // setIsMobileView(window.innerWidth < 768); // Standard mobile breakpoint
    };
    
    // Initial check
    checkIfMobile();
    
    // Listen for resize events
    window.addEventListener('resize', checkIfMobile);
    
    // Reset functionality kept for developers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'r') {
        localStorage.removeItem("hasShownFireflyGreeting");
        // setHasShownInitialGreeting(false); // This state is removed
        // greetingShownRef.current = false; // This ref is removed
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Update CSS variables when firefly position changes
  useEffect(() => {
    // if (!isMounted) return; // isMounted is removed
    
    // document.documentElement.style.setProperty('--firefly-x', `${fireflyPosition.x}px`);
    // document.documentElement.style.setProperty('--firefly-y', `${fireflyPosition.y}px`);
    
    // // Adjust web opacity based on mobile view as well
    // document.documentElement.style.setProperty('--web-opacity', 
    //   isMobileView ? '0.3' : (isFollowing ? '0.35' : '0.25')
    // );
  }, []); // Add isMobileView to dependencies

  // Login form handlers
  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setLoginForm(prev => ({ ...prev, [id]: value }));
    setValidationErrors(prev => ({ ...prev, login: null }));
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form
    if (!loginForm.email || !loginForm.password) {
      setValidationErrors(prev => ({ 
        ...prev, 
        login: "Email and password are required" 
      }));
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login({
        email: loginForm.email,
        password: loginForm.password
      });
      
      if (success) {
        toastSuccess("Login Successful", { 
          description: "Welcome back!"
        });
      }
    } catch  {
      // Error will be handled by the useEffect with the error state
    } finally {
      setIsLoading(false);
    }
  };

  // Signup form handlers
  const handleSignupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const fieldName = id.replace("signup-", "");
    setSignupForm(prev => ({ ...prev, [fieldName]: value }));
    setValidationErrors(prev => ({ ...prev, signup: null }));
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form
    if (!signupForm.name || !signupForm.email || !signupForm.username || !signupForm.password) {
      setValidationErrors(prev => ({ 
        ...prev, 
        signup: "All fields are required" 
      }));
      return;
    }
    
    if (signupForm.password.length < 6) {
      setValidationErrors(prev => ({ 
        ...prev, 
        signup: "Password must be at least 6 characters"
      }));
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await register({
        name: signupForm.name,
        email: signupForm.email,
        username: signupForm.username,
        password: signupForm.password
      });
      
      if (success) {
        toastSuccess("Account Created", { 
          description: "Welcome to our platform!" 
        });
      }
    } catch  {
      // Error will be handled by the useEffect with the error state
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Remove all firefly-related useEffects and handlers
  // Remove all firefly animation, mouse, and greeting logic

  // Animation variants
  // Remove unused: wingVariants
  // Remove unused: fireflyVariants
  // Remove unused: generateFireflyResponse, prompt, handleFireflyClick
  
  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-hidden relative bg-gradient-to-b from-zinc-900 to-black py-12 px-4 sm:px-6 lg:px-8" style={{ height: '100vh' }}>
      {/* Premium background elements */}
      <div className="absolute inset-0 z-0">
        {/* Base background */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black"></div>
        
        {/* Enhanced hex web pattern */}
        <div className="absolute inset-0 premium-hex-web origin-center rotate-[15deg]"></div>
        
        {/* Premium accent glows */}
        <div className="absolute top-1/4 left-1/4 w-[35rem] h-[35rem] bg-blue-500/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-1/3 right-1/5 w-[30rem] h-[30rem] bg-violet-500/5 rounded-full blur-[150px]"></div>
      </div>
      
      {/* Remove firefly SVG, motion.div, and speech bubble UI */}
      <div className="w-full max-w-md relative z-10 transform translate-y-[-5%]">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-zinc-800/50 backdrop-blur-xl rounded-lg border border-zinc-700/30 shadow-xl p-1 overflow-hidden">
            <TabsTrigger value="login" className="rounded-md text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
              Login
            </TabsTrigger>
            <TabsTrigger value="signup" className="rounded-md text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
              Sign Up
            </TabsTrigger>
          </TabsList>
          
          <AnimatePresence mode="wait">
            <TabsContent value="login">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-zinc-800/50 backdrop-blur-xl border-zinc-700/30 shadow-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl text-zinc-100">Sign in</CardTitle>
                    <CardDescription className="text-zinc-400">Enter your email and password</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-300 text-sm">Email</Label>
                        <Input
                          id="email"
                          placeholder="name@example.com"
                          type="email"
                          autoCapitalize="none"
                          autoComplete="email"
                          autoCorrect="off"
                          value={loginForm.email}
                          onChange={handleLoginInputChange}
                          required
                          className="bg-zinc-900/70 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-400 focus:ring-blue-400/10 transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password" className="text-zinc-300 text-sm">Password</Label>
                          <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                            Forgot password?
                          </a>
                        </div>
                        <div className="relative">
                          <Input
                            id="password"
                            type={isPasswordVisible ? "text" : "password"}
                            autoComplete="current-password"
                            value={loginForm.password}
                            onChange={handleLoginInputChange}
                            required
                            className="bg-zinc-900/70 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-400 focus:ring-blue-400/10 pr-10 transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-300"
                          >
                            {isPasswordVisible ? (
                              <EyeOffIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {validationErrors.login && (
                        <p className="text-sm text-red-500">{validationErrors.login}</p>
                      )}
                      
                      <Button 
                        type="submit" 
                        className="w-full mt-6 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white transition-all duration-300 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20" 
                        disabled={isLoading}
                      >
                        {isLoading ? 
                          <div className="flex items-center justify-center">
                            <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                            <span>Signing in...</span>
                          </div> : 
                          "Sign In"
                        }
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <TabsContent value="signup">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-zinc-800/50 backdrop-blur-xl border-zinc-700/30 shadow-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl text-zinc-100">Create account</CardTitle>
                    <CardDescription className="text-zinc-400">Enter your information to sign up</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-zinc-300 text-sm">Full Name</Label>
                        <Input
                          id="signup-name"
                          placeholder="John Doe"
                          value={signupForm.name}
                          onChange={handleSignupInputChange}
                          required
                          className="bg-zinc-900/70 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-400 focus:ring-blue-400/10 transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-zinc-300 text-sm">Email</Label>
                        <Input
                          id="signup-email"
                          placeholder="name@example.com"
                          type="email"
                          autoCapitalize="none"
                          autoComplete="email"
                          autoCorrect="off"
                          value={signupForm.email}
                          onChange={handleSignupInputChange}
                          required
                          className="bg-zinc-900/70 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-400 focus:ring-blue-400/10 transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-username" className="text-zinc-300 text-sm">Username</Label>
                        <Input
                          id="signup-username"
                          placeholder="johndoe"
                          autoCapitalize="none"
                          autoCorrect="off"
                          value={signupForm.username}
                          onChange={handleSignupInputChange}
                          required
                          className="bg-zinc-900/70 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-400 focus:ring-blue-400/10 transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-zinc-300 text-sm">Password</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={isPasswordVisible ? "text" : "password"}
                            autoComplete="new-password"
                            value={signupForm.password}
                            onChange={handleSignupInputChange}
                            required
                            className="bg-zinc-900/70 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-400 focus:ring-blue-400/10 pr-10 transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-300"
                          >
                            {isPasswordVisible ? (
                              <EyeOffIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {validationErrors.signup && (
                        <p className="text-sm text-red-500">{validationErrors.signup}</p>
                      )}
                      
                      <Button 
                        type="submit" 
                        className="w-full mt-6 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white transition-all duration-300 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20" 
                        disabled={isLoading}
                      >
                        {isLoading ? 
                          <div className="flex items-center justify-center">
                            <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                            <span>Creating account...</span>
                          </div> : 
                          "Create Account"
                        }
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
      
      {/* Remove firefly-related CSS variables and styles from the style tag */}
      <style jsx global>{`
        html, body {
          height: 100%;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          body {
            position: fixed;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
        }
        .premium-hex-web {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1500' height='1500' viewBox='0 0 1500 1500'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='50%25' y1='50%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='rgba(56,189,248,0.4)' /%3E%3Cstop offset='25%25' stop-color='rgba(139,92,246,0.35)' /%3E%3Cstop offset='50%25' stop-color='rgba(139,92,246,0.25)' /%3E%3Cstop offset='75%25' stop-color='rgba(244,244,245,0.15)' /%3E%3Cstop offset='100%25' stop-color='rgba(244,244,245,0.05)' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cg stroke='url(%23grad)' stroke-width='1' fill='none'%3E%3C!-- Center Point --%3E%3Ccircle cx='750' cy='750' r='5' fill='rgba(56,189,248,0.9)' stroke='none' /%3E%3C!-- Irregular hexagons with slight variations --%3E%3Cpolygon points='750,700 790,720 790,780 750,800 710,780 710,720' /%3E%3Cpolygon points='750,650 810,685 810,765 750,800 690,765 690,685' /%3E%3Cpolygon points='750,600 830,650 835,745 755,795 670,745 665,650' /%3E%3Cpolygon points='750,550 850,615 860,730 765,790 645,730 635,615' /%3E%3Cpolygon points='750,500 880,575 895,710 775,790 625,710 610,575' /%3E%3Cpolygon points='750,450 910,540 930,695 790,830 610,695 590,540' /%3E%3Cpolygon points='750,400 940,500 965,680 810,860 590,680 560,500' /%3E%3Cpolygon points='750,350 970,465 1000,665 830,890 570,665 535,465' /%3E%3Cpolygon points='750,300 1000,430 1035,650 850,920 550,650 510,430' /%3E%3Cpolygon points='750,250 1030,395 1070,635 870,950 530,635 475,395' /%3E%3Cpolygon points='750,200 1060,360 1105,620 890,975 510,620 440,360' /%3E%3Cpolygon points='750,150 1090,325 1140,605 910,1000 490,605 415,325' /%3E%3C!-- Extended hexagons --%3E%3Cpolygon points='750,100 1120,290 1175,590 930,1025 470,590 390,290' /%3E%3Cpolygon points='750,50 1150,255 1210,575 950,1060 450,575 365,255' /%3E%3Cpolygon points='750,0 1180,220 1245,560 970,1095 430,560 340,220' /%3E%3C!-- Larger connecting spokes with curves --%3E%3Cpath d='M750,750 C750,500 750,250 750,0' stroke-width='1' /%3E%3Cpath d='M750,750 C900,700 1050,600 1245,560' stroke-width='1' /%3E%3Cpath d='M750,750 C900,825 1050,900 1210,1150' stroke-width='1' /%3E%3Cpath d='M750,750 C750,975 750,1200 750,1500' stroke-width='1' /%3E%3Cpath d='M750,750 C600,825 450,900 290,1150' stroke-width='1' /%3E%3Cpath d='M750,750 C600,700 450,600 255,560' stroke-width='1' /%3E%3C/g%3E%3C/svg%3E");
          background-size: 300% 300%;
          background-position: center center;
          opacity: 0.25;
          mix-blend-mode: screen;
          transition: opacity 0.5s ease;
        }
      `}</style>
    </div>
  );
}