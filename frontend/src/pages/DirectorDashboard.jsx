import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, getAllCommissions, getAdminStats } from '../api/admin';
import { showErrorToast } from '../components/Toast';

function DirectorDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUserId, setSelectedUserId] = useState(null);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: getAllUsers,
    enabled: user?.role === 'director' || user?.role === 'admin',
  });

  const { data: commissionsData, isLoading: commissionsLoading } = useQuery({
    queryKey: ['admin', 'commissions'],
    queryFn: () => getAllCommissions({ limit: 100 }),
    enabled: user?.role === 'director' || user?.role === 'admin',
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: getAdminStats,
    enabled: user?.role === 'director' || user?.role === 'admin',
  });

  if (user?.role !== 'director' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need Director or Admin role to access this page.</p>
        </div>
      </div>
    );
  }

  const users = usersData?.data || [];
  const commissions = commissionsData?.data || [];
  const stats = statsData?.data || {};

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Director Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                View all commissions and earnings across all users
              </p>
            </div>
            <button
              onClick={logout}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-lg hover:bg-gray-100"
            >
              Logout
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'users'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Users
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'commissions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Commissions
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {statsLoading ? (
              <div className="animate-pulse">Loading stats...</div>
            ) : (
              <>
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <p className="text-sm text-gray-600 mb-1">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.overview?.totalUsers || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <p className="text-sm text-gray-600 mb-1">Total Referrals</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.overview?.totalReferrals || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.overview?.verifiedReferrals || 0} verified
                    </p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <p className="text-sm text-gray-600 mb-1">Total Commissions</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.overview?.totalCommissions || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                    <p className="text-3xl font-bold text-green-600">
                      ${(stats.overview?.totalEarnings || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Commissions by Layer */}
                {stats.commissionsByLayer && stats.commissionsByLayer.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Commissions by Layer
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {stats.commissionsByLayer.map((layer) => (
                        <div key={layer.layer} className="border border-gray-200 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Layer {layer.layer}</p>
                          <p className="text-2xl font-bold text-gray-900">
                            ${layer.totalAmount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {layer.count} commission{layer.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Earners */}
                {stats.topEarners && stats.topEarners.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Earners</h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              User
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Tier
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Total Earnings
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Commissions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {stats.topEarners.map((earner, index) => (
                            <tr key={earner.user?.id || index}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {earner.user?.name || earner.user?.email || 'Unknown'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {earner.user?.email}
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                  {earner.user?.tier || 'N/A'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                                ${earner.totalEarnings.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                {earner.commissionCount}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {usersLoading ? (
              <div className="p-6 text-center">Loading users...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tier
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Referrals
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Total Earnings
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Commissions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setActiveTab('commissions');
                        }}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {user.name || user.email}
                            </p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            {user.tier}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                          {user.stats?.verifiedReferrals || 0} / {user.stats?.totalReferrals || 0}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                          ${(user.stats?.totalEarnings || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                          {user.stats?.totalCommissions || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Commissions Tab */}
        {activeTab === 'commissions' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {commissionsLoading ? (
              <div className="p-6 text-center">Loading commissions...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Layer
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Purchase Amount
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Commission Rate
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Commission Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {commissions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                          No commissions found. Commissions are created when users make purchases.
                        </td>
                      </tr>
                    ) : (
                      commissions.map((commission) => (
                        <tr key={commission.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {new Date(commission.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {commission.user?.name || commission.user?.email || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {commission.user?.email}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              Layer {commission.layer}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                            ${commission.purchaseAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                            {(commission.commissionRate * 100).toFixed(0)}%
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                            ${commission.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DirectorDashboard;

