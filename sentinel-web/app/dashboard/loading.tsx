export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen">
      <div className="w-64 bg-white border-r border-slate-100 shrink-0" />

      <main className="flex-1 ml-64 p-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div className="space-y-2">
            <div className="h-8 w-52 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-72 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="h-10 w-44 bg-slate-100 rounded-full animate-pulse" />
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl refined-border refined-shadow space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
                <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
              </div>
              <div className="h-8 w-20 bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8">
            <div className="bg-white rounded-[2rem] refined-border refined-shadow p-8 space-y-4">
              <div className="h-6 w-48 bg-slate-100 rounded animate-pulse" />
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-50 rounded animate-pulse" />
              ))}
            </div>
          </div>
          <div className="col-span-4 space-y-8">
            <div className="bg-white rounded-[2rem] refined-border refined-shadow p-8 space-y-4">
              <div className="h-6 w-36 bg-slate-100 rounded animate-pulse" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-slate-200 mt-1 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                    <div className="h-3 w-3/4 bg-slate-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-900 rounded-[2rem] p-8 space-y-4">
              <div className="h-6 w-40 bg-slate-700 rounded animate-pulse" />
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-1.5 w-full bg-slate-700 rounded-full animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
