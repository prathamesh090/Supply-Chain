import { motion } from 'framer-motion';
import { useState } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { MagnifyingGlassIcon, MapPinIcon, StarIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

const suppliers = [
  {
    id: 1,
    name: 'TechParts Manufacturing Co.',
    industry: 'Electronics',
    location: 'Shenzhen, China',
    rating: 4.8,
    reviews: 156,
    specialties: ['PCB Assembly', 'Component Sourcing', 'Quality Testing'],
    verified: true,
    description: 'Leading electronics manufacturer with 15+ years of experience in high-quality PCB assembly and component sourcing.',
    minOrder: '$5,000',
    leadTime: '7-14 days',
    certifications: ['ISO 9001', 'RoHS', 'CE']
  },
  {
    id: 2,
    name: 'Global Textile Solutions',
    industry: 'Textiles',
    location: 'Mumbai, India',
    rating: 4.6,
    reviews: 203,
    specialties: ['Organic Cotton', 'Sustainable Fabrics', 'Custom Printing'],
    verified: true,
    description: 'Sustainable textile manufacturer focused on eco-friendly fabrics and ethical production practices.',
    minOrder: '$2,000',
    leadTime: '10-21 days',
    certifications: ['GOTS', 'OEKO-TEX', 'Fair Trade']
  },
  {
    id: 3,
    name: 'Precision Metal Works',
    industry: 'Manufacturing',
    location: 'Detroit, USA',
    rating: 4.9,
    reviews: 89,
    specialties: ['CNC Machining', 'Die Casting', 'Surface Treatment'],
    verified: true,
    description: 'Precision manufacturing specialist with state-of-the-art CNC machinery and strict quality controls.',
    minOrder: '$3,000',
    leadTime: '5-12 days',
    certifications: ['ISO 9001', 'AS9100', 'IATF 16949']
  },
  {
    id: 4,
    name: 'BioPharm Ingredients Ltd.',
    industry: 'Pharmaceuticals',
    location: 'Basel, Switzerland',
    rating: 4.7,
    reviews: 124,
    specialties: ['API Manufacturing', 'Custom Synthesis', 'Regulatory Support'],
    verified: true,
    description: 'Pharmaceutical ingredient manufacturer with full regulatory compliance and custom synthesis capabilities.',
    minOrder: '$10,000',
    leadTime: '14-30 days',
    certifications: ['GMP', 'FDA', 'EMA']
  },
  {
    id: 5,
    name: 'Eco Pack Solutions',
    industry: 'Packaging',
    location: 'São Paulo, Brazil',
    rating: 4.5,
    reviews: 178,
    specialties: ['Biodegradable Packaging', 'Custom Design', 'Food Grade'],
    verified: true,
    description: 'Innovative packaging solutions with focus on biodegradable and sustainable materials.',
    minOrder: '$1,500',
    leadTime: '8-18 days',
    certifications: ['FSC', 'BRC', 'FDA']
  },
  {
    id: 6,
    name: 'Smart Components Inc.',
    industry: 'Technology',
    location: 'Tokyo, Japan',
    rating: 4.8,
    reviews: 142,
    specialties: ['IoT Sensors', 'Embedded Systems', 'Wireless Modules'],
    verified: true,
    description: 'Cutting-edge technology components for IoT and smart device applications.',
    minOrder: '$8,000',
    leadTime: '12-25 days',
    certifications: ['ISO 27001', 'FCC', 'IC']
  }
];

const industries = ['All Industries', 'Electronics', 'Textiles', 'Manufacturing', 'Pharmaceuticals', 'Packaging', 'Technology'];
const locations = ['All Locations', 'China', 'India', 'USA', 'Switzerland', 'Brazil', 'Japan'];

export default function Directory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.specialties.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesIndustry = selectedIndustry === 'All Industries' || supplier.industry === selectedIndustry;
    const matchesLocation = selectedLocation === 'All Locations' || supplier.location.includes(selectedLocation);
    
    return matchesSearch && matchesIndustry && matchesLocation;
  });

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
              Supplier Directory
            </h1>
            <p className="text-xl text-muted-foreground">
              Connect with verified suppliers worldwide. Find the perfect partners for your business needs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search suppliers or specialties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-4">
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map(industry => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Results Count */}
      <section className="py-4 bg-muted/30">
        <div className="container mx-auto px-4">
          <p className="text-muted-foreground">
            Showing {filteredSuppliers.length} of {suppliers.length} suppliers
          </p>
        </div>
      </section>

      {/* Suppliers Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSuppliers.map((supplier, index) => (
              <motion.div
                key={supplier.id}
                className="group bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-elegant"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <BuildingOfficeIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{supplier.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPinIcon className="h-4 w-4" />
                        {supplier.location}
                      </p>
                    </div>
                  </div>
                  {supplier.verified && (
                    <Badge variant="secondary" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(supplier.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{supplier.rating}</span>
                  <span className="text-sm text-muted-foreground">({supplier.reviews} reviews)</span>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {supplier.description}
                </p>

                {/* Specialties */}
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Specialties:</p>
                  <div className="flex flex-wrap gap-2">
                    {supplier.specialties.slice(0, 3).map((specialty) => (
                      <Badge key={specialty} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Min Order:</p>
                    <p className="font-medium">{supplier.minOrder}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Lead Time:</p>
                    <p className="font-medium">{supplier.leadTime}</p>
                  </div>
                </div>

                {/* Certifications */}
                <div className="mb-6">
                  <p className="text-sm font-medium mb-2">Certifications:</p>
                  <div className="flex flex-wrap gap-1">
                    {supplier.certifications.slice(0, 3).map((cert) => (
                      <Badge key={cert} variant="secondary" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Profile
                  </Button>
                  <Button variant="hero" size="sm" className="flex-1">
                    Connect
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredSuppliers.length === 0 && (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No suppliers found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters
              </p>
            </motion.div>
          )}
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
              Can't Find What You're Looking For?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Our team can help you find the perfect suppliers for your specific needs
            </p>
            <Button variant="outline" size="hero" className="bg-white text-primary hover:bg-white/90">
              Request Custom Search
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}