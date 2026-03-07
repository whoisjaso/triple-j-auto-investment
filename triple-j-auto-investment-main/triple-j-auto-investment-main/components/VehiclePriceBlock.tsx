import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { estimateMarketValue, estimateMonthlyPayment } from '../services/marketEstimateService';

interface VehiclePriceBlockProps {
  price: number;
  year: number;
  mileage: number;
  marketEstimate?: number;
}

export const VehiclePriceBlock: React.FC<VehiclePriceBlockProps> = ({
  price,
  year,
  mileage,
  marketEstimate,
}) => {
  const { t } = useLanguage();

  const showInquire = !price || price <= 0;
  const marketAvg = marketEstimate || estimateMarketValue(price, year, mileage);
  const savings = marketAvg - price;
  const monthly = estimateMonthlyPayment(price);

  const formatDollar = (amount: number): string =>
    `$${amount.toLocaleString()}`;

  const disclaimerText = t.vehicleDetail.priceDisclaimer.replace(
    '${amount}',
    monthly.toLocaleString()
  );

  return (
    <div className="p-6 md:p-8 bg-black border border-white/[0.06]">
      {/* Price comparison grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Triple J Price */}
        <div className="p-4 border border-tj-gold/20 bg-tj-gold/[0.03] rounded-md">
          <span className="block text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-1">
            {t.vehicleDetail.tripleJPrice}
          </span>
          <span className="block font-display text-2xl text-tj-gold">
            {showInquire ? 'INQUIRE' : formatDollar(price)}
          </span>
        </div>

        {/* Market Average */}
        <div className="p-4 border border-white/[0.06] rounded-md">
          <span className="block text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-1">
            {t.vehicleDetail.marketAverage}
          </span>
          <span className="block font-display text-2xl text-gray-400 line-through">
            {showInquire ? '--' : formatDollar(marketAvg)}
          </span>
        </div>
      </div>

      {/* Savings and monthly row */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/[0.06]">
        {/* You Save */}
        <div>
          <span className="block text-[9px] uppercase tracking-[0.2em] text-green-400 mb-1">
            {t.vehicleDetail.youSave}
          </span>
          <span className="block font-display text-lg text-green-400">
            {showInquire ? '--' : formatDollar(savings)}
          </span>
        </div>

        {/* Est. Monthly */}
        <div>
          <span className="block text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-1">
            {t.vehicleDetail.estMonthly}
          </span>
          <span className="block font-display text-lg text-white">
            {showInquire ? '--' : (
              <>
                {formatDollar(monthly)}
                <span className="text-sm text-gray-400">/mo</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      {!showInquire && (
        <p className="mt-4 text-[8px] text-gray-500 italic">
          {disclaimerText}
        </p>
      )}
    </div>
  );
};
