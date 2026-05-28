import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/common/Logo';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore, selectIsAuthed } from '@/store/auth.store';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const isAuthed = useAuthStore(selectIsAuthed);
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { mutate, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember: true },
  });

  // Already logged in? Skip the page.
  if (isAuthed) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  const onSubmit = (data: FormValues) => {
    mutate(
      { email: data.email, password: data.password, remember: data.remember },
      {
        onSuccess: () => {
          const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        },
      },
    );
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ----- Left: form ----- */}
      <div className="relative flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="absolute inset-0 -z-10 bg-gradient-cream opacity-60" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <Logo />

          <div className="mt-12">
            <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground">
              Welcome back.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to manage your restaurant. The day starts hot.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@restaurant.com"
                {...register('email')}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => alert('Contact your administrator to reset.')}
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pr-10"
                  {...register('password')}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted focus-ring"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                {...register('remember')}
                className="size-4 rounded border-border accent-primary"
              />
              Keep me signed in
            </label>

            <Button type="submit" size="lg" loading={isPending} className="w-full gap-2">
              Sign in
              <ArrowRight className="size-4" />
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              By signing in, you accept our terms & privacy policy.
            </p>
          </form>
        </motion.div>
      </div>

      {/* ----- Right: editorial side panel ----- */}
      <div className="relative hidden overflow-hidden bg-gradient-warm lg:block">
        <div className="absolute inset-0 grain" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="size-4" />
            <span>Restaurant OS · v3.2</span>
          </div>

          <motion.blockquote
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="max-w-xl"
          >
            <p className="font-serif text-5xl font-bold leading-[1.05] tracking-tight">
              Run a smoother service,
              <span className="block text-white/80">night after night.</span>
            </p>
            <footer className="mt-8 flex items-center gap-4">
              <div className="size-12 rounded-full bg-white/20 ring-2 ring-white/30" />
              <div>
                <p className="font-semibold">Aanya Sharma</p>
                <p className="text-sm text-white/70">Owner, Sujal Cafe · Mumbai</p>
              </div>
            </footer>
          </motion.blockquote>

          <div className="grid grid-cols-3 gap-6 text-sm">
            {[
              ['12K+', 'Restaurants'],
              ['4.8★', 'Avg rating'],
              ['99.9%', 'Uptime'],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="font-serif text-3xl font-bold">{k}</p>
                <p className="text-white/70">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
