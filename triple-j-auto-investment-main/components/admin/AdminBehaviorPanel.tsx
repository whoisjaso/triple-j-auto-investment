import React, { useEffect, useState } from 'react';
import { Activity, Radio, Target, Eye, Monitor, Smartphone, Tablet } from 'lucide-react';
import { supabase } from '../../supabase/config';
import { useStore } from '../../context/Store';

// --- Types ---

interface ViewCount {
  vehicle_id: string;
  views_7d: number;
  unique_sessions_7d: number;
}

interface SessionEvent {
  session_id: string;
  created_at: string;
  event_type: string;
  vehicle_id: string | null;
  page_path: string | null;
}

interface AttributedLead {
  utm_source: string | null;
  utm_medium: string | null;
  device_type: string | null;
  page_path: string | null;
  created_at: string;
}

interface GroupedSession {
  sessionId: string;
  eventCount: number;
  lastActivity: string;
  pages: string[];
}

// --- Component ---

export const AdminBehaviorPanel: React.FC = () => {
  const { vehicles } = useStore();

  const [loading, setLoading] = useState(true);
  const [viewCounts, setViewCounts] = useState<ViewCount[]>([]);
  const [sessions, setSessions] = useState<GroupedSession[]>([]);
  const [leads, setLeads] = useState<AttributedLead[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const [viewsRes, eventsRes, leadsRes] = await Promise.all([
          supabase
            .from('vehicle_view_counts')
            .select('vehicle_id, views_7d, unique_sessions_7d')
            .gt('views_7d', 0)
            .order('views_7d', { ascending: false })
            .limit(10),
          supabase
            .from('session_events')
            .select('session_id, created_at, event_type, vehicle_id, page_path')
            .order('created_at', { ascending: false })
            .limit(100),
          supabase
            .from('leads')
            .select('utm_source, utm_medium, device_type, page_path, created_at')
            .not('session_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(200),
        ]);

        // Top viewed vehicles
        if (viewsRes.data) {
          setViewCounts(viewsRes.data as ViewCount[]);
        }

        // Group session events by session_id
        if (eventsRes.data) {
          const grouped = new Map<string, { events: SessionEvent[] }>();
          for (const evt of eventsRes.data as SessionEvent[]) {
            const existing = grouped.get(evt.session_id);
            if (existing) {
              existing.events.push(evt);
            } else {
              grouped.set(evt.session_id, { events: [evt] });
            }
          }

          const sessionList: GroupedSession[] = [];
          for (const [sessionId, { events }] of grouped) {
            const pages = [...new Set(events.map(e => e.page_path).filter(Boolean) as string[])];
            sessionList.push({
              sessionId,
              eventCount: events.length,
              lastActivity: events[0].created_at,
              pages,
            });
          }

          // Sort by most recent, take first 20
          sessionList.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
          setSessions(sessionList.slice(0, 20));
        }

        // Attributed leads
        if (leadsRes.data) {
          setLeads(leadsRes.data as AttributedLead[]);
        }
      } catch (err) {
        console.error('AdminBehaviorPanel: failed to fetch data', err);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // --- Vehicle name resolver ---
  const vehicleName = (id: string): string => {
    const v = vehicles.find(veh => veh.id === id);
    return v ? `${v.year} ${v.make} ${v.model}` : id.slice(0, 8);
  };

  // --- Attribution aggregators ---
  const byDevice = (): { label: string; count: number }[] => {
    const map = new Map<string, number>();
    for (const l of leads) {
      const key = l.device_type || 'unknown';
      map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  };

  const bySource = (): { label: string; count: number }[] => {
    const map = new Map<string, number>();
    for (const l of leads) {
      const key = l.utm_source || 'Direct';
      map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const byPage = (): { label: string; count: number }[] => {
    const map = new Map<string, number>();
    for (const l of leads) {
      const key = l.page_path || '/';
      map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  // --- Skeleton loader ---
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[#080808] border border-white/[0.04] p-6 animate-pulse">
            <div className="h-4 bg-white/[0.06] rounded w-1/3 mb-4" />
            <div className="space-y-2">
              <div className="h-3 bg-white/[0.04] rounded w-full" />
              <div className="h-3 bg-white/[0.04] rounded w-4/5" />
              <div className="h-3 bg-white/[0.04] rounded w-3/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const deviceIcon = (type: string) => {
    if (type === 'mobile') return <Smartphone size={11} className="text-gray-600" />;
    if (type === 'tablet') return <Tablet size={11} className="text-gray-600" />;
    return <Monitor size={11} className="text-gray-600" />;
  };

  const maxDeviceCount = Math.max(...byDevice().map(d => d.count), 1);

  return (
    <div className="space-y-4">
      {/* Section 1: Top Viewed Vehicles */}
      <div className="bg-[#080808] border border-white/[0.04] p-5">
        <h4 className="text-[9px] uppercase tracking-[0.2em] text-white flex items-center gap-2 font-bold mb-4">
          <Eye size={12} className="text-tj-gold" /> Top Viewed Vehicles
          <span className="text-gray-700 font-normal ml-auto">Last 7 days</span>
        </h4>

        {viewCounts.length === 0 ? (
          <p className="text-gray-600 text-xs text-center py-6">No tracking data yet</p>
        ) : (
          <table className="w-full text-left">
            <thead className="text-[8px] uppercase tracking-[0.15em] text-gray-600">
              <tr>
                <th className="pb-2 font-medium">Vehicle</th>
                <th className="pb-2 font-medium text-right">Views (7d)</th>
                <th className="pb-2 font-medium text-right">Unique</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03] text-xs">
              {viewCounts.map(vc => (
                <tr key={vc.vehicle_id} className="hover:bg-white/[0.02]">
                  <td className="py-2 text-white font-mono text-[11px]">{vehicleName(vc.vehicle_id)}</td>
                  <td className="py-2 text-right text-gray-400 font-mono">{vc.views_7d}</td>
                  <td className="py-2 text-right text-gray-400 font-mono">{vc.unique_sessions_7d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Section 2: Recent Sessions */}
      <div className="bg-[#080808] border border-white/[0.04] p-5">
        <h4 className="text-[9px] uppercase tracking-[0.2em] text-white flex items-center gap-2 font-bold mb-4">
          <Radio size={12} className="text-tj-gold" /> Recent Sessions
          <span className="text-gray-700 font-normal ml-auto">{sessions.length} sessions</span>
        </h4>

        {sessions.length === 0 ? (
          <p className="text-gray-600 text-xs text-center py-6">No sessions recorded yet</p>
        ) : (
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {sessions.map(s => (
              <div key={s.sessionId} className="flex items-center gap-3 px-3 py-2 hover:bg-white/[0.02] border border-transparent hover:border-white/[0.04] transition-colors">
                <span className="text-[10px] font-mono text-gray-400 w-16 shrink-0">{s.sessionId.slice(0, 8)}</span>
                <span className="text-[10px] font-mono text-tj-gold/70 w-8 text-center shrink-0">{s.eventCount}</span>
                <span className="text-[10px] text-gray-600 truncate flex-1">
                  {s.pages.slice(0, 3).join(' > ')}{s.pages.length > 3 ? ' ...' : ''}
                </span>
                <span className="text-[9px] text-gray-700 font-mono shrink-0">
                  {new Date(s.lastActivity).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Attribution Breakdown */}
      <div className="bg-[#080808] border border-white/[0.04] p-5">
        <h4 className="text-[9px] uppercase tracking-[0.2em] text-white flex items-center gap-2 font-bold mb-4">
          <Target size={12} className="text-tj-gold" /> Attribution Breakdown
          <span className="text-gray-700 font-normal ml-auto">{leads.length} attributed leads</span>
        </h4>

        {leads.length === 0 ? (
          <p className="text-gray-600 text-xs text-center py-6">No attributed leads yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* By Device */}
            <div>
              <p className="text-[8px] uppercase tracking-[0.15em] text-gray-600 mb-3 font-medium">By Device</p>
              <div className="space-y-2">
                {byDevice().map(d => (
                  <div key={d.label} className="flex items-center gap-2">
                    {deviceIcon(d.label)}
                    <span className="text-[10px] text-gray-400 capitalize w-14">{d.label}</span>
                    <div className="flex-1 bg-white/[0.04] h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-tj-gold/40 rounded-full"
                        style={{ width: `${(d.count / maxDeviceCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 w-6 text-right">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* By Source */}
            <div>
              <p className="text-[8px] uppercase tracking-[0.15em] text-gray-600 mb-3 font-medium">By Source</p>
              <div className="space-y-1.5">
                {bySource().map(s => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 truncate max-w-[120px]">{s.label}</span>
                    <span className="text-[10px] font-mono text-gray-400">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* By Page */}
            <div>
              <p className="text-[8px] uppercase tracking-[0.15em] text-gray-600 mb-3 font-medium">By Page</p>
              <div className="space-y-1.5">
                {byPage().map(p => (
                  <div key={p.label} className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-mono truncate max-w-[120px]">{p.label}</span>
                    <span className="text-[10px] font-mono text-gray-400">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
