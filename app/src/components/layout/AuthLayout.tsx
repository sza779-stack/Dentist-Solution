import { Outlet, Link } from 'react-router-dom';
import { Heart, Sparkles, Users, Clock, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent" />
        
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold">Dental Clinic</span>
              <span className="block text-xs text-white/70">Professional Care</span>
            </div>
          </Link>

          <div className="space-y-8">
            <blockquote className="text-2xl font-light leading-relaxed">
              &ldquo;Your smile is our passion. Experience world-class dental care with cutting-edge technology and compassionate service.&rdquo;
            </blockquote>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">10,000+</p>
                  <p className="text-xs text-white/70">Happy Patients</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">4.9/5</p>
                  <p className="text-xs text-white/70">Patient Rating</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">15+ Years</p>
                  <p className="text-xs text-white/70">Experience</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Certified</p>
                  <p className="text-xs text-white/70">Expert Dentists</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-8 text-sm text-white/70">
            <div>
              <p className="text-2xl font-bold text-white">15+</p>
              <p>Years Experience</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">50+</p>
              <p>Expert Dentists</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">99%</p>
              <p>Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className={cn(
        "flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16",
        "bg-background"
      )}>
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Heart className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="text-left">
                <span className="text-xl font-bold text-foreground">Dental Clinic</span>
                <span className="block text-xs text-muted-foreground">Professional Care</span>
              </div>
            </Link>
          </div>

          <Outlet />

          <p className="text-center text-sm text-muted-foreground">
            © 2024 Dental Clinic Pro. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
