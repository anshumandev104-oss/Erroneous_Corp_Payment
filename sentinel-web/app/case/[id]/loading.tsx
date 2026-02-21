export default function CaseDetailLoading() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar placeholder */}
      <div className="w-64 bg-white border-r border-slate-100 shrink-0" />

      <main className="flex-1 ml-64 p-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-10">
          <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
          <div className="h-4 w-4 bg-slate-100 rounded animate-pulse" />
          <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left: hero + sections */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* Hero card */}
            <div className="bg-white rounded-[2rem] refined-border refined-shadow overflow-hidden">
              <div className="h-14 bg-slate-100 animate-pulse" />
              <div className="p-10 flex gap-12">
                <div className="flex-1 space-y-4">
                  <div className="h-12 w-56 bg-slate-100 rounded animate-pulse" />
                  <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="space-y-1">
                        <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
                        <div className="h-5 w-32 bg-slate-100 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-48 h-48 rounded-full bg-slate-100 animate-pulse" />
              </div>
            </div>

            {/* AI section */}
            <div className="bg-slate-50 rounded-[2rem] refined-border refined-shadow p-10 space-y-4">
              <div className="h-6 w-48 bg-slate-100 rounded animate-pulse" />
              <div className="grid grid-cols-2 gap-8">
                <div className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
                <div className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
              </div>
            </div>
          </div>

          {/* Right: SLA + actions */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[2rem] refined-border refined-shadow p-8 space-y-4">
              <div className="h-6 w-32 bg-slate-100 rounded animate-pulse" />
              <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
              <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
            </div>
            <div className="bg-white rounded-[2.5rem] refined-border refined-shadow p-10 space-y-4">
              <div className="h-6 w-40 bg-slate-100 rounded animate-pulse" />
              <div className="h-16 bg-blue-50 rounded-2xl animate-pulse" />
              <div className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
