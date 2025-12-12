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
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-serif text-white mb-2">Registration Workflow</h1>
            <p className="text-gray-400 text-sm">Operational Discipline. 60-Day Cycle Tracking.</p>
          </div>
        </div>

        <div className="bg-tj-dark border border-gray-700 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black text-gray-400 text-xs uppercase tracking-widest">
              <tr>
                <th className="p-6 font-medium">Asset</th>
                <th className="p-6 font-medium">VIN</th>
                <th className="p-6 font-medium">Due Date</th>
                <th className="p-6 font-medium">Status</th>
                <th className="p-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {activeRegistrations.map(v => (
                <tr key={v.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-6 text-white font-medium">{v.year} {v.make} {v.model}</td>
                  <td className="p-6 text-gray-400 font-mono text-sm">{v.vin}</td>
                  <td className="p-6 text-gray-300">
                    <div className="flex items-center">
                      <Clock size={16} className="mr-2 text-tj-gold" />
                      {v.registrationDueDate || 'Not Set'}
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 text-xs font-bold uppercase border ${getStatusColor(v.registrationStatus)}`}>
                      {v.registrationStatus || 'Pending'}
                    </span>
                  </td>
                  <td className="p-6 text-right">
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
  );
};

export default Registrations;