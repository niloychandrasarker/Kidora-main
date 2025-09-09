import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { brandName, brandDomain } from "../utils/brand";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Online Shop */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Online Shop</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Women
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Men
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Kids
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Accessories
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-2 text-gray-300">
              <p>📍 Address</p>
              <p>📞 +880 1234567890</p>
              <p>✉️ info@{brandDomain}</p>
              <p>🌐 www.{brandDomain}</p>
            </div>
          </div>

          {/* Follow Us & Payment */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4 mb-6">
              <a
                href="#"
                className="text-gray-300 hover:text-blue-500 transition-colors"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-blue-400 transition-colors"
              >
                <Twitter className="w-6 h-6" />
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-pink-500 transition-colors"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-red-500 transition-colors"
              >
                <Youtube className="w-6 h-6" />
              </a>
            </div>

            <h4 className="text-sm font-semibold mb-2">Payment Methods</h4>
            <div className="flex space-x-2">
              <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                VISA
              </div>
              <div className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                MC
              </div>
              <div className="bg-blue-800 text-white px-2 py-1 rounded text-xs">
                AMEX
              </div>
              <div className="bg-yellow-500 text-black px-2 py-1 rounded text-xs">
                PP
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 {brandName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
