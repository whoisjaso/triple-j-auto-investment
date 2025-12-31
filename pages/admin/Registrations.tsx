import React from 'react';
import { useStore } from '../../context/Store';
import { Clock, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const Registrations = () => {
  const { vehicles, updateRegistration } = useStore();

  // Filter only vehicles that have been sold or are processing registration
  const activeRegistrations = vehicles;

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'Completed': return 'text-green-500 border-green-500 bg-green-900/20';
      case 'Submitted': return 'text-blue-500 border-blue-500 bg-blue-900/20';
      case 'Processing': return 'text-yellow-500 border-yellow-500 bg-yellow-900/20';
      default: return 'text-gray-500 border-gray-500 bg-gray-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-serif text-white mb-1 md:mb-2">Registration Workflow</h1>
            <p className="text-gray-400 text-xs md:text-sm">Operational Discipline. 60-Day Cycle Tracking.</p>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {activeRegistrations.map(v => (
            <div key={v.id} className="bg-tj-dark border border-gray-700 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-white font-medium text-sm">{v.year} {v.make} {v.model}</p>
                  <p className="text-gray-500 font-mono text-[10px] truncate max-w-[180px]">{v.vin}</p>
                </div>
                <span className={`px-2 py-1 text-[10px] font-bold uppercase border ${getStatusColor(v.registrationStatus)}`}>
                  {v.registrationStatus || 'Pending'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center text-gray-300 text-xs">
                  <Clock size={12} className="mr-1 text-tj-gold" />
                  {v.registrationDueDate || 'Not Set'}
                </div>
                <select
                  className="bg-black border border-gray-700 text-white text-xs p-2 min-w-[100px]"
                  value={v.registrationStatus || 'Pending'}
                  onChange={(e) => updateRegistration(v.id, e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-tj-dark border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-black text-gray-400 text-xs uppercase tracking-widest">
                <tr>
                  <th className="p-4 lg:p-6 font-medium">Asset</th>
                  <th className="p-4 lg:p-6 font-medium">VIN</th>
                  <th className="p-4 lg:p-6 font-medium">Due Date</th>
                  <th className="p-4 lg:p-6 font-medium">Status</th>
                  <th className="p-4 lg:p-6 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {activeRegistrations.map(v => (
                  <tr key={v.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 lg:p-6 text-white font-medium text-sm">{v.year} {v.make} {v.model}</td>
                    <td className="p-4 lg:p-6 text-gray-400 font-mono text-xs lg:text-sm">{v.vin}</td>
                    <td className="p-4 lg:p-6 text-gray-300 text-sm">
                      <div className="flex items-center">
                        <Clock size={16} className="mr-2 text-tj-gold" />
                        {v.registrationDueDate || 'Not Set'}
                      </div>
                    </td>
                    <td className="p-4 lg:p-6">
                      <span className={`px-3 py-1 text-xs font-bold uppercase border ${getStatusColor(v.registrationStatus)}`}>
                        {v.registrationStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 lg:p-6 text-right">
                      <select
                        className="bg-black border border-gray-700 text-white text-xs p-2"
                        value={v.registrationStatus || 'Pending'}
                        onChange={(e) => updateRegistration(v.id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Processing">Processing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registrations;