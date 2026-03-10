import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-serif text-neutral-100 mb-2">Dashboard</h1>
      <p className="text-sm text-neutral-500 mb-8">
        Welcome to the Triple J admin panel.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/admin/inventory"
          className="border border-neutral-800 rounded-lg bg-neutral-900/50 p-6 hover:bg-neutral-900 hover:border-neutral-700 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-tj-gold/70" aria-hidden="true">
              <rect x="1" y="3" width="15" height="13" rx="2" />
              <path d="M16 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
              <path d="M8 18.5h8" />
            </svg>
            <h2 className="text-lg font-medium text-neutral-200">Inventory</h2>
          </div>
          <p className="text-sm text-neutral-500">
            Add, edit, and manage your vehicle listings.
          </p>
          <span className="mt-4 inline-block text-xs text-tj-gold/60 uppercase tracking-wider group-hover:text-tj-gold transition-colors">
            Manage Inventory &rarr;
          </span>
        </Link>

        <Link
          href="/admin/leads"
          className="border border-neutral-800 rounded-lg bg-neutral-900/50 p-6 hover:bg-neutral-900 hover:border-neutral-700 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-tj-gold/70" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h2 className="text-lg font-medium text-neutral-200">Leads</h2>
          </div>
          <p className="text-sm text-neutral-500">
            View and manage customer inquiries.
          </p>
          <span className="mt-4 inline-block text-xs text-neutral-600 uppercase tracking-wider">
            Coming Soon
          </span>
        </Link>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-neutral-800 rounded-lg bg-neutral-900/50 p-6 hover:bg-neutral-900 hover:border-neutral-700 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-tj-gold/70" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <h2 className="text-lg font-medium text-neutral-200">View Site</h2>
          </div>
          <p className="text-sm text-neutral-500">
            Open the public website in a new tab.
          </p>
          <span className="mt-4 inline-block text-xs text-tj-gold/60 uppercase tracking-wider group-hover:text-tj-gold transition-colors">
            Open &rarr;
          </span>
        </a>
      </div>
    </div>
  );
}
