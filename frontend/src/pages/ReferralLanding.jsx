import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { showReferralToast, showErrorToast } from '../components/Toast';
import { validateReferralCode } from '../api/auth';

function ReferralLanding() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [validating, setValidating] = useState(true);
  const [referralInfo, setReferralInfo] = useState(null);

  useEffect(() => {
    if (code) {
      validateReferral(code);
    } else {
      setValidating(false);
    }
  }, [code]);

  const validateReferral = async (referralCode) => {
    try {
      const result = await validateReferralCode(referralCode);
      
      if (result.success && result.valid) {
        setReferralInfo(result.referral);
        // Show toast notification
        showReferralToast(
          `🎉 Referral link detected! Sign up to get rewarded by ${result.referral.referrerName}. You will be awarded when you make a purchase!`,
          'success'
        );
      } else if (result.used) {
        showErrorToast('This referral link has already been used');
        setReferralInfo({ used: true });
      } else {
        showErrorToast(result.message || 'Invalid referral code');
      }
    } catch (error) {
      console.error('Error validating referral:', error);
      showErrorToast('Error validating referral link');
    } finally {
      setValidating(false);
    }
  };

  const handleSignup = () => {
    navigate(`/signup?ref=${code}`);
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating referral link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {referralInfo && !referralInfo.used ? (
          <>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Referral Link Detected!
              </h1>
              <p className="text-gray-600">
                You've been referred by <span className="font-semibold">{referralInfo.referrerName}</span>
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="font-semibold text-green-800 mb-1">
                    You Will Be Rewarded!
                  </p>
                  <p className="text-sm text-green-700">
                    Sign up now and you'll be awarded when you make your first purchase. 
                    Your referrer will also earn a commission!
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleSignup}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Sign Up to Get Rewarded
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Already have an account? Sign In
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Invalid Referral Link
              </h1>
              <p className="text-gray-600">
                {referralInfo?.used 
                  ? 'This referral link has already been used.'
                  : 'This referral link is not valid or has expired.'}
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate('/signup')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Sign Up Anyway
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Sign In
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ReferralLanding;

