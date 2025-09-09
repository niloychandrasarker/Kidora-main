import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Mail, User, Phone, Lock, ArrowRight, Loader2 } from "lucide-react";

const RegisterPage = ({ onClose, switchToLogin }) => {
  const { sendOtp, verifyOtp, register } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("form"); // "form" | "otp" | "verified"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    // Validate form
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.phone) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    const result = await sendOtp(formData.email, true);
    
    if (result.success) {
      setStep("otp");
      setMessage("OTP sent to your email successfully!");
    } else {
      setError(result.message || "Failed to send OTP");
    }
    
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await verifyOtp(formData.email, otp);
    
    if (result.success) {
      setStep("verified");
      setMessage("OTP verified! Completing registration...");
      
      // Complete registration
      const registerResult = await register(formData);
      
      if (registerResult.success) {
        setMessage("Registration successful!");
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setError(registerResult.message || "Registration failed");
      }
    } else {
      setError(result.message || "Invalid OTP");
    }
    
    setLoading(false);
  };

  const resendOtp = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    const result = await sendOtp(formData.email, true);
    
    if (result.success) {
      setMessage("OTP resent successfully!");
    } else {
      setError(result.message || "Failed to resend OTP");
    }
    
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
        <p className="text-gray-600">Join Kidora and start shopping</p>
      </div>

      {step === "form" && (
        <form onSubmit={handleSendOtp} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="First name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Last name"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            {loading ? "Sending OTP..." : "Send Verification Code"}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={switchToLogin}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="text-center mb-6">
            <Lock className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Verify Your Email</h3>
            <p className="text-sm text-gray-600">
              We've sent a 6-digit code to <strong>{formData.email}</strong>
            </p>
          </div>

          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
              Enter OTP
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\\D/g, "").slice(0, 6))}
              required
              maxLength={6}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="000000"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            {loading ? "Creating Account..." : "Verify & Create Account"}
          </button>

          <div className="flex justify-between items-center text-sm">
            <button
              type="button"
              onClick={() => setStep("form")}
              className="text-gray-600 hover:text-gray-500"
            >
              ← Change details
            </button>
            <button
              type="button"
              onClick={resendOtp}
              disabled={loading}
              className="text-blue-600 hover:text-blue-500 disabled:opacity-50"
            >
              Resend OTP
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RegisterPage;
