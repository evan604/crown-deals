import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👑</span>
            <span className="text-xl font-bold tracking-tight">CrownDeals</span>
          </div>
          <nav className="flex gap-6 text-sm text-gray-400">
            <Link href="#features" className="hover:text-white transition">How it works</Link>
            <Link href="#pricing" className="hover:text-white transition">Pricing</Link>
            <button className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition">
              Get Started
            </button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-20 px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Never overpay on a Rolex
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            AI-powered deal monitoring across 50+ sources. We watch Chrono24, eBay, 
            Bob's Watches, and more — so you buy with confidence.
          </p>
          <div className="flex justify-center gap-4">
            <button className="px-8 py-4 bg-blue-600 rounded-xl font-semibold hover:bg-blue-500 transition">
              Start free
            </button>
            <button className="px-8 py-4 border border-gray-700 rounded-xl font-semibold hover:bg-gray-900 transition">
              See sample deal
            </button>
          </div>
        </section>

        {/* Deal Preview */}
        <section className="py-16 px-4 max-w-4xl mx-auto">
          <div className="border border-gray-800 rounded-2xl p-6 bg-gray-900/50">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-green-400 font-bold text-lg">8.5</span>
              </div>
              <div>
                <h3 className="font-semibold">Rolex Submariner 126610LN</h3>
                <p className="text-sm text-gray-400">Chrono24 • $12,800</p>
              </div>
              <span className="ml-auto px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                Hot Deal
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              "$800 below 90-day average. Box + papers. 5-star seller with 200+ transactions."
            </p>
            <div className="mt-4 flex gap-2 text-xs text-gray-500">
              <span>⚡ Live</span>
              <span>•</span>
              <span>Scored by AI</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 px-4 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border border-gray-800 rounded-xl">
              <div className="text-3xl mb-4">🔍</div>
              <h3 className="font-semibold mb