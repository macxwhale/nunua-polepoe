import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Eye, EyeOff, Loader2, Lock, Phone, User } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const signUpSchema = z.object({
  businessName: z.string()
    .trim()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must be less than 100 characters'),
  fullName: z.string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
  phoneNumber: z.string()
    .trim()
    .regex(/^0\d{9}$/, 'Enter a valid 10-digit phone number starting with 0'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be less than 128 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  onSuccess: () => void;
}

export const SignUpForm = ({ onSuccess }: SignUpFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      businessName: '',
      fullName: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;

      // Convert phone number to email format for owner accounts
      const email = `${data.phoneNumber}@owner.internal`;

      const { error: signUpError, data: authData } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            business_name: data.businessName,
            full_name: data.fullName,
            phone_number: data.phoneNumber,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // After signup with auto-confirm, we need to sign in to get a valid session
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: data.password,
        });

        if (signInError) throw signInError;

        if (!signInData.session) {
          throw new Error('Failed to establish session after signup');
        }

        // Now call edge function with valid session token
        const { error: setupError } = await supabase.functions.invoke('setup-tenant', {
          body: {
            business_name: data.businessName,
            full_name: data.fullName,
            phone_number: data.phoneNumber,
          },
        });

        if (setupError) throw setupError;

        toast.success('Account created successfully!');
        toast.info(`Your password: ${data.password}`, {
          duration: 10000,
          description: 'Save this password securely - you\'ll need it to log in',
        });
        onSuccess();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create account';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const password = form.watch('password');
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: '', color: '', width: '0%' };
    if (pwd.length < 6) return { label: 'Too short', color: 'bg-destructive', width: '25%' };
    if (pwd.length < 8) return { label: 'Weak', color: 'bg-warning', width: '50%' };
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
      return { label: 'Strong', color: 'bg-primary', width: '100%' };
    }
    return { label: 'Medium', color: 'bg-warning', width: '75%' };
  };
  const strength = getPasswordStrength(password);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1 mb-6">
          <h1 className="text-xl font-bold tracking-tight text-foreground/90">Create a new account</h1>
          <p className="text-sm text-muted-foreground">Join us to manage your credit operations seamlessly.</p>
        </div>
        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Business Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Your business name"
                    className="pl-10 h-12 bg-background/50 border-border/40 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                    autoComplete="organization"
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
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Full Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Your full name"
                    className="pl-10 h-12 bg-background/50 border-border/40 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                    autoComplete="name"
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
          name="phoneNumber"
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
                    className="pl-10 h-12 bg-background/50 border-border/40 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
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
              <FormLabel className="text-sm font-medium">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a secure password"
                    className="pl-10 pr-10 h-11"
                    autoComplete="new-password"
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
              {password && (
                <div className="space-y-1.5">
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{strength.label}</p>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="pl-10 pr-10 h-11"
                    autoComplete="new-password"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </form>
    </Form>
  );
};
