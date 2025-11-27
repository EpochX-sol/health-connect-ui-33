import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Activity, Calendar, MessageSquare, Shield, Video } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xlfont-bold bg-gradient-primary bg-clip-text text-transparent text-white">
                MedLink
              </span>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/register/patient">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6">
              Quality Healthcare,{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent text-white">
                Anytime, Anywhere
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect with verified healthcare professionals through secure video consultations. 
              Get the care you need from the comfort of your home.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" asChild>
                <Link to="/register/patient">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Appointment
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/register/doctor">Join as Doctor</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose MedLink?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center">
                  <Video className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">HD Video Consultations</h3>
                <p className="text-muted-foreground">
                  Connect with doctors through secure, high-quality video calls
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-full bg-gradient-secondary mx-auto mb-4 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Verified Doctors</h3>
                <p className="text-muted-foreground">
                  All doctors are verified with proper credentials and licenses
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure Messaging</h3>
                <p className="text-muted-foreground">
                  Communicate privately with your healthcare providers
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of patients getting quality healthcare online
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" asChild>
                <Link to="/register/patient">Create Patient Account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/register/doctor">Register as Doctor</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 MedLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
