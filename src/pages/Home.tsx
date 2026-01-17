import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { NetworkVisualization } from '../components/NetworkVisualization';
import { ArrowRightIcon, ChartBarIcon, GlobeAltIcon, ShieldCheckIcon, BoltIcon } from '@heroicons/react/24/outline';
import heroImage from '../assets/hero-network.jpg';

const features = [
  {
    icon: GlobeAltIcon,
    title: 'Global Network',
    description: 'Connect with verified manufacturers and suppliers worldwide'
  },
  {
    icon: ShieldCheckIcon,
    title: 'Verified Partners',
    description: 'All companies undergo rigorous verification for trust and reliability'
  },
  {
    icon: ChartBarIcon,
    title: 'Smart Analytics',
    description: 'AI-powered insights to optimize your supply chain performance'
  },
  {
    icon: BoltIcon,
    title: 'Lightning Fast',
    description: 'Real-time collaboration and instant communication tools'
  }
];

const stats = [
  { value: '10,000+', label: 'Verified Companies' },
  { value: '50+', label: 'Countries' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' }
];

export default function Home() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="absolute inset-0 bg-background/80" />
        </div>

        {/* Network Visualization */}
        <div className="absolute inset-0 z-10">
          <NetworkVisualization />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              The Future of Supply Chain Management
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Connect, collaborate, and scale your business with our AI-powered platform that brings transparency and efficiency to global supply chains.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Button variant="hero" size="hero" className="group">
                Start Your Journey
                <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" size="hero">
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
            <motion.div
              className="w-1 h-3 bg-primary rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Why Choose ChainLink Pro?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover the powerful features that make supply chain management effortless and efficient
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group p-6 rounded-xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-primary"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Supply Chain?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of companies already using ChainLink Pro to streamline their operations
            </p>
            <Button variant="outline" size="hero" className="bg-white text-primary hover:bg-white/90">
              Get Started Today
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
