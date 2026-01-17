import ProgressBar from './ProgressBar';

function StatsCard({ title, value, subtitle, progress, progressTarget, icon, color = 'blue' }) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      iconBg: 'bg-blue-100',
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      iconBg: 'bg-green-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      iconBg: 'bg-purple-100',
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`${colors.iconBg} ${colors.text} p-3 rounded-lg`}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
      {progress !== undefined && progressTarget && (
        <ProgressBar
          current={progress}
          target={progressTarget}
          label=""
          showPercentage={false}
        />
      )}
    </div>
  );
}

export default StatsCard;

