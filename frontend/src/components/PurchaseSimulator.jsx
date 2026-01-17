import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recordPurchase } from '../api/purchase';
import { showSuccessToast, showErrorToast } from './Toast';

function PurchaseSimulator() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const purchaseMutation = useMutation({
    mutationFn: ({ amount, description }) => recordPurchase(parseFloat(amount), description),
    onSuccess: (data) => {
      showSuccessToast(
        `Purchase recorded! Commissions calculated: $${data.data.commissions.totalCommissions.toFixed(2)}`
      );
      setAmount('');
      setDescription('');
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['commission'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (error) => {
      showErrorToast(
        error.response?.data?.error || 'Failed to record purchase'
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      showErrorToast('Please enter a valid amount');
      return;
    }
    purchaseMutation.mutate({ amount, description: description || 'Purchase' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Simulate Purchase</h2>
      <p className="text-sm text-gray-600 mb-4">
        Record a purchase to trigger commission calculation. This will create commission entries in the ledger.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Purchase Amount ($)
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="100.00"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Product purchase"
          />
        </div>
        <button
          type="submit"
          disabled={purchaseMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {purchaseMutation.isPending ? 'Processing...' : 'Record Purchase'}
        </button>
      </form>
    </div>
  );
}

export default PurchaseSimulator;

