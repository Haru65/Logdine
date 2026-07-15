import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ClipboardList,
  CreditCard,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
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
  const [showResetHelp, setShowResetHelp] = useState(false);
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
    <main className="grid min-h-screen bg-[#f7faf9] lg:grid-cols-2">
      <section className="relative flex items-center justify-center overflow-hidden px-5 py-8 sm:px-8 lg:px-16 lg:py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_5%,rgba(8,189,136,0.13),transparent_35%),radial-gradient(circle_at_90%_90%,rgba(41,74,97,0.09),transparent_36%)]" />
        <div className="pointer-events-none absolute left-[8%] top-[12%] size-2 rounded-full bg-[#08bd88]/30" />
        <div className="pointer-events-none absolute bottom-[10%] right-[10%] size-20 rounded-full border border-[#08bd88]/10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative w-full max-w-[440px] rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(32,42,59,0.11)] backdrop-blur-sm sm:p-9"
        >
          <div className="flex items-center gap-3">
            <img src="/logdine-logo.png" alt="" className="size-14 rounded-2xl shadow-[0_8px_20px_rgba(8,189,136,0.18)]" />
            <div>
              <p className="text-xl font-extrabold tracking-[-0.03em] text-[#202a3b]">LogDine Restro</p>
              <p className="mt-0.5 text-xs font-semibold text-[#08a979]">Restaurant Management System</p>
            </div>
          </div>

          <div className="mt-9">
            <h1 className="font-serif text-[34px] font-bold leading-tight tracking-tight text-[#202a3b]">Welcome back</h1>
            <p className="mt-2 text-sm leading-6 text-[#697386]">Sign in to manage orders, menus, payments, and your restaurant team.</p>
          </div>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-[#344054]">Email address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[#08a979]" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="you@restaurant.com"
                  {...register('email')}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={`h-12 w-full rounded-xl border bg-[#fbfcfc] pl-11 pr-4 text-sm text-[#202a3b] outline-none transition placeholder:text-[#a9b0ba] focus:bg-white focus:ring-4 ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-[#dbe3e6] focus:border-[#08bd88] focus:ring-[#08bd88]/10'}`}
                />
              </div>
              {errors.email && <p id="email-error" className="flex items-center gap-1.5 text-xs font-medium text-red-500"><span className="size-1 rounded-full bg-red-500" />{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-[#344054]">Password</label>
                <button type="button" className="rounded text-xs font-semibold text-[#08a979] outline-none hover:text-[#087c5c] hover:underline focus-visible:ring-2 focus-visible:ring-[#08bd88]" onClick={() => setShowResetHelp((visible) => !visible)}>Forgot password?</button>
              </div>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[#08a979]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={`h-12 w-full rounded-xl border bg-[#fbfcfc] pl-11 pr-12 text-sm text-[#202a3b] outline-none transition placeholder:text-[#a9b0ba] focus:bg-white focus:ring-4 ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-[#dbe3e6] focus:border-[#08bd88] focus:ring-[#08bd88]/10'}`}
                  {...register('password')}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#697386] outline-none transition hover:bg-[#e6fff7] hover:text-[#08a979] focus-visible:ring-2 focus-visible:ring-[#08bd88]" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                </button>
              </div>
              {errors.password && <p id="password-error" className="flex items-center gap-1.5 text-xs font-medium text-red-500"><span className="size-1 rounded-full bg-red-500" />{errors.password.message}</p>}
              {showResetHelp && !errors.password && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="rounded-lg bg-[#e9faf5] px-3 py-2 text-xs leading-5 text-[#37655a]">
                  Contact your restaurant administrator to reset your password.
                </motion.p>
              )}
            </div>

            <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-[#596579]">
              <input type="checkbox" {...register('remember')} className="size-4 rounded border-[#dbe3e6] accent-[#08bd88]" />
              Remember me on this device
            </label>

            <button type="submit" disabled={isPending} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#08bd88] via-[#0aa77d] to-[#294a61] px-8 text-sm font-bold text-white shadow-[0_12px_28px_rgba(8,169,121,0.24)] outline-none transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(8,169,121,0.3)] focus-visible:ring-2 focus-visible:ring-[#08bd88] focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">
              {isPending ? <><span className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />Signing in…</> : <>Sign in securely<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></>}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[#7a8494]"><ShieldCheck className="size-3.5 text-[#08a979]" />Secure access to your restaurant workspace</p>
          </form>
        </motion.div>
      </section>

      <section className="relative hidden overflow-hidden bg-[#101827] lg:block">
        <div className="absolute inset-0 grain" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(8,189,136,0.32),transparent_34%),radial-gradient(circle_at_90%_80%,rgba(41,104,112,0.4),transparent_38%)]" />
        <div className="absolute -right-24 top-16 size-80 rounded-full border border-white/5" />
        <div className="absolute -right-8 top-32 size-52 rounded-full border border-white/5" />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          <img src="/logdinelogo2.png" alt="LogDine" className="h-auto w-64" />

          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.55 }} className="max-w-xl text-white">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#12d9a0]/25 bg-[#08bd88]/10 px-3 py-1.5 text-xs font-semibold text-[#54e1b8]">
              <Sparkles className="size-3.5" /> Everything Your Café Needs
            </div>
            <h2 className="font-serif text-5xl font-bold leading-[1.08] tracking-tight xl:text-6xl">Manage every order<br /><span className="text-[#42d7ac]">with confidence.</span></h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/65">From QR ordering to billing and kitchen updates, keep your café running smoothly from a single dashboard.</p>

            <div className="mt-9 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                { icon: ShoppingCart, title: 'Smart Orders', copy: 'QR & Counter Orders' },
                { icon: ClipboardList, title: 'Live Kitchen', copy: 'Real-time Order Status' },
                { icon: CreditCard, title: 'Easy Billing', copy: 'Fast & Secure Payments' },
              ].map(({ icon: Icon, title, copy }, index) => (
                <motion.div key={title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + index * 0.08 }} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-sm">
                  <div className="mb-3 grid size-9 place-items-center rounded-xl bg-[#08bd88]/15 text-[#42d7ac]"><Icon className="size-[18px]" /></div>
                  <p className="text-sm font-bold">{title}</p>
                  <p className="mt-0.5 text-xs text-white/50">{copy}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <p className="text-xs text-white/40">Complete Café Ordering &amp; Management Solution</p>
        </div>
      </section>
    </main>
  );
}
