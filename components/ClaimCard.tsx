
import React from 'react';
import { Claim } from '../types';

interface ClaimCardProps {
  claim: Claim;
}

const ClaimCard: React.FC<ClaimCardProps> = ({ claim }) => {
  const statusColor = claim.plausibility === 'high' ? 'bg-green-100 text-green-700 border-green-200' :
                      claim.plausibility === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-red-100 text-red-700 border-red-200';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${statusColor}`}>
          {claim.plausibility} Plausibility
        </span>
        <span className="text-xs font-mono opacity-40">#{claim.id}</span>
      </div>
      <p className="text-sm font-medium leading-relaxed mb-3 h-auto min-h-[40px]">
        "{claim.text}"
      </p>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
              style={{ width: `${claim.confidence_score}%` }}
            />
          </div>
          <span className="text-[10px] font-bold w-8">{claim.confidence_score}%</span>
        </div>
        <p className="text-xs italic opacity-70 border-l-2 border-slate-200 dark:border-slate-700 pl-2">
          <i className="fa-solid fa-circle-info mr-1"></i> {claim.reasoning}
        </p>
        {claim.red_flags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {claim.red_flags.map((flag, idx) => (
              <span key={idx} className="text-[9px] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/40">
                <i className="fa-solid fa-bolt-lightning mr-1"></i>
                {flag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimCard;
