export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Background Gradient Spotlights */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-[#018488]/20 rounded-full blur-[120px] -z-10 opacity-30"></div>
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] -z-10 opacity-30"></div>

      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo Icon */}
            <img 
              src="/logo.png" 
              alt="TrueVine Insights Logo" 
              className="w-24 h-24 object-contain"
            />
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Spectrum
            </h1>
          </div>
          <span className="text-sm text-[var(--secondary-text)] font-medium">
            by TrueVine Insights
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Welcome Card */}
        <div className="glass-card bg-[var(--card-bg)] border border-white/5 rounded-[24px] shadow-2xl p-12 mb-8 relative overflow-hidden group">
          {/* Decorative Teal Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#018488] to-transparent opacity-50"></div>
          
          <h2 className="font-display text-5xl font-bold mb-6 leading-tight">
            Professional <br/>
            RAW Converter
          </h2>
          <p className="text-xl text-[var(--secondary-text)] mb-8 max-w-2xl font-light">
            High-performance ARW to JPEG conversion engine designed for zero-compromise metadata preservation.
          </p>
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-[#018488]/10 border border-[#018488]/20 rounded-full backdrop-blur-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#018488] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#018488]"></span>
            </span>
            <span className="text-sm font-semibold text-[#018488] tracking-wide uppercase text-[11px]">
              System Ready
            </span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Fast Processing", desc: "Multi-threaded engine for batch conversion." },
            { title: "EXIF Preserved", desc: "1:1 Metadata transfer for professional workflows." },
            { title: "NAS Optimized", desc: "Atomic writes prevent data corruption on network drives." }
          ].map((feature, i) => (
            <div key={i} className="glass-card bg-[var(--card-bg)] border border-white/5 rounded-2xl p-8 hover:bg-white/10 transition-colors duration-300">
              <div className="w-10 h-1 bg-[#018488] mb-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <h3 className="font-display text-xl font-bold mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-[var(--secondary-text)] leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Footer Link */}
        <div className="mt-16 text-center">
          <a 
            href="https://truevineinsights.ch" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[var(--secondary-text)] hover:text-[#018488] transition-colors duration-200"
          >
            <span>Powered by</span>
            <span className="font-bold text-white tracking-wide">TrueVine Insights</span>
          </a>
        </div>
      </div>
    </main>
  );
}
