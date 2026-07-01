export default function RootLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Simulation of Operational Control Node Bar */}
      <div className="h-20 w-full rounded-xl bg-muted" />
      
      {/* Simulation of Data Grid Matrix */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-28 rounded-xl bg-muted" />
        <div className="h-28 rounded-xl bg-muted" />
        <div className="h-28 rounded-xl bg-muted" />
        <div className="h-28 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
