import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Phone, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const loginSchema = z.object({
  phone_number: z.string()
    .trim()
    .regex(/^0\d{9}$/, 'Enter a valid 10-digit phone number starting with 0')
    .max(10, 'Phone number must be exactly 10 digits'),
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password is too long'),
});

const resetSchema = z.object({
  phone_number: z.string()
    .trim()
    .regex(/^0\d{9}$/, 'Enter a valid 10-digit phone number starting with 0'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

interface UnifiedLoginFormProps {
  onSuccess: () => void;
}

export const UnifiedLoginForm = ({ onSuccess }: UnifiedLoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone_number: '',
      password: '',
    },
  });

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      phone_number: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Resolve all possible emails for this phone number
      const resolved = await supabase.functions.invoke('resolve-login-email', {
        body: { phone_number: data.phone_number },
      });

      // Check if account not found - show specific error
      if (resolved.error || resolved.data?.error) {
        const errorMessage = resolved.data?.error || resolved.error?.message;
        if (errorMessage?.includes('No account found')) {
          toast.error('Account Not Found', {
            description: 'No account is associated with this phone number. Please contact the business owner.',
          });
          return;
        }
        throw new Error(errorMessage || 'Failed to resolve account');
      }

      const emails: string[] = [];
      
      // Handle multiple accounts or single account
      if (resolved.data?.multipleAccounts && resolved.data?.emails) {
        emails.push(...resolved.data.emails);
      } else if (resolved.data?.email) {
        emails.push(resolved.data.email);
      }
      
      // If no emails resolved, account doesn't exist
      if (emails.length === 0) {
        toast.error('Account Not Found', {
          description: 'No account is associated with this phone number. Please contact the business owner.',
        });
        return;
      }

      // Try to log in with each resolved email
      let lastError: Error | null = null;
      for (const email of emails) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: data.password,
        });
        if (!error) {
          toast.success('Welcome back!');
          onSuccess();
          return;
        }
        lastError = error;
      }

      throw lastError || new Error('Login failed');
    } catch {
      toast.error('Invalid password', {
        description: 'Please check your password and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onReset = async (data: ResetFormData) => {
    setIsResetting(true);
    try {
      const response = await supabase.functions.invoke('reset-password', {
        body: { phone_number: data.phone_number },
      });

      // Check for error in response - prioritize specific error message from response body
      if (response.error || response.data?.error) {
        const errorMessage = response.data?.error || response.error?.message || 'Failed to reset password';
        throw new Error(errorMessage);
      }

      const { pin, accountCount } = response.data;

      toast.success(`Your new PIN is: ${pin}`, {
        duration: 10000,
        description: accountCount > 1 
          ? `Password reset for ${accountCount} accounts. You can now log in with this PIN.`
          : 'Please save this PIN. You can now log in with it.',
      });

      setIsResetOpen(false);
      resetForm.reset();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to reset password. Please contact support.';
      toast.error(message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Phone Number</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="tel" 
                      placeholder="0712345678" 
                      maxLength={10}
                      className="pl-10 h-11"
                      autoComplete="tel"
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium">Password / PIN</FormLabel>
                  <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        type="button" 
                        variant="link" 
                        className="px-0 h-auto py-0 text-xs text-muted-foreground hover:text-primary"
                      >
                        Forgot password?
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                          Enter your phone number to generate a new 6-digit PIN.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...resetForm}>
                        <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
                          <FormField
                            control={resetForm.control}
                            name="phone_number"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                      type="tel" 
                                      placeholder="0712345678" 
                                      maxLength={10}
                                      className="pl-10 h-11"
                                      {...field} 
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="w-full h-11" disabled={isResetting}>
                            {isResetting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating PIN...
                              </>
                            ) : (
                              'Generate New PIN'
                            )}
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Enter your password or PIN" 
                      className="pl-10 pr-10 h-11"
                      autoComplete="current-password"
                      {...field} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              'Log In'
            )}
          </Button>
        </form>
      </Form>
    </>
  );
};
