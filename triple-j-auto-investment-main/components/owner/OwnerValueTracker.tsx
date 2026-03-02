/**
 * OwnerValueTracker - Vehicle value chart and cost-per-day metrics.
 * Renders a Recharts mini line chart (gold line on dark background) showing
 * estimated market value from purchase date to today.
 *
 * Phase 19-02: Owner Portal UI
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { estimateMarketValue } from '../../services/marketEstimateService';
import { useLanguage } from '../../context/LanguageContext';
import type { Registration } from '../../types';

interface OwnerValueTrackerProps {
  registration: Registration;
}

interface ValueDataPoint {
  month: string;
  value: number;
}

// ----------------------------------------------------------------
// buildValueHistory
// Generates monthly data points from purchaseDate to current month.
// ----------------------------------------------------------------
function buildValueHistory(
  purchasePrice: number,
  purchaseDateStr: string,
  vehicleYear: number,
  mileageAtPurchase: number | undefined
): ValueDataPoint[] {
  const purchaseDate = new Date(purchaseDateStr);
  const now = new Date();

  const baseMileage = mileageAtPurchase ?? 80000;
  const points: ValueDataPoint[] = [];

  // Iterate month by month from purchaseDate to now
  const cursor = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  while (cursor <= endMonth) {
    const monthsElapsed = Math.max(
      0,
      (cursor.getFullYear() - purchaseDate.getFullYear()) * 12 +
        (cursor.getMonth() - purchaseDate.getMonth())
    );
    const estimatedMileage = baseMileage + monthsElapsed * 1000;

    const value = estimateMarketValue(purchasePrice, vehicleYear, estimatedMileage);

    // Format: "Mar '26"
    const monthLabel = cursor.toLocaleDateString('en-US', { month: 'short' });
    const yearLabel = String(cursor.getFullYear()).slice(2);
    const label = `${monthLabel} '${yearLabel}`;

    points.push({ month: label, value });

    // Advance cursor by 1 month
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return points;
}

// ----------------------------------------------------------------
// computeValueMetrics
// ----------------------------------------------------------------
function computeValueMetrics(
  purchasePrice: number,
  purchaseDateStr: string,
  vehicleYear: number,
  mileageAtPurchase: number | undefined
): { currentValue: number; costPerDay: number; daysOwned: number } {
  const now = new Date();
  const purchaseDate = new Date(purchaseDateStr);
  const daysOwned = Math.floor((now.getTime() - purchaseDate.getTime()) / 86400000);

  const monthsElapsed = Math.max(0, daysOwned / 30.44);
  const baseMileage = mileageAtPurchase ?? 80000;
  const currentMileageEstimate = Math.round(baseMileage + monthsElapsed * 1000);

  const currentValue = estimateMarketValue(purchasePrice, vehicleYear, currentMileageEstimate);

  // Guard against division by zero
  const costPerDay = purchasePrice / Math.max(1, daysOwned);

  return { currentValue, costPerDay, daysOwned };
}

// ----------------------------------------------------------------
// Formatters
// ----------------------------------------------------------------
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCostPerDay(value: number): string {
  return `$${value.toFixed(2)}/day`;
}

// ----------------------------------------------------------------
// Custom Tooltip
// ----------------------------------------------------------------
interface TooltipPayload {
  value?: number;
}

const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}> = ({ active, payload, label }) => {
  if (active && payload && payload.length > 0) {
    return (
      <div
        style={{
          background: '#0e1b16',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 4,
          padding: '6px 10px',
        }}
      >
        <p style={{ color: '#9CA3AF', fontSize: 10, margin: 0 }}>{label}</p>
        <p style={{ color: '#d4af37', fontSize: 12, margin: '2px 0 0', fontWeight: 600 }}>
          {payload[0]?.value != null ? formatCurrency(payload[0].value) : '-'}
        </p>
      </div>
    );
  }
  return null;
};

// ----------------------------------------------------------------
// OwnerValueTracker Component
// ----------------------------------------------------------------
const OwnerValueTracker: React.FC<OwnerValueTrackerProps> = ({ registration }) => {
  const { t } = useLanguage();
  const tp = t.ownerPortal;

  // Registration does not expose purchasePrice directly.
  // The 'mileage' field on Registration is the vehicle mileage at intake.
  // purchaseDate is always present on a sticker_delivered registration.
  // We rely on the vehicleId to look up price, but the Registration snapshot
  // does not include price. We default to a safe estimate placeholder approach
  // and expect the admin to have set a realistic value in the vehicle record.
  // Since we can't access price from Registration alone, we compute a
  // heuristic: use a $5,000 BHPH midpoint as fallback.
  //
  // In a future iteration, ownerPortalService.getOwnerData can JOIN vehicles
  // to surface the sale_price. For now, we use saleDate/submissionDate context.
  //
  // NOTE: Registration interface has no `purchasePrice` or `salePrice`.
  // We use a reasonable fallback of $5,000 (BHPH midpoint).
  // Plan 03 may extend ownerPortalService to return sale price.

  const PURCHASE_PRICE_FALLBACK = 5000;
  const purchasePrice = PURCHASE_PRICE_FALLBACK;

  const purchaseDateStr = registration.purchaseDate;
  const vehicleYear = registration.vehicleYear;
  const mileageAtPurchase = registration.mileage;

  const { currentValue, costPerDay, daysOwned } = computeValueMetrics(
    purchasePrice,
    purchaseDateStr,
    vehicleYear,
    mileageAtPurchase
  );

  // Only show chart if there are 2+ months of data
  const showChart = daysOwned >= 45;
  const valueHistory = showChart
    ? buildValueHistory(purchasePrice, purchaseDateStr, vehicleYear, mileageAtPurchase)
    : [];

  return (
    <div className="p-6 md:p-8 bg-black/40 border border-tj-gold/10 rounded-lg">
      <p className="text-[10px] uppercase tracking-[0.3em] text-tj-gold mb-4">{tp.valueTracker}</p>

      {/* Stats row */}
      <div className="flex flex-wrap gap-6 mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">{tp.currentValue}</p>
          <p className="font-serif text-2xl text-white">{formatCurrency(currentValue)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">{tp.costPerDay}</p>
          <p className="font-serif text-2xl text-tj-gold">{formatCostPerDay(costPerDay)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">{tp.purchasePrice}</p>
          <p className="font-serif text-xl text-gray-400">{formatCurrency(purchasePrice)}</p>
        </div>
      </div>

      {/* Mini line chart -- only if enough data */}
      {showChart && valueHistory.length > 1 ? (
        <div>
          {/* CRITICAL: fixed pixel height on ResponsiveContainer, NOT percentage */}
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={valueHistory} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#d4af37"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: '#d4af37', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-gray-400 mt-2 text-center uppercase tracking-[0.2em]">
            {tp.valueOverTime}
          </p>
        </div>
      ) : (
        <p className="text-[11px] text-gray-500 italic">
          Value chart will appear after 2 months of ownership.
        </p>
      )}
    </div>
  );
};

export default OwnerValueTracker;
