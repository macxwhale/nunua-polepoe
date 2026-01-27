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
    <div className="min-h-screen flex bg-[#fbfcfd] dark:bg-[#0a0a0a] overflow-hidden">
      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Left Panel - Branding & Features (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative z-10 border-r border-border/40 bg-white/40 dark:bg-black/20 backdrop-blur-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <Shield className="w-3 h-3" />
            <span>Trusted by Kenyan Businesses</span>
          </div>
          <div className="animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
            <img src="/logo.png" alt="Lipia Pole Pole Logo" className="h-16 w-auto" />
          </div>
        </div>

        <div className="space-y-12 max-w-lg">
          <div className="animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
            <h2 className="text-4xl font-display font-bold text-foreground tracking-tight leading-[1.1] mb-6">
              Empower your business with <span className="text-primary italic">flexible</span> credit management
            </h2>
            <p className="text-lg text-muted-foreground/80 leading-relaxed uppercase tracking-wider text-xs font-semibold">
              The complete toolkit for credit operations
            </p>
          </div>

          <div className="grid gap-6 animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
            <FeatureItem
              icon={<Users className="w-5 h-5" />}
              title="Smart Client CRM"
              description="Automated balance tracking and comprehensive payment history"
            />
            <FeatureItem
              icon={<CreditCard className="w-5 h-5" />}
              title="Dynamic Invoicing"
              description="Pro-grade invoices with real-time status monitoring"
            />
            <FeatureItem
              icon={<Shield className="w-5 h-5" />}
              title="Enterprise Security"
              description="Your financial data protected by military-grade encryption"
            />
          </div>
        </div>

        <div className="text-xs text-muted-foreground/60 font-medium tracking-wide">
          © {new Date().getFullYear()} LIPIA POLE POLE • FINTECH SOLUTIONS
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 relative z-10">
        <div className="w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-1000">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <img src="/logo.png" alt="Lipia Pole Pole Logo" className="h-14 w-auto" />
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-75 transition duration-1000" />

            <Card className="relative border-border/40 bg-white/70 dark:bg-black/40 backdrop-blur-2xl shadow-2xl rounded-[1.5rem] overflow-hidden">
              <CardHeader className="pb-4 text-center pt-10">
                <CardTitle className="text-2xl font-display font-extrabold tracking-tight">
                  {activeTab === 'login' ? 'Welcome Back' : 'Get Started'}
                </CardTitle>
                <CardDescription className="text-sm font-medium text-muted-foreground/70">
                  {activeTab === 'login'
                    ? 'Access your unified credit dashboard'
                    : 'Create your professional account in seconds'}
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-10 px-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-11 mb-8 bg-muted/30 p-1 rounded-xl">
                    <TabsTrigger
                      value="login"
                      className="text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg rounded-lg"
                    >
                      LOG IN
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg rounded-lg"
                    >
                      SIGN UP
                    </TabsTrigger>
                  </TabsList>

                  <div className="relative">
                    <TabsContent value="login" className="mt-0 focus-visible:outline-none">
                      <UnifiedLoginForm onSuccess={handleSuccess} />
                    </TabsContent>
                    <TabsContent value="signup" className="mt-0 focus-visible:outline-none">
                      <SignUpForm onSuccess={handleSuccess} />
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Secure indicator */}
          <div className="mt-8 flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-primary/5 w-fit mx-auto border border-primary/10">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-primary/80">End-to-end encrypted</span>
          </div>

          {/* Mobile footer */}
          <div className="lg:hidden mt-10 text-center text-xs text-muted-foreground/60 font-medium">
            © {new Date().getFullYear()} LIPIA POLE POLE
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
  <div className="flex items-start gap-5 p-4 rounded-2xl hover:bg-white/50 dark:hover:bg-white/5 transition-colors duration-300 group">
    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 text-primary group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <div className="space-y-1">
      <h3 className="font-bold text-foreground text-base tracking-tight">{title}</h3>
      <p className="text-muted-foreground/70 text-sm leading-snug">{description}</p>
    </div>
  </div>
);

export default Auth;
