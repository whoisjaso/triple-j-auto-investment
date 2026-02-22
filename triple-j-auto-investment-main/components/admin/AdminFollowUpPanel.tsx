import React, { useEffect, useState } from 'react';
import { Send, MessageSquare, Mail, Phone, Car } from 'lucide-react';
import { supabase } from '../../supabase/config';
import { useStore } from '../../context/Store';

// --- Types ---

interface QueueStats {
  queued: number;
  sent: number;
  cancelled: number;
  errored: number;
}

interface QueueItem {
  id: string;
  lead_id: string;
  trigger_type: string;
  channel: string;
  vehicle_id: string | null;
  send_after: string;
  sent: boolean;
  cancelled: boolean;
  cancelled_reason: string | null;
  error: string | null;
  created_at: string;
  sent_at: string | null;
  leads: {
    name: string | null;
    phone: string | null;
  } | null;
}

// --- Component ---

export const AdminFollowUpPanel: React.FC = () => {
  const { vehicles } = useStore();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<QueueStats>({ queued: 0, sent: 0, cancelled: 0, errored: 0 });
  const [items, setItems] = useState<QueueItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [queuedRes, sentRes, cancelledRes, erroredRes, itemsRes] = await Promise.all([
          supabase
            .from('follow_up_queue')
            .select('id', { count: 'exact', head: true })
            .eq('sent', false)
            .eq('cancelled', false),
          supabase
            .from('follow_up_queue')
            .select('id', { count: 'exact', head: true })
            .eq('sent', true)
            .is('error', null),
          supabase
            .from('follow_up_queue')
            .select('id', { count: 'exact', head: true })
            .eq('cancelled', true),
          supabase
            .from('follow_up_queue')
            .select('id', { count: 'exact', head: true })
            .not('error', 'is', null),
          supabase
            .from('follow_up_queue')
            .select('*, leads(name, phone)')
            .order('created_at', { ascending: false })
            .limit(20),
        ]);

        setStats({
          queued: queuedRes.count ?? 0,
          sent: sentRes.count ?? 0,
          cancelled: cancelledRes.count ?? 0,
          errored: erroredRes.count ?? 0,
        });

        if (itemsRes.data) {
          setItems(itemsRes.data as QueueItem[]);
        }
      } catch (err) {
        console.error('AdminFollowUpPanel: failed to fetch data', err);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // --- Helpers ---

  const vehicleName = (vehicleId: string | null): string => {
    if (!vehicleId) return 'N/A';
    const v = vehicles.find(veh => veh.id === vehicleId);
    return v ? `${v.year} ${v.make} ${v.model}` : 'Unknown';
  };

  const triggerColor = (type: string): string => {
    switch (type) {
      case 'browse': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'save': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'abandon': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'voice': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const channelIcon = (channel: string) => {
    if (channel === 'sms') return <Phone size={10} />;
    if (channel === 'email') return <Mail size={10} />;
    if (channel === 'voice') return <Phone size={10} />;
    return <MessageSquare size={10} />;
  };

  const itemStatus = (item: QueueItem): { text: string; color: string } => {
    if (item.error) {
      return { text: `Error: ${item.error.slice(0, 40)}`, color: 'text-red-400' };
    }
    if (item.cancelled) {
      return { text: `Cancelled: ${item.cancelled_reason || 'conversion'}`, color: 'text-gray-500' };
    }
    if (item.sent) {
      const sentAt = item.sent_at
        ? new Date(item.sent_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'unknown time';
      return { text: `Sent at ${sentAt}`, color: 'text-green-400' };
    }
    // Queued -- compute hours until send
    const sendAfter = new Date(item.send_after);
    const now = new Date();
    const hoursUntil = Math.max(0, Math.round((sendAfter.getTime() - now.getTime()) / (1000 * 60 * 60)));
    return {
      text: hoursUntil > 0 ? `Queued (sends in ${hoursUntil}h)` : 'Queued (ready to send)',
      color: 'text-tj-gold',
    };
  };

  // --- Skeleton ---
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-[#080808] border border-white/[0.04] p-6 animate-pulse">
            <div className="h-4 bg-white/[0.06] rounded w-1/3 mb-4" />
            <div className="space-y-2">
              <div className="h-3 bg-white/[0.04] rounded w-full" />
              <div className="h-3 bg-white/[0.04] rounded w-4/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Queued', value: stats.queued, color: 'text-tj-gold' },
          { label: 'Sent', value: stats.sent, color: 'text-green-400' },
          { label: 'Cancelled', value: stats.cancelled, color: 'text-gray-500' },
          { label: 'Errored', value: stats.errored, color: 'text-red-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#080808] border border-white/[0.04] p-4">
            <p className="text-[8px] uppercase tracking-[0.15em] text-gray-600 font-medium mb-1">{stat.label}</p>
            <p className={`text-2xl font-mono font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Items */}
      <div className="bg-[#080808] border border-white/[0.04] p-5">
        <h4 className="text-[9px] uppercase tracking-[0.2em] text-white flex items-center gap-2 font-bold mb-4">
          <Send size={12} className="text-tj-gold" /> Recent Follow-Up Items
          <span className="text-gray-700 font-normal ml-auto">{items.length} items</span>
        </h4>

        {items.length === 0 ? (
          <p className="text-gray-600 text-xs text-center py-6">No follow-up items yet</p>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {items.map(item => {
              const status = itemStatus(item);
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[auto_auto_1fr_auto] gap-3 items-center px-3 py-2.5 hover:bg-white/[0.02] border border-transparent hover:border-white/[0.04] transition-colors"
                >
                  {/* Trigger type badge */}
                  <span className={`px-2 py-0.5 text-[8px] uppercase tracking-[0.15em] font-bold border rounded-sm ${triggerColor(item.trigger_type)}`}>
                    {item.trigger_type}
                  </span>

                  {/* Channel badge */}
                  <span className="flex items-center gap-1 text-[9px] text-gray-500 font-mono">
                    {channelIcon(item.channel)}
                    {item.channel}
                  </span>

                  {/* Vehicle + lead info */}
                  <div className="min-w-0">
                    <p className="text-[10px] text-white font-mono truncate">
                      <Car size={9} className="inline mr-1 text-gray-600" />
                      {vehicleName(item.vehicle_id)}
                    </p>
                    <p className="text-[9px] text-gray-600 truncate">
                      {item.leads?.name || 'Unknown'} &middot; {item.leads?.phone || 'no phone'}
                    </p>
                  </div>

                  {/* Status */}
                  <span className={`text-[9px] font-mono shrink-0 text-right max-w-[160px] truncate ${status.color}`}>
                    {status.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
