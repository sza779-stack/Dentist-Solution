import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { settingsApi } from '@/api/settings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BriefcaseMedical,
  CheckCircle2,
  Clock3,
  MapPin,
  Phone,
  Mail,
  Shield,
  Heart,
  Users,
  Award,
  ArrowRight,
  Sparkles,
  Stethoscope,
  Calendar,
  CreditCard,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Stethoscope,
    title: 'Expert Dental Care',
    description: 'Our team of experienced dentists and specialists provide top-quality care using the latest techniques.',
  },
  {
    icon: Shield,
    title: 'Safe & Sterile',
    description: 'We maintain the highest standards of cleanliness and sterilization for your safety and peace of mind.',
  },
  {
    icon: Heart,
    title: 'Patient Comfort',
    description: 'Comfort-first approach with gentle care, modern amenities, and a relaxing environment.',
  },
  {
    icon: Calendar,
    title: 'Easy Scheduling',
    description: 'Book appointments online 24/7. We offer flexible scheduling including evenings and weekends.',
  },
];

const services = [
  { name: 'General Dentistry', description: 'Checkups, cleanings, fillings, and preventive care' },
  { name: 'Cosmetic Dentistry', description: 'Teeth whitening, veneers, and smile makeovers' },
  { name: 'Orthodontics', description: 'Braces, Invisalign, and teeth alignment solutions' },
  { name: 'Oral Surgery', description: 'Extractions, implants, and surgical procedures' },
  { name: 'Pediatric Dentistry', description: 'Gentle dental care for children of all ages' },
  { name: 'Emergency Care', description: 'Same-day appointments for dental emergencies' },
];

const highlights = [
  'Experienced dentists and specialists',
  'Modern dental equipment and diagnostics',
  'Comfort-first care for all ages',
  'Flexible payment options available',
  'Insurance accepted',
  'Emergency services',
];

