import { motion } from 'framer-motion';
import { useState } from 'react';

const industries = [
  {
    name: 'Manufacturing',
    description: 'Streamline production processes with integrated supplier networks and quality control',
    applications: ['Raw material sourcing', 'Equipment procurement', 'Quality assurance', 'Just-in-time delivery'],
    caseStudy: 'Reduced procurement time by 40% for automotive manufacturer',
    color: 'from-blue-500 to-purple-600'
  },
  {
    name: 'Healthcare',
    description: 'Ensure compliance and reliability in medical supply chains with verified pharmaceutical suppliers',
    applications: ['Medical device sourcing', 'Pharmaceutical supply', 'Regulatory compliance', 'Cold chain management'],
    caseStudy: 'Improved supply chain visibility by 60% for medical device company',
    color: 'from-green-500 to-teal-600'
  },
  {
    name: 'Technology',
    description: 'Connect with specialized tech component suppliers and manage complex electronics supply chains',
    applications: ['Component sourcing', 'PCB manufacturing', 'Assembly services', 'Testing and validation'],
    caseStudy: 'Cut component costs by 25% for IoT device manufacturer',
    color: 'from-purple-500 to-pink-600'
  },
  {
    name: 'Retail & E-commerce',
    description: 'Scale your retail operations with efficient product sourcing and inventory management',
    applications: ['Product sourcing', 'Private labeling', 'Inventory optimization', 'Seasonal planning'],
    caseStudy: 'Increased product variety by 300% for online retailer',
    color: 'from-orange-500 to-red-600'
  },
  {
    name: 'Food & Beverage',
    description: 'Maintain quality and compliance in food supply chains with certified suppliers',
    applications: ['Ingredient sourcing', 'Packaging solutions', 'Food safety compliance', 'Seasonal sourcing'],
    caseStudy: 'Achieved 99.8% quality compliance for food processor',
    color: 'from-yellow-500 to-orange-600'
  },
  {
    name: 'Construction',
    description: 'Access reliable building material suppliers and manage large-scale construction projects',
    applications: ['Material procurement', 'Equipment rental', 'Subcontractor management', 'Project coordination'],
    caseStudy: 'Reduced project delays by 35% for construction company',
    color: 'from-gray-500 to-blue-600'
  }
];

const filterCategories = [
  'All Industries',
  'Manufacturing',
  'Healthcare',
  'Technology',
  'Retail & E-commerce',
  'Food & Beverage',
  'Construction'
];

export default function Industries() {
  const [activeFilter, setActiveFilter] = useState('All Industries');

  const filteredIndustries = activeFilter === 'All Industries' 
    ? industries 
    : industries.filter(industry => industry.name === activeFilter);

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Industry Solutions
            </h1>
            <p className="text-xl text-muted-foreground">
              Tailored supply chain solutions for every industry, backed by deep domain expertise and proven results
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {filterCategories.map((category) => (
              <motion.button
                key={category}
                onClick={() => setActiveFilter(category)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeFilter === category
                    ? 'bg-gradient-primary text-white shadow-primary'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            layout
          >
            {filteredIndustries.map((industry, index) => (
              <motion.div
                key={industry.name}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-elegant"
                whileHover={{ y: -5 }}
              >
                {/* Header with gradient */}
                <div className={`h-32 bg-gradient-to-br ${industry.color} relative`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-2xl font-bold text-white">{industry.name}</h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <p className="text-muted-foreground">{industry.description}</p>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Key Applications:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {industry.applications.map((app, appIndex) => (
                        <li key={appIndex} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          {app}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="font-semibold text-primary mb-1">Success Story</h4>
                    <p className="text-sm text-muted-foreground">{industry.caseStudy}</p>
                  </div>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Proven Results Across Industries
            </h2>
            <p className="text-muted-foreground">
              Our platform delivers measurable impact for businesses of all sizes
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '2,500+', label: 'Companies Served' },
              { value: '35%', label: 'Average Cost Reduction' },
              { value: '50%', label: 'Faster Procurement' },
              { value: '99.5%', label: 'Quality Compliance' }
            ].map((stat, index) => (
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
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Industry?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join industry leaders who trust ChainLink Pro for their supply chain needs
            </p>
            <motion.button
              className="bg-white text-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/90 transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Schedule a Demo
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}