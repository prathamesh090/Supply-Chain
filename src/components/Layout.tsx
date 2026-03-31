import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/use-auth';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Features', href: '/features' },
  { name: 'Industries', href: '/industries' },
  { name: 'Directory', href: '/directory' },
  { name: 'Contact', href: '/contact' },
];


export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isHiddenPage =
    location.pathname.includes('/sign-in') ||
    location.pathname.includes('/sign-up') ||
    location.pathname.includes('/verify-company') ||
    location.pathname.includes('/dashboard') ||
    location.pathname.includes('/demand-forecast') ||
    location.pathname.includes('/supplier-risk') ||
    location.pathname.includes('/supplier/') ||
    location.pathname.includes('/supplier-signin') ||
    location.pathname.includes('/supplier-signup') ||
    location.pathname.includes('/supplier-dashboard') ||
    location.pathname.includes('/suppliers/');

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/sign-in');
  };

  if (isHiddenPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary" />
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                ChainLink Pro
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors relative ${
                    location.pathname === item.href ? 'text-primary' : 'text-foreground hover:text-primary'
                  }`}
                >
                  {item.name}
                  {location.pathname === item.href && (
                    <motion.div
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-primary"
                      layoutId="activeTab"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                  <Button variant="outline" onClick={handleLogout}>Log Out</Button>
                </>
              ) : (
                <>
                  <Link to="/sign-in"><Button variant="ghost">Sign In</Button></Link>
                  <Link to="/verify-company"><Button variant="hero">Get Started</Button></Link>
                </>
              )}
            </div>

            <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen((v) => !v)}>
              {isMobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        <motion.div
          className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: isMobileMenuOpen ? 1 : 0, height: isMobileMenuOpen ? 'auto' : 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="border-t border-border bg-background px-4 py-4 space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block text-sm font-medium ${location.pathname === item.href ? 'text-primary' : 'text-foreground hover:text-primary'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            <div className="flex flex-col space-y-2 pt-4 border-t border-border">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="justify-start w-full">Dashboard</Button>
                  </Link>
                  <Button variant="outline" className="justify-start w-full" onClick={handleLogout}>Log Out</Button>
                </>
              ) : (
                <>
                  <Link to="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="justify-start w-full">Sign In</Button>
                  </Link>
                  <Link to="/verify-company" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="hero" className="justify-start w-full">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border mt-10 py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} ChainLink Pro. All rights reserved.
      </footer>
    </div>
  );
}
