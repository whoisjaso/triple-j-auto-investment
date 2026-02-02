import React from 'react';
import { Link } from 'react-router-dom';
import { useVehicles } from '../context/VehicleContext';
import { useLanguage } from '../context/LanguageContext';
import { ArrowRight, Check, Shield, Clock, Award } from 'lucide-react';
import { motion } from 'framer-motion';

// Simple Hero Section
const Hero = () => {
  return (
    <section className="relative h-[90vh] flex items-center justify-center bg-gray-900 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: 'url(https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80)',
          filter: 'brightness(0.4)'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
        >
          Premium Vehicles, <br />
          <span className="text-yellow-500">Exceptional Value</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto"
        >
          Houston's trusted destination for quality used luxury vehicles. 
          Transparent pricing, no hidden fees.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link 
            to="/inventory"
            className="inline-flex items-center justify-center gap-2 bg-yellow-500 text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
          >
            View Inventory
            <ArrowRight size={18} />
          </Link>
          <Link 
            to="/contact"
            className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors"
          >
            Contact Us
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <motion.div 
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-2 bg-white rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
};

// Stats Section
const Stats = () => {
  const stats = [
    { value: '500+', label: 'Vehicles Sold' },
    { value: '15+', label: 'Years Experience' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '4.9', label: 'Google Rating' },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Featured Vehicles
const FeaturedVehicles = () => {
  const { vehicles } = useVehicles();
  const featured = vehicles
    .filter(v => v.status === 'Available')
    .sort((a, b) => b.price - a.price)
    .slice(0, 3);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Featured Vehicles</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Hand-selected premium vehicles. Each car undergoes a comprehensive inspection before listing.
          </p>
        </div>

        {featured.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featured.map((vehicle) => (
              <Link 
                key={vehicle.id} 
                to="/inventory"
                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                  <img 
                    src={vehicle.imageUrl} 
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span>{vehicle.year}</span>
                    <span>•</span>
                    <span>{vehicle.make}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{vehicle.model}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-yellow-600">
                      ${vehicle.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-green-600 font-medium">Available</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-xl">
            <p className="text-gray-500">New inventory arriving soon. Check back later!</p>
          </div>
        )}

        <div className="text-center mt-12">
          <Link 
            to="/inventory"
            className="inline-flex items-center gap-2 text-yellow-600 font-semibold hover:text-yellow-700"
          >
            View All Inventory
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
};

// Why Choose Us
const WhyChooseUs = () => {
  const features = [
    {
      icon: Check,
      title: 'Thoroughly Inspected',
      description: 'Every vehicle undergoes a comprehensive 150-point inspection.',
    },
    {
      icon: Shield,
      title: 'Transparent Pricing',
      description: 'No hidden fees or surprises. What you see is what you pay.',
    },
    {
      icon: Clock,
      title: 'Fast Financing',
      description: 'Get pre-approved in minutes with our financing partners.',
    },
    {
      icon: Award,
      title: 'Texas Licensed',
      description: 'Fully licensed dealer (TX License P171632) with years of experience.',
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose Triple J?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We believe in honest business and quality vehicles. Here's what sets us apart.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-6">
                <feature.icon className="text-yellow-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA Section
const CTASection = () => {
  return (
    <section className="py-20 bg-gray-900">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Ready to Find Your Next Vehicle?
        </h2>
        <p className="text-gray-400 mb-10 max-w-2xl mx-auto">
          Visit our showroom in Houston or browse our inventory online. 
          Our team is ready to help you find the perfect car.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/inventory"
            className="inline-flex items-center justify-center gap-2 bg-yellow-500 text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
          >
            Browse Inventory
          </Link>
          <Link 
            to="/contact"
            className="inline-flex items-center justify-center gap-2 border-2 border-gray-600 text-white px-8 py-4 rounded-lg font-semibold hover:border-white transition-colors"
          >
            Get Directions
          </Link>
        </div>
      </div>
    </section>
  );
};

// Main Home Component
const Home = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Hero />
      <Stats />
      <FeaturedVehicles />
      <WhyChooseUs />
      <CTASection />
    </motion.div>
  );
};

export default Home;
