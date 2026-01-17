import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { showSuccessToast, showErrorToast, showReferralToast } from '../components/Toast';
import { validateReferralCode } from '../api/auth';

function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [referralCode, setReferralCode] = useState('');
  const [referralInfo, setReferralInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validatingReferral, setValidatingReferral] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check for referral code in URL
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      validateReferral(ref);
    }
  }, [searchParams]);

  const validateReferral = async (code) => {
    if (!code) return;
    
    setValidatingReferral(true);
    try {
      const result = await validateReferralCode(code);
      if (result.success && result.valid) {
        setReferralInfo(result.referral);
        showReferralToast(
          `🎉 Referral link detected! Sign up to get rewarded by ${result.referral.referrerName}`,
          'success'
        );
      } else if (result.used) {
        showErrorToast('This referral link has already been used');
      } else {
        showErrorToast(result.message || 'Invalid referral code');
      }
    } catch (error) {
      console.error('Error validating referral:', error);
    } finally {
      setValidatingReferral(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleReferralCodeChange = (e) => {
    const code = e.target.value.trim();
    setReferralCode(code);
    if (code) {
      validateReferral(code);
    } else {
      setReferralInfo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      showErrorToast('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      showErrorToast('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await signup(
      formData.email,
      formData.password,
      formData.name,
      referralCode || undefined
    );

    setLoading(false);

    if (result.success) {
      if (result.referral) {
        showReferralToast(
          '🎉 Referral link used successfully! You will be awarded when you make a purchase.',
          'success'
        );
      } else {
        showSuccessToast('Account created successfully!');
      }
      navigate('/dashboard');
    } else {
      showErrorToast(result.error || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </a>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Referral Code Section */}
          {referralInfo && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Referral Link Detected!
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    You'll be rewarded when you make a purchase
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Confirm your password"
              />
            </div>

            <div>
              <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700">
                Referral Code (Optional)
              </label>
              <input
                id="referralCode"
                name="referralCode"
                type="text"
                value={referralCode}
                onChange={handleReferralCodeChange}
                disabled={validatingReferral}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:opacity-50"
                placeholder="Enter referral code"
              />
              {validatingReferral && (
                <p className="mt-1 text-xs text-gray-500">Validating...</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;

