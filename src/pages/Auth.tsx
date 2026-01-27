import { SignUpForm } from '@/components/auth/SignUpForm';
import { UnifiedLoginForm } from '@/components/auth/UnifiedLoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { CreditCard, Shield, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('login');

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSuccess = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding & Features (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <img src="/logo.png" alt="Lipia Pole Pole Logo" className="h-20 w-auto" />
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-display font-bold text-foreground leading-tight mb-4">
              Streamline your<br />
              credit operations
            </h2>
            <p className="text-muted-foreground max-w-md">
              Manage clients, track invoices, and monitor payments all in one secure platform designed for Kenyan businesses.
            </p>
          </div>

          <div className="space-y-4">
            <FeatureItem
              icon={<Users className="w-4 h-4" />}
              title="Client Management"
              description="Track balances and payment history for all your customers"
            />
            <FeatureItem
              icon={<CreditCard className="w-4 h-4" />}
              title="Invoice Tracking"
              description="Create and monitor invoices with automatic status updates"
            />
            <FeatureItem
              icon={<Shield className="w-4 h-4" />}
              title="Secure & Reliable"
              description="Your financial data protected with enterprise-grade security"
            />
          </div>
        </div>

        <div className="relative z-10 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Lipia Pole Pole. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/logo.png" alt="Lipia Pole Pole Logo" className="h-14 w-auto" />
          </div>

          <Card className="border-border/50 shadow-lg shadow-black/5">
            <CardHeader className="pb-2 text-center">
              <CardTitle className="text-xl font-display font-bold">
                {activeTab === 'login' ? 'Welcome back' : 'Create an account'}
              </CardTitle>
              <CardDescription className="text-sm">
                {activeTab === 'login'
                  ? 'Enter your credentials to access your account'
                  : 'Get started with your free account today'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 h-10 mb-6 bg-muted/50">
                  <TabsTrigger
                    value="login"
                    className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Log In
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="mt-0">
                  <UnifiedLoginForm onSuccess={handleSuccess} />
                </TabsContent>
                <TabsContent value="signup" className="mt-0">
                  <SignUpForm onSuccess={handleSuccess} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Trust indicators */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <span>Secured with end-to-end encryption</span>
          </div>

          {/* Mobile footer */}
          <div className="lg:hidden mt-8 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Lipia Pole Pole. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureItem = ({ icon, title, description }: FeatureItemProps) => (
  <div className="flex items-start gap-4">
    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 text-primary">
      {icon}
    </div>
    <div>
      <h3 className="font-semibold text-foreground text-sm mb-0.5">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  </div>
);

export default Auth;
