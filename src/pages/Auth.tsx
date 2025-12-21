import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { UnifiedLoginForm } from '@/components/auth/UnifiedLoginForm';
import { useAuth } from '@/hooks/useAuth';

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('login');

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSuccess = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-display font-bold">
              Lipia Pole Pole
            </CardTitle>
            <CardDescription className="text-xs">
              Credit management system
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="login" className="text-xs">
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-xs">
                  Sign Up
                </TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-4">
                <UnifiedLoginForm onSuccess={handleSuccess} />
              </TabsContent>
              <TabsContent value="signup" className="mt-4">
                <SignUpForm onSuccess={handleSuccess} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
