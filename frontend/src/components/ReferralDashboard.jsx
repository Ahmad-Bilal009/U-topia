import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReferralLinkCard from './ReferralLinkCard';
import QRCodeCard from './QRCodeCard';
import RankBadge from './RankBadge';
import Tooltip from './Tooltip';
import StatsCard from './StatsCard';
import ProgressBar from './ProgressBar';
import PurchaseSimulator from './PurchaseSimulator';
import { useReferralStats } from '../hooks/useReferrals';
import { useGenerateReferralLink } from '../hooks/useReferralLink';
import { useMyCommissionStats } from '../hooks/useCommission';
import { useAuth } from '../context/AuthContext';

function ReferralDashboard() {
  const { data: statsData, isLoading: statsLoading, error: statsError } = useReferralStats();
  const { data: commissionStats, isLoading: commissionLoading } = useMyCommissionStats();
  const generateLink = useGenerateReferralLink();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Generate referral link if user doesn't have one
  useEffect(() => {
    if (
      !statsLoading && 
      statsData?.data && 
      !statsData.data.referralCode && 
      !generateLink.isPending && 
      !generateLink.isSuccess &&
      !generateLink.isError
    ) {
      const baseUrl = window.location.origin;
      console.log('Generating referral link...');
      generateLink.mutate(baseUrl, {
        onSuccess: (data) => {
          console.log('Referral link generated:', data);
          // Invalidate queries to refresh stats
        },
        onError: (error) => {
          console.error('Error generating referral link:', error);
        },
      });
    }
  }, [statsLoading, statsData?.data?.referralCode, generateLink.isPending, generateLink.isSuccess, generateLink.isError]);

  // Calculate derived data
  const stats = statsData?.data || {};
  const commissionData = commissionStats?.data || {};
  
  // Get referral code from stats or from generated link response
  let referralCode = stats.referralCode;
  if (!referralCode && generateLink.isSuccess && generateLink.data?.referralLink) {
    // Extract code from the generated link
    const linkMatch = generateLink.data.referralLink.match(/\/referral\/([^\/]+)/);
    if (linkMatch) {
      referralCode = linkMatch[1];
    }
  }
  
  const referralLink = referralCode 
    ? `${window.location.origin}/referral/${referralCode}`
    : generateLink.isPending 
      ? 'Generating...'
      : null;
  
  // Determine rank based on total referrals
  const totalReferrals = stats.totalReferrals || 0;
  const getRank = (count) => {
    if (count >= 20) return 'director';
    if (count >= 10) return 'manager';
    return 'consultant';
  };
  
  const currentRank = getRank(totalReferrals);
  const nextRank = totalReferrals >= 20 ? 'director' : totalReferrals >= 10 ? 'director' : 'manager';
  const referralTarget = totalReferrals >= 20 ? 25 : totalReferrals >= 10 ? 20 : 10;
  
  const totalEarnings = commissionData.totalEarned || 0;
  const activeReferrals = stats.pendingReferrals || 0;
  const completedReferrals = stats.completedReferrals || 0;
  
  const status = referralCode ? 'Referral link generated' : 'Generating referral link...';

  const referralSystemTooltip = (
    <div>
      <p className="font-semibold mb-2">How the Referral System Works:</p>
      <ul className="list-disc list-inside space-y-1 text-xs">
        <li>Share your unique referral link with friends</li>
        <li>Earn commissions when they sign up and make purchases</li>
        <li>Advance through ranks: Consultant → Manager → Director</li>
        <li>Higher ranks unlock more commission layers (up to 3)</li>
        <li>Track your progress with real-time statistics</li>
      </ul>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Referral Dashboard
                </h1>
                <button
                  onClick={logout}
                  className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-lg hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                Welcome, {user?.name || user?.email}! Share your referral link and earn rewards
              </p>
            </div>
            <div className="flex items-center gap-3">
              <RankBadge rank={currentRank} />
              <Tooltip content={referralSystemTooltip} position="bottom">
                <button
                  className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700 transition-colors"
                  aria-label="Learn about referral system"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Rank Progress */}
          {(statsLoading || commissionLoading) ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Progress to {nextRank.charAt(0).toUpperCase() + nextRank.slice(1)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Math.max(0, referralTarget - totalReferrals)} more referrals needed
                  </p>
                </div>
              </div>
              <ProgressBar
                current={totalReferrals}
                target={referralTarget}
                label="Referrals"
              />
            </div>
          )}
        </div>

        {/* Stats Grid */}
        {(statsLoading || commissionLoading) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <StatsCard
              title="Total Referrals"
              value={totalReferrals}
              subtitle={`${activeReferrals} active`}
              progress={totalReferrals}
              progressTarget={referralTarget}
              color="blue"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
            <StatsCard
              title="Total Earnings"
              value={`$${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              subtitle="From commissions"
              color="green"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatsCard
              title="Completed"
              value={completedReferrals}
              subtitle="Verified signups"
              color="purple"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        )}

        {/* Main Content Grid */}
        {statsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Referral Link Card */}
            <div className="lg:col-span-1">
              <ReferralLinkCard
                referralLink={referralLink || 'Generating...'}
                status={status}
              />
            </div>

            {/* QR Code Card */}
            <div className="lg:col-span-1">
              <QRCodeCard referralLink={referralCode ? `/referral/${referralCode}` : '/referral/generating'} />
            </div>
          </div>
        )}

        {/* Purchase Simulator */}
        {completedReferrals > 0 && (
          <div className="mb-6">
            <PurchaseSimulator />
          </div>
        )}

        {/* Rewards Section */}
        {completedReferrals > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm p-4 sm:p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  You've Been Awarded!
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  You have <span className="font-bold text-green-700">{completedReferrals}</span> verified referral{completedReferrals !== 1 ? 's' : ''}. 
                  {totalEarnings > 0 && (
                    <span> You've earned <span className="font-bold text-green-700">${totalEarnings.toFixed(2)}</span> in commissions!</span>
                  )}
                </p>
                {totalEarnings === 0 && completedReferrals > 0 && (
                  <p className="text-xs text-gray-600">
                    💡 Commissions are awarded when your referrals make purchases. Share your link to earn more!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className={`w-3 h-3 rounded-full animate-pulse ${referralCode ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {status}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {referralCode 
                  ? 'Your referral link is active and ready to share'
                  : 'Please wait while we generate your referral link'}
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {(statsError || generateLink.isError) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6 mt-6">
            <p className="text-sm text-red-800 mb-2">
              {statsError 
                ? `Error loading referral data: ${statsError.message}`
                : `Error generating referral link: ${generateLink.error?.response?.data?.error || generateLink.error?.message || 'Unknown error'}`}
            </p>
            {generateLink.isError && (
              <button
                onClick={() => {
                  const baseUrl = window.location.origin;
                  generateLink.mutate(baseUrl);
                }}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {/* Manual Generate Button (if no code and not loading) */}
        {!statsLoading && !statsData?.data?.referralCode && !generateLink.isPending && !generateLink.isSuccess && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 mt-6">
            <p className="text-sm text-blue-800 mb-3">
              No referral link found. Click the button below to generate one.
            </p>
            <button
              onClick={() => {
                const baseUrl = window.location.origin;
                generateLink.mutate(baseUrl);
              }}
              disabled={generateLink.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generateLink.isPending ? 'Generating...' : 'Generate Referral Link'}
            </button>
          </div>
        )}

        {/* Debug info (development only) */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded text-xs font-mono">
            <p><strong>Stats Loading:</strong> {statsLoading ? 'Yes' : 'No'}</p>
            <p><strong>Referral Code:</strong> {referralCode || 'None'}</p>
            <p><strong>Stats Data:</strong> {JSON.stringify(statsData?.data || {}, null, 2)}</p>
            <p><strong>Generate Link Pending:</strong> {generateLink.isPending ? 'Yes' : 'No'}</p>
            <p><strong>Generate Link Success:</strong> {generateLink.isSuccess ? 'Yes' : 'No'}</p>
            <p><strong>Generate Link Error:</strong> {generateLink.isError ? JSON.stringify(generateLink.error?.response?.data || generateLink.error?.message, null, 2) : 'None'}</p>
            <p><strong>Generate Link Data:</strong> {JSON.stringify(generateLink.data || {}, null, 2)}</p>
          </div>
        )} */}
      </div>
    </div>
  );
}

export default ReferralDashboard;
