import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useLogin } from '@/hooks/useAuth';
import { selectIsAuthed, useAuthStore } from '@/store/auth.store';

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
      <div className="relative flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(at_0%_0%,#e6fff7_0%,transparent_50%),radial-gradient(at_100%_100%,#d8f7ee_0%,transparent_50%)] opacity-70" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <img src="/logdinelogo2.png" alt="LogDine" className="h-auto w-56" />

          <div className="mt-12">
            <h1 className="font-serif text-4xl font-bold tracking-tight text-[#202a3b]">Welcome back.</h1>
            <p className="mt-2 text-sm text-[#697386]">Sign in to manage your restaurant. The day starts hot.</p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-[#344054]">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@restaurant.com"
                {...register('email')}
                aria-invalid={!!errors.email}
                className="flex h-10 w-full rounded-md border border-[#dbe3e6] bg-white px-3 py-2 text-sm text-[#202a3b] outline-none transition placeholder:text-[#98a2b3] focus:border-[#08bd88] focus:ring-2 focus:ring-[#08bd88]/20"
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-[#344054]">Password</label>
                <button type="button" className="text-xs font-medium text-[#08a979] hover:underline" onClick={() => alert('Contact your administrator to reset.')}>Forgot?</button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="flex h-10 w-full rounded-md border border-[#dbe3e6] bg-white px-3 py-2 pr-10 text-sm text-[#202a3b] outline-none transition placeholder:text-[#98a2b3] focus:border-[#08bd88] focus:ring-2 focus:ring-[#08bd88]/20"
                  {...register('password')}
                  aria-invalid={!!errors.password}
                />
                <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#697386] hover:bg-[#e6fff7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08bd88]" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <label className="flex items-center gap-2 text-sm text-[#697386]">
              <input type="checkbox" {...register('remember')} className="size-4 rounded border-[#dbe3e6] accent-[#08bd88]" />
              Keep me signed in
            </label>

            <button type="submit" disabled={isPending} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[#08bd88] to-[#294a61] px-8 text-sm font-medium text-white shadow-[0_10px_25px_rgba(8,189,136,0.2)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08bd88] focus-visible:ring-offset-2 disabled:opacity-60">
              {isPending ? 'Signing in…' : 'Sign in'}
              {!isPending && <ArrowRight className="size-4" />}
            </button>

            <p className="text-center text-xs text-[#697386]">By signing in, you accept our terms &amp; privacy policy.</p>
          </form>
        </motion.div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#08bd88] to-[#17263a] lg:block">
        <div className="absolute inset-0 grain" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2 text-sm font-medium"><Sparkles className="size-4" /><span>Restaurant OS · v3.2</span></div>
          <motion.blockquote initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="max-w-xl">
            <p className="font-serif text-5xl font-bold leading-[1.05] tracking-tight">Run a smoother service,<span className="block text-white/80">night after night.</span></p>
            <footer className="mt-8 flex items-center gap-4">
              <div className="size-12 rounded-full bg-white/20 ring-2 ring-white/30" />
              <div><p className="font-semibold">Aanya Sharma</p><p className="text-sm text-white/70">Owner, Sujal Cafe · Mumbai</p></div>
            </footer>
          </motion.blockquote>
          <div className="grid grid-cols-3 gap-6 text-sm">
            {[['12K+', 'Restaurants'], ['4.8★', 'Avg rating'], ['99.9%', 'Uptime']].map(([key, value]) => (
              <div key={key}><p className="font-serif text-3xl font-bold">{key}</p><p className="text-white/70">{value}</p></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
