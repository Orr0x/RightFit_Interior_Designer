import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import rightfitLogo from '@/assets/logo.png';

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setIsNavVisible(currentY <= lastScrollY);
      setLastScrollY(currentY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert("Thanks — we'll be in touch shortly.");
    (e.target as HTMLFormElement).reset();
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="font-poppins">
      {/* Header */}
      <header 
        className={`fixed top-0 left-0 w-full z-50 transition-transform duration-300 bg-white border-b border-gray-200 ${
          isNavVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={rightfitLogo} alt="RightFit Interiors logo" className="h-16 w-auto" />
            </Link>
            
            <button
              className="lg:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-controls="nav-menu"
              aria-expanded={isMenuOpen}
            >
              <span className="block w-6 h-0.5 bg-gray-800 mb-1.5 transition-all"></span>
              <span className="block w-6 h-0.5 bg-gray-800 mb-1.5 transition-all"></span>
              <span className="block w-6 h-0.5 bg-gray-800 transition-all"></span>
            </button>

            <nav className={`lg:flex lg:items-center lg:gap-6 ${isMenuOpen ? 'block' : 'hidden'} lg:block absolute lg:relative top-full lg:top-auto left-4 lg:left-auto right-4 lg:right-auto bg-white lg:bg-transparent border lg:border-0 rounded-lg lg:rounded-none shadow-lg lg:shadow-none p-3 lg:p-0`}>
              <a href="#services" className="block lg:inline py-2 lg:py-0 text-gray-800 hover:text-blue-600 transition-colors">Services</a>
              <a href="#gallery" className="block lg:inline py-2 lg:py-0 text-gray-800 hover:text-blue-600 transition-colors">Gallery</a>
              <a href="#contact" className="block lg:inline py-2 lg:py-0 text-gray-800 hover:text-blue-600 transition-colors">Contact</a>
              <Link to="/app" className="block lg:inline py-2 lg:py-0 text-gray-800 hover:text-blue-600 transition-colors font-medium">Interior Designer</Link>
              <a href="#contact" className="block lg:inline mt-2 lg:mt-0 bg-blue-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors">Free consultation</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="hero-fixed relative bg-cover bg-center bg-fixed text-white text-center py-32 lg:py-40"
        style={{
          backgroundImage: "url('https://c.pxhere.com/photos/69/3c/kitchen_interior_luxury_home_modern_design_kitchen_interior_house-1370531.jpg!d')"
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-55"></div>
        <div className="relative z-10 container mx-auto px-4">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 leading-tight">
            Transforming Homes with Bespoke Carpentry & Joinery
          </h1>
          <p className="text-xl lg:text-2xl font-light mb-8 text-gray-200 max-w-3xl mx-auto">
            Over 25 years of experience creating custom kitchens, bedrooms, and interiors tailored to your lifestyle.
          </p>
          <a href="#contact" className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg">
            Schedule Your Free Consultation
          </a>
        </div>

        {/* Feature row overlay */}
        <div className="relative z-10 flex flex-wrap justify-center gap-6 mt-16 py-8 bg-white bg-opacity-85 text-gray-800 border-t border-b border-gray-200">
          <div className="flex-1 text-center max-w-64 min-w-48">
            <div className="font-semibold mb-1">Bespoke Designs</div>
            <div className="text-sm text-gray-600">Tailored solutions for your unique needs.</div>
          </div>
          <div className="flex-1 text-center max-w-64 min-w-48">
            <div className="font-semibold mb-1">Bedrooms</div>
            <div className="text-sm text-gray-600">Quality craftsmanship for stunning bedroom renovations.</div>
          </div>
          <div className="flex-1 text-center max-w-64 min-w-48">
            <div className="font-semibold mb-1">Kitchens</div>
            <div className="text-sm text-gray-600">Maximize market appeal with expert renovations.</div>
          </div>
        </div>
      </section>

      {/* Tagline / About section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-semibold mb-4 text-gray-800">
                Transforming Spaces, Elevating Homes
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                At RightFit Interiors, we blend traditional craftsmanship with modern design to deliver spaces that are both functional and beautiful. Our commitment to quality and attention to detail ensures every project exceeds expectations.
              </p>
            </div>
            <div>
              <img 
                src="https://c.pxhere.com/photos/69/3c/kitchen_interior_luxury_home_modern_design_kitchen_interior_house-1370531.jpg!d" 
                alt="Contemporary kitchen" 
                className="rounded-2xl shadow-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-semibold text-center mb-4 text-gray-800">Expert Services</h2>
          <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Explore our range of services, from custom kitchen installations to bespoke bedroom fittings, all designed to enhance your home's value and appeal.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Bedrooms",
                image: "https://c.pxhere.com/photos/5c/3f/photo-1606932.jpg!d",
                description: "Transform your bedroom into a serene retreat with our bespoke solutions, including fitted wardrobes, custom storage, and elegant finishes tailored to your preferences.",
                link: "/bedrooms"
              },
              {
                title: "Kitchens",
                image: "https://c.pxhere.com/photos/69/3c/kitchen_interior_luxury_home_modern_design_kitchen_interior_house-1370531.jpg!d",
                description: "Our kitchen fitting service encompasses design consultation, custom cabinetry, and seamless installation. We work closely with you to create a kitchen that reflects your style and meets your functional needs.",
                link: "/kitchens"
              },
              {
                title: "Internal Doors",
                image: "https://c.pxhere.com/photos/5c/3f/photo-1606932.jpg!d",
                description: "Upgrade your home's interior with professionally installed doors, available in a range of styles and materials to suit your design vision.",
                link: "/internal-doors"
              },
              {
                title: "Flooring",
                image: "https://c.pxhere.com/photos/62/ef/tv-362221.jpg!d",
                description: "Enhance your interiors with our expert flooring services, offering a variety of materials and finishes to complement your home's aesthetic.",
                link: "/flooring"
              },
              {
                title: "Media Walls",
                image: "https://c.pxhere.com/photos/62/ef/tv-362221.jpg!d",
                description: "Create stunning media walls with integrated storage and display options, custom built to house your entertainment essentials.",
                link: "/media-walls"
              },
              {
                title: "Under Stair Storage",
                image: "https://c.pxhere.com/photos/5c/3f/photo-1606932.jpg!d",
                description: "Maximise unused space with bespoke under stair storage solutions, from pull-out drawers to hidden cabinets tailored to your staircase.",
                link: "/under-stair-storage"
              }
            ].map((service, index) => (
              <Link key={index} to={service.link} className="group block bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                <img 
                  src={service.image} 
                  alt={service.title} 
                  className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">{service.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{service.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery section */}
      <section id="gallery" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-semibold text-center mb-4 text-gray-800">Gallery</h2>
          <p className="text-lg text-gray-600 text-center mb-12">
            Explore our portfolio of stunning kitchen and bathroom transformations.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              "https://c.pxhere.com/photos/69/3c/kitchen_interior_luxury_home_modern_design_kitchen_interior_house-1370531.jpg!d",
              "https://c.pxhere.com/photos/5c/3f/photo-1606932.jpg!d",
              "https://c.pxhere.com/photos/62/ef/tv-362221.jpg!d",
              "https://c.pxhere.com/photos/5c/3f/photo-1606932.jpg!d",
              "https://c.pxhere.com/photos/69/3c/kitchen_interior_luxury_home_modern_design_kitchen_interior_house-1370531.jpg!d",
              "https://c.pxhere.com/photos/62/ef/tv-362221.jpg!d"
            ].map((image, index) => (
              <div key={index} className="group overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300">
                <img 
                  src={image} 
                  alt={`Gallery image ${index + 1}`}
                  className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials section */}
      <section 
        className="testimonials-static relative py-24 bg-cover bg-center bg-fixed text-white"
        style={{
          backgroundImage: "url('https://c.pxhere.com/photos/69/3c/kitchen_interior_luxury_home_modern_design_kitchen_interior_house-1370531.jpg!d')"
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="relative z-10 container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-semibold text-center mb-12">Testimonials</h2>
          <div className="flex flex-wrap justify-center gap-12">
            <div className="max-w-md text-center">
              <div className="text-2xl text-blue-400 mb-4">★★★★★</div>
              <p className="mb-4 text-lg">
                RightFit Interiors transformed our outdated kitchen into a stunning space. Highly recommend their craftsmanship and service!
              </p>
              <div className="font-semibold">Sarah J.</div>
            </div>
            <div className="max-w-md text-center">
              <div className="text-2xl text-blue-400 mb-4">★★★★★</div>
              <p className="mb-4 text-lg">
                Exceptional service and attention to detail! My bedroom renovation exceeded all expectations. Truly a professional experience.
              </p>
              <div className="font-semibold">Mark T.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact section */}
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-semibold mb-4 text-gray-800">Get in touch</h2>
              <p className="text-lg text-gray-600 mb-8">
                Serving homeowners in and around Burton on Trent, UK. Tell us about your project and we'll get back with ideas and a free quote.
              </p>
              <div className="space-y-4">
                <div className="text-gray-800">
                  Phone: <a href="tel:07838481948" className="text-blue-600 hover:text-blue-700">07838 481 948</a>
                </div>
                <div className="text-gray-800">
                  Email: <a href="mailto:Contact-Us@rightfit-kitchens.co.uk" className="text-blue-600 hover:text-blue-700">Contact-Us@rightfit-kitchens.co.uk</a>
                </div>
                <div className="text-gray-800">
                  Social: 
                  <a href="https://www.facebook.com/" className="text-blue-600 hover:text-blue-700 ml-2">Facebook</a> · 
                  <a href="https://twitter.com/" className="text-blue-600 hover:text-blue-700 ml-1">X</a> · 
                  <a href="https://www.tiktok.com/" className="text-blue-600 hover:text-blue-700 ml-1">TikTok</a>
                </div>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="bg-gray-50 rounded-2xl p-8 shadow-sm">
              <div className="mb-6">
                <label className="block text-gray-800 font-medium mb-2">Your name</label>
                <input 
                  type="text" 
                  placeholder="Enter your name" 
                  required 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-800 font-medium mb-2">Email address</label>
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  required 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-800 font-medium mb-2">Your message</label>
                <textarea 
                  rows={5} 
                  placeholder="Tell us about your project" 
                  required 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Submit your inquiry
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            <div>
              <h3 className="text-xl font-semibold mb-4">Transformations</h3>
              <p className="text-gray-200 mb-6">Expert kitchen and bathroom renovations for homeowners.</p>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/" className="text-gray-200 hover:text-white">Facebook</a>
                <a href="https://www.instagram.com/" className="text-gray-200 hover:text-white">Instagram</a>
                <a href="https://www.tiktok.com/" className="text-gray-200 hover:text-white">TikTok</a>
                <a href="https://twitter.com/" className="text-gray-200 hover:text-white">X</a>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">Get in touch</h3>
              <div className="space-y-2 text-gray-200">
                <div>07838 481 948</div>
                <div>
                  <a href="mailto:Contact-Us@rightfit-kitchens.co.uk" className="hover:text-white">
                    Contact-Us@rightfit-kitchens.co.uk
                  </a>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">Service</h3>
              <form className="space-y-3">
                <input 
                  type="email" 
                  placeholder="Your email for contact" 
                  required 
                  className="w-full px-4 py-3 rounded-lg text-gray-800"
                />
                <button 
                  type="submit" 
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Submit your request now
                </button>
              </form>
            </div>
          </div>
          
          <div className="border-t border-white border-opacity-20 mt-12 pt-8 text-center">
            <p className="text-gray-200">© {currentYear}. All rights reserved.</p>
            <p className="text-gray-300 text-sm mt-2">🚀 CICD Baby</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;