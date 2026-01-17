import { useEffect, useState } from 'react';

function ProgressBar({ current, target, label, showPercentage = true }) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const percentage = Math.min((current / target) * 100, 100);
    const duration = 1000; // 1 second animation
    const steps = 60;
    const increment = percentage / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setAnimatedValue(Math.min(increment * step, percentage));
      
      if (step >= steps) {
        clearInterval(timer);
        setAnimatedValue(percentage);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [current, target]);

  const percentage = Math.min((current / target) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {showPercentage && (
          <span className="text-sm font-semibold text-gray-900">
            {current} / {target} ({Math.round(percentage)}%)
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
          style={{ width: `${animatedValue}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;

