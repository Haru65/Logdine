import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/Logo';

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div className="max-w-md">
        <Logo />
        <p className="mt-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Error 404
        </p>
        <h1 className="mt-3 font-serif text-5xl font-bold tracking-tight">
          This page is off the menu.
        </h1>
        <p className="mt-3 text-muted-foreground">
          We couldn't find what you were looking for. Maybe the chef ate it.
        </p>
        <Button asChild className="mt-6">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
