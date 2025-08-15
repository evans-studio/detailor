"use client";

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { Card, CardContent } from '@/ui/card';

// Types
interface BrandSettings {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  font_family?: string;
}

interface BusinessInfo {
  name: string;
  legal_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  service_area?: string;
  years_experience?: number;
  certifications?: string[];
  insurance_details?: string;
}

interface HomepageContent {
  hero?: {
    tagline?: string;
    description?: string;
    cta_text?: string;
    hero_image_url?: string;
    video_url?: string;
  };
  about?: {
    title?: string;
    content?: string;
    image_url?: string;
    team_photo?: string;
  };
  services?: {
    featured?: Array<{
      name: string;
      description: string;
      price_from?: number;
      duration?: string;
      image_url?: string;
      features?: string[];
    }>;
    show_pricing?: boolean;
  };
  testimonials?: Array<{
    name: string;
    content: string;
    rating?: number;
    image_url?: string;
    location?: string;
    date?: string;
  }>;
  gallery?: {
    title?: string;
    images?: Array<{
      url: string;
      caption?: string;
      before_url?: string;
    }>;
  };
  contact?: {
    show_phone?: boolean;
    show_email?: boolean;
    show_address?: boolean;
    service_area_radius?: number;
    booking_widget?: boolean;
  };
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

interface TemplateProps {
  businessInfo: BusinessInfo;
  brand: BrandSettings;
  content: HomepageContent;
}

// Premium Professional Template
export function PremiumProfessionalTemplate({ businessInfo, brand, content }: TemplateProps) {
  const primaryColor = brand.primary_color || '#1a365d';
  // const secondaryColor = brand.secondary_color || '#2d3748';

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[var(--color-surface)]/95 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {brand.logo_url ? (
                <Image 
                  src={brand.logo_url} 
                  alt={`${businessInfo.name} Logo`} 
                  width={48} 
                  height={48}
                  className="rounded-lg"
                />
              ) : (
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  {businessInfo.name.charAt(0)}
                </div>
              )}
              <div className="font-bold text-xl" style={{ color: primaryColor }}>
                {businessInfo.name}
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] font-medium transition-colors">
                Services
              </a>
              <a href="#about" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] font-medium transition-colors">
                About
              </a>
              <a href="#gallery" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] font-medium transition-colors">
                Gallery
              </a>
              <a href="#testimonials" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] font-medium transition-colors">
                Reviews
              </a>
              <a href="#contact" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] font-medium transition-colors">
                Contact
              </a>
              <Button 
                className="text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                style={{ backgroundColor: primaryColor }}
              >
                Book Now
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-[var(--color-border)]">
              <div className="space-y-4">
                <a href="#services" className="block text-[var(--color-text)] font-medium">Services</a>
                <a href="#about" className="block text-[var(--color-text)] font-medium">About</a>
                <a href="#gallery" className="block text-[var(--color-text)] font-medium">Gallery</a>
                <a href="#testimonials" className="block text-[var(--color-text)] font-medium">Reviews</a>
                <a href="#contact" className="block text-[var(--color-text)] font-medium">Contact</a>
                <Button 
                  className="w-full text-white font-semibold"
                  style={{ backgroundColor: primaryColor }}
                >
                  Book Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-muted)] to-[var(--color-surface)]" />
        {content.hero?.hero_image_url && (
          <div className="absolute inset-0 opacity-10">
            <Image 
              src={content.hero.hero_image_url}
              alt="Hero Background"
              fill
              className="object-cover"
            />
          </div>
        )}
        
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-slide-in-left">
              <div className="space-y-4">
                <Badge 
                  className="text-white font-medium shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  ⭐ Premium Mobile Detailing Service
                </Badge>
                
                <h1 className="text-5xl lg:text-6xl font-bold text-[var(--color-text)] leading-tight">
                  {content.hero?.tagline || 'Premium Mobile Detailing That Comes to You'}
                </h1>
                
                <p className="text-xl text-[var(--color-text-secondary)] leading-relaxed">
                  {content.hero?.description || 'Professional car detailing services delivered to your location. Experience showroom-quality results with the convenience of mobile service.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="text-white font-semibold text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: primaryColor }}
                >
                  {content.hero?.cta_text || 'Book Your Detail'}
                </Button>
                <Button 
                  intent="secondary" 
                  size="lg"
                  className="font-semibold text-lg px-8 py-4 border-2 hover:bg-[var(--color-hover-surface)] transition-all"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  View Services
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="font-medium">Fully Insured</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="font-medium">5-Star Rated</span>
                </div>
                {businessInfo.years_experience && (
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-medium">{businessInfo.years_experience}+ Years Experience</span>
                  </div>
                )}
              </div>
            </div>

            {/* Hero Image/Video */}
            <div className="relative animate-slide-in-right animate-delay-200">
              {content.hero?.video_url ? (
                <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
                  <iframe 
                    src={content.hero.video_url}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                </div>
              ) : content.hero?.hero_image_url ? (
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                  <Image 
                    src={content.hero.hero_image_url}
                    alt="Professional Car Detailing"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div 
                  className="aspect-[4/3] rounded-2xl shadow-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}10` }}
                >
                  <div className="text-center p-8">
                    <svg className="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <p className="text-gray-500 text-lg">Professional Service Image</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[var(--color-text)] mb-4">
              Premium Detailing Services
            </h2>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              From basic washes to full paint correction, we offer comprehensive detailing services 
              tailored to your vehicle&apos;s needs and your budget.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8 stagger-children">
            {(content.services?.featured || []).map((service, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
                {service.image_url && (
                  <div className="relative h-48 overflow-hidden">
                    <Image 
                      src={service.image_url}
                      alt={service.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                )}
                
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-[var(--color-text)]">{service.name}</h3>
                    <p className="text-[var(--color-text-secondary)] leading-relaxed">{service.description}</p>
                  </div>

                  {service.features && (
                    <div className="space-y-2">
                      {service.features.slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                    <div className="space-y-1">
                      {service.price_from && (
                        <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                          From £{service.price_from}
                        </div>
                      )}
                      {service.duration && (
                        <div className="text-sm text-[var(--color-text-muted)]">
                          Duration: {service.duration}
                        </div>
                      )}
                    </div>
                    <Button 
                      className="text-white font-medium"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {content.testimonials && content.testimonials.length > 0 && (
        <section id="testimonials" className="py-20 bg-[var(--color-muted)]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-[var(--color-text)] mb-4">
                What Our Customers Say
              </h2>
              <p className="text-xl text-[var(--color-text-secondary)]">
                Don&apos;t just take our word for it - hear from our satisfied customers
              </p>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8 stagger-children">
              {content.testimonials.slice(0, 6).map((testimonial, index) => (
                <Card key={index} className="bg-[var(--color-surface)] border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 space-y-4">
                    {/* Stars */}
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating || 5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>

                    {/* Content */}
                    <blockquote className="text-[var(--color-text)] italic leading-relaxed">
                      &ldquo;{testimonial.content}&rdquo;
                    </blockquote>

                    {/* Author */}
                    <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-border)]">
                      {testimonial.image_url ? (
                        <Image 
                          src={testimonial.image_url}
                          alt={testimonial.name}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {testimonial.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-[var(--color-text)]">{testimonial.name}</div>
                        {testimonial.location && (
                          <div className="text-sm text-[var(--color-text-muted)]">{testimonial.location}</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {content.gallery?.images && content.gallery.images.length > 0 && (
        <section id="gallery" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                {content.gallery.title || 'Our Work Gallery'}
              </h2>
              <p className="text-xl text-gray-600">
                See the amazing transformations we deliver for our customers
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {content.gallery.images.slice(0, 12).map((image, index) => (
                <div key={index} className="group relative aspect-square rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                  <Image 
                    src={image.url}
                    alt={image.caption || `Gallery Image ${index + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                  {image.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="text-white text-sm font-medium">{image.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-[var(--color-surface-strong)] text-[var(--color-inverse-text)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold">Ready to Book Your Detail?</h2>
                <p className="text-xl text-[var(--color-inverse-text-muted)] leading-relaxed">
                  Experience the difference of professional mobile detailing. Contact us today 
                  to schedule your appointment and give your vehicle the care it deserves.
                </p>
              </div>

              <div className="space-y-4">
                {businessInfo.phone && (
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">Call Us</div>
                      <div className="text-[var(--color-inverse-text-muted)]">{businessInfo.phone}</div>
                    </div>
                  </div>
                )}

                {businessInfo.email && (
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">Email Us</div>
                      <div className="text-[var(--color-inverse-text-muted)]">{businessInfo.email}</div>
                    </div>
                  </div>
                )}

                {businessInfo.service_area && (
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">Service Area</div>
                      <div className="text-[var(--color-inverse-text-muted)]">{businessInfo.service_area}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center lg:text-right">
              <Button 
                size="lg"
                className="text-white font-bold text-xl px-12 py-6 shadow-xl hover:shadow-2xl transition-all"
                style={{ backgroundColor: primaryColor }}
              >
                Book Your Detail Now
              </Button>
              <p className="mt-4 text-[var(--color-inverse-text-muted)]">
                Quick online booking • Instant confirmation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[var(--color-surface-strong)] text-[var(--color-inverse-text-muted)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm">
              © {new Date().getFullYear()} {businessInfo.name}. All rights reserved.
            </div>
            <div className="text-sm">
              Powered by{' '}
              <Link href="https://detailor.co.uk" className="hover:text-white transition-colors">
                Detailor
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}