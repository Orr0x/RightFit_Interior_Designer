import { Link } from 'react-router-dom';
import rightfitLogo from '@/assets/logo.png';

interface ServicePageProps {
  title: string;
  description: string;
  heroImage: string;
  content: {
    heading: string;
    text: string;
  }[];
  features: string[];
}

const ServicePage = ({ title, description, heroImage, content, features }: ServicePageProps) => {
  return (
    <div className="font-poppins">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={rightfitLogo} alt="RightFit Interiors logo" className="h-16 w-auto" />
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-gray-800 hover:text-blue-600 transition-colors">Home</Link>
              <Link to="/#services" className="text-gray-800 hover:text-blue-600 transition-colors">Services</Link>
              <Link to="/#gallery" className="text-gray-800 hover:text-blue-600 transition-colors">Gallery</Link>
              <Link to="/#contact" className="text-gray-800 hover:text-blue-600 transition-colors">Contact</Link>
              <Link to="/designer" className="text-gray-800 hover:text-blue-600 transition-colors font-medium">Interior Designer</Link>
              <Link to="/#contact" className="bg-blue-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors">Free consultation</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative bg-cover bg-center text-white py-32 lg:py-40 mt-20"
        style={{ backgroundImage: `url('${heroImage}')` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-55"></div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 leading-tight">
            {title}
          </h1>
          <p className="text-xl lg:text-2xl font-light text-gray-200 max-w-3xl mx-auto">
            {description}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {content.map((section, index) => (
              <div key={index} className="mb-12">
                <h2 className="text-3xl font-semibold mb-6 text-gray-800">{section.heading}</h2>
                <p className="text-lg text-gray-600 leading-relaxed">{section.text}</p>
              </div>
            ))}

            {features.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-8 mb-12">
                <h3 className="text-2xl font-semibold mb-6 text-gray-800">What We Offer</h3>
                <ul className="grid md:grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-blue-600 font-bold text-lg">•</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-semibold mb-4">Ready to Transform Your Space?</h2>
          <p className="text-xl mb-8 text-blue-100">Get in touch for a free consultation and quote.</p>
          <Link 
            to="/#contact" 
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors"
          >
            Contact Us Today
          </Link>
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
            <p className="text-gray-200">© {new Date().getFullYear()}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ServicePage;