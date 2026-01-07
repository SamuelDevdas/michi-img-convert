export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7F7F7] dark:bg-[#1A1A1A]">
      {/* Header */}
      <header className="bg-white dark:bg-[#2A2A2A] border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#268E94] to-[#1F7278] rounded-lg"></div>
            <h1 className="font-display text-2xl font-bold text-[#1A1A1A] dark:text-[#F7F7F7]">
              Spectrum
            </h1>
          </div>
          <span className="text-sm text-[#666666] dark:text-[#999999]">
            by TrueVine Insights
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Welcome Card */}
        <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] p-12 mb-8">
          <h2 className="font-display text-4xl font-bold text-[#1A1A1A] dark:text-[#F7F7F7] mb-4">
            Professional RAW Converter
          </h2>
          <p className="text-lg text-[#666666] dark:text-[#999999] mb-6">
            High-performance ARW to JPEG conversion with full metadata preservation
          </p>
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#268E94]/10 dark:bg-[#33A6AE]/10 rounded-full">
            <div className="w-2 h-2 bg-[#268E94] dark:bg-[#33A6AE] rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-[#268E94] dark:text-[#33A6AE]">
              System Ready
            </span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Fast Processing", desc: "Convert thousands of files efficiently" },
            { title: "EXIF Preserved", desc: "Maintain all camera metadata" },
            { title: "NAS Optimized", desc: "Designed for network storage" }
          ].map((feature, i) => (
            <div key={i} className="bg-white dark:bg-[#2A2A2A] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] p-6">
              <h3 className="font-semibold text-[#1A1A1A] dark:text-[#F7F7F7] mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[#666666] dark:text-[#999999]">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Footer Link */}
        <div className="mt-12 text-center">
          <a 
            href="https://truevineinsights.ch" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-[#666666] dark:text-[#999999] hover:text-[#268E94] dark:hover:text-[#33A6AE] transition-colors duration-200"
          >
            Powered by <span className="font-medium">TrueVine Insights</span>
          </a>
        </div>
      </div>
    </main>
  );
}
