
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout, View, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import rightfitLogo from '@/assets/logo.png';

const Index = () => {
  const navigate = useNavigate();
  const { user, login, register, isLoading } = useAuth();
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', name: '' });

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await login(loginForm.email, loginForm.password);
    if (error) {
      const msg = (error as any)?.message || String(error);
      if (msg.toLowerCase().includes('email not confirmed')) {
        toast.message('Please confirm your email', {
          description: 'Check your inbox for the verification link. You can resend it below.',
        });
      } else {
        toast.error(msg.includes('Invalid login') ? 'Invalid email or password' : msg);
      }
      return;
    }
    toast.success('Welcome back!');
    navigate('/dashboard');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await register(registerForm.email, registerForm.password, registerForm.name);
    if (error) {
      toast.error((error as any)?.message || 'Registration failed. Please try again.');
      return;
    }
    toast.message('Confirm your email to continue', {
      description: 'We sent a verification link to your inbox. Click it, then return here to sign in.',
    });
    // Do not navigate; wait for email confirmation
  };

  const handleResendVerification = async () => {
    if (!loginForm.email) {
      toast.error('Enter your email address first');
      return;
    }
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: loginForm.email,
      options: { emailRedirectTo: redirectUrl },
    });
    if (error) {
      toast.error(error.message || 'Failed to resend verification email');
    } else {
      toast.success('Verification email sent');
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={rightfitLogo} alt="RightFit Interiors logo" className="h-14 w-auto" />
              <h1 className="text-2xl font-bold text-gray-900">RightFit Interior Designer</h1>
            </div>
            <nav className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Hero Section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                Design Your Dream Kitchen in 2D & 3D
              </h2>
              <p className="text-xl text-gray-600">
                Professional kitchen design tools from RightFit Interiors with intuitive 2D planning and stunning 3D visualization. 
                Create, customize, and save your perfect kitchen layout.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <Layout className="h-12 w-12 text-blue-600 mx-auto" />
                <h3 className="font-semibold text-gray-900">2D Planning</h3>
                <p className="text-sm text-gray-600">Draw walls and plan your layout with precision</p>
              </div>
              <div className="text-center space-y-2">
                <View className="h-12 w-12 text-green-600 mx-auto" />
                <h3 className="font-semibold text-gray-900">3D Visualization</h3>
                <p className="text-sm text-gray-600">See your design come to life in 3D</p>
              </div>
              <div className="text-center space-y-2">
                <Save className="h-12 w-12 text-purple-600 mx-auto" />
                <h3 className="font-semibold text-gray-900">Save & Share</h3>
                <p className="text-sm text-gray-600">Keep your designs safe in the cloud</p>
              </div>
            </div>
          </div>

          {/* Auth Forms */}
          <div className="max-w-md mx-auto w-full">
            <Card>
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
                <CardDescription>
                  Sign in to your account or create a new one to begin designing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="register">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="space-y-4">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="your@email.com"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Signing In...' : 'Sign In'}
                      </Button>
                      <Button type="button" variant="ghost" className="w-full mt-2 text-xs" onClick={handleResendVerification}>
                        Resend verification email
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register" className="space-y-4">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-name">Full Name</Label>
                        <Input
                          id="register-name"
                          type="text"
                          placeholder="John Doe"
                          value={registerForm.name}
                          onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="your@email.com"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <Input
                          id="register-password"
                          type="password"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