export default function LandingPage() {
  const { data } = useQuery({
    queryKey: ['publicLanding'],
    queryFn: () => settingsApi.getPublicLanding(),
  });

  const landing = data?.landing;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground leading-tight">
                {landing?.clinicName || 'Dental Clinic'}
              </span>
              <span className="text-xs text-muted-foreground leading-tight">
                Professional Care
              </span>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#home" className="text-foreground hover:text-primary transition-colors">Home</a>
            <a href="#about" className="text-muted-foreground hover:text-primary transition-colors">About</a>
            <a href="#services" className="text-muted-foreground hover:text-primary transition-colors">Services</a>
            <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
            <div className="flex items-center gap-3 pl-4 border-l">
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="gap-2">
                <Link to="/register">
                  Book Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section id="home" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-24 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-medium shadow-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{landing?.welcomeText || 'Welcome to Our Clinic'}</span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-tight">
                  {landing?.title || 'Your Smile Deserves the Best Care'}
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl">
                  {landing?.subtitle || 'Experience world-class dental care with our team of expert dentists. We combine advanced technology with compassionate service to give you the healthy, beautiful smile you deserve.'}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button asChild size="lg" className="gap-2 rounded-full px-8">
                    <Link to="/register">
                      {landing?.primaryButton || 'Book Appointment'}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="gap-2 rounded-full px-8">
                    <Link to="/login">
                      {landing?.secondaryButton || 'Patient Portal'}
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center gap-8 pt-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-10 w-10 rounded-full border-2 border-background bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-xs font-medium text-primary"
                      >
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Sparkles key={i} className="h-4 w-4 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-semibold text-foreground">2,500+</span> happy patients
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative lg:h-[600px]">
                <div className="relative w-full h-full min-h-[400px] rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src={landing?.mainImage || "https://images.unsplash.com/photo-1629909615184-74f495363b67?w=1200&auto=format&fit=crop&q=80"}
                    alt="Dental Clinic"
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&auto=format&fit=crop&q=80";
                    }}
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-card rounded-2xl p-4 shadow-xl border">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">99% Success Rate</p>
                      <p className="text-sm text-muted-foreground">Patient satisfaction</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="secondary" className="mb-4">Why Choose Us</Badge>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Experience the Difference
              </h2>
              <p className="text-muted-foreground">
                We combine cutting-edge technology with personalized care to deliver exceptional dental experiences.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl bg-card p-6 border shadow-sm",
                    "hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  )}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150" />
                  <div className="relative">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl shadow-lg bg-gradient-to-br from-primary/20 to-primary/5 h-64 w-full flex items-center justify-center">
                    <div className="text-center p-6">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center">
                        <Stethoscope className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Expert Care</p>
                    </div>
                  </div>
                  <div className="rounded-2xl shadow-lg bg-gradient-to-br from-accent/20 to-accent/5 h-64 w-full flex items-center justify-center mt-8">
                    <div className="text-center p-6">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-accent/20 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-accent" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Modern Equipment</p>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 bg-primary text-primary-foreground rounded-2xl p-6 shadow-xl">
                  <p className="text-4xl font-bold">15+</p>
                  <p className="text-primary-foreground/80">Years Experience</p>
                </div>
              </div>
              <div className="space-y-6">
                <Badge variant="secondary">About Our Clinic</Badge>
                <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                  Best Medical Care For You and Your Family
                </h2>
                <p className="text-muted-foreground text-lg">
                  Our state-of-the-art dental clinic is equipped with the latest technology and staffed by experienced professionals dedicated to your oral health. We believe everyone deserves a beautiful, healthy smile.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {highlights.map((line, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-foreground">{line}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-6 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">10,000+</p>
                      <p className="text-sm text-muted-foreground">Patients Treated</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Award className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">20+</p>
                      <p className="text-sm text-muted-foreground">Awards Won</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-20 bg-muted/30">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="secondary" className="mb-4">Our Services</Badge>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Comprehensive Dental Services
              </h2>
              <p className="text-muted-foreground">
                From routine checkups to advanced procedures, we offer a full range of dental services to meet your needs.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl bg-card p-6 border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <BriefcaseMedical className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <Badge variant="secondary">Contact Us</Badge>
                <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                  Get In Touch
                </h2>
                <p className="text-muted-foreground text-lg">
                  Have questions? We&apos;re here to help. Reach out to us through any of the following channels.
                </p>
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-semibold text-foreground">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-semibold text-foreground">info@dentalclinic.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-semibold text-foreground">123 Dental Street, Medical Center</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Clock3 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Working Hours</p>
                      <p className="font-semibold text-foreground">Mon - Sat: 8:00 AM - 8:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-2xl p-8 border shadow-sm">
                <h3 className="text-xl font-semibold text-foreground mb-6">Book an Appointment</h3>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">First Name</label>
                      <input
                        type="text"
                        placeholder="John"
                        className="w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Last Name</label>
                      <input
                        type="text"
                        placeholder="Doe"
                        className="w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      className="w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Phone</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Message</label>
                    <textarea
                      rows={4}
                      placeholder="Tell us about your dental needs..."
                      className="w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                  <Button className="w-full gap-2">
                    <Calendar className="h-4 w-4" />
                    Request Appointment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Heart className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground">
                  Dental Clinic
                </span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Providing exceptional dental care with modern technology and compassionate service since 2009.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#home" className="text-muted-foreground hover:text-primary transition-colors">Home</a></li>
                <li><a href="#about" className="text-muted-foreground hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#services" className="text-muted-foreground hover:text-primary transition-colors">Services</a></li>
                <li><Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">Patient Portal</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-muted-foreground">General Dentistry</span></li>
                <li><span className="text-muted-foreground">Cosmetic Dentistry</span></li>
                <li><span className="text-muted-foreground">Orthodontics</span></li>
                <li><span className="text-muted-foreground">Emergency Care</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  +1 (555) 123-4567
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  info@dentalclinic.com
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  123 Dental Street
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Dental Clinic Pro. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <MessageSquare className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
              <CreditCard className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
              <Shield className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
