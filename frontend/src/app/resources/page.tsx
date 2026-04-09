'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { Search, Filter, ExternalLink } from 'lucide-react'

function ResourcesContent() {
  interface ResourceItem {
    title: string;
    desc: string;
    icon: string;
    tag1?: string;
    tag2?: string;
    linkText: string;
    linkColor: string;
      linkUrl?: string;
    linkIcon?: string;
    isExternal?: boolean;
  }
  
  interface Section {
    title: string;
    icon: string;
    color: string;
    items: ResourceItem[];
  }

  const sections: Section[] = [
    {
      title: 'Platform & APIs',
      icon: 'SYSTEM',
      color: 'var(--accent-green)',
      items: [
      { title: 'GISTDA Sphere Platform', desc: 'Core integration portal for real-time satellite data streams. Required for real-time inference tasks.', icon: '🛰️', tag1: 'API', tag2: 'REQUIRED', linkText: 'sphere.gistda.or.th', linkColor: 'var(--accent-green)', linkUrl: 'https://sphere.gistda.or.th/', isExternal: true },
        // { title: 'Spatial DB Connection', desc: 'Credentials and documentation for accessing the read-only PostgreSQL/PostGIS cluster.', icon: '📡', tag1: 'DOCS', linkText: 'ACCESS CREDENTIALS', linkColor: 'var(--text-secondary)' },
      ]
    },
    {
      title: 'Operational Datasets',
      icon: 'DATA',
      color: 'var(--accent-cyan)',
      items: [
        { title: 'Synthetic Radar (SAR)', desc: 'Calibrated backscatter examples for flood area delineation during monsoon season simulations.', icon: '🌊', tag1: 'DATAINFO', tag2: '500MB', linkText: 'DOWNLOAD (.ZIP) (Coming Soon)', linkColor: 'white' },
        // { title: 'Multispectral Crop Init', desc: 'VHR satellite mosaics covering training fields in Ayutthaya. Bands include RGB, NIR, SWIR.', icon: '🌾', tag1: 'DATASET', tag2: '2.4GB', linkText: 'ACCESS BUCKET', linkColor: 'white', linkIcon: '📁' },
      ]
    },
    // {
    //   title: 'Manuals & Briefings',
    //   icon: 'DOCS',
    //   color: 'var(--accent-amber)',
    //   items: [
    //     { title: 'Challenge SRS v1.4', desc: 'Technical specifications and requirement checklists for all competition phases.', icon: '📋', tag1: 'MANDATORY', linkText: 'VIEW PDF', linkColor: 'white' },
    //     { title: 'UX/UI Guidelines', desc: 'Design system constants, fonts, and component structures required for front-end development.', icon: '🎨', tag1: 'ASSETS', linkText: 'FIGMA BOARD', linkColor: 'white' },
    //   ]
    // }
  ]

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto bg-(--bg-base) flex flex-col">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 sm:gap-8 mb-8 sm:mb-12">
        <div>
          <div className="font-mono text-[8px] sm:text-xs text-(--accent-green) mb-2 sm:mb-4 tracking-widest">
            <span className="text-(--accent-green) mr-1.5">■</span> DATA & INTELLIGENCE
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl text-white mb-2 sm:mb-4">Resources Hub</h1>
          <p className="text-(--text-secondary) text-xs sm:text-sm lg:text-base">Official datasets, API documentation, and mission-critical intelligence.</p>
        </div>
        <div className="text-left lg:text-right">
          <div className="font-mono text-[8px] sm:text-xs text-(--text-muted) tracking-widest mb-2 sm:mb-4">SYSTEM_STATUS: NOMINAL</div>
          <div className="flex items-center gap-2 justify-start lg:justify-end mb-4 sm:mb-6">
            <span className="w-1.5 h-1.5 bg-(--accent-green)" />
            <span className="text-(--accent-green) text-[8px] sm:text-xs font-semibold tracking-widest">OPERATIONAL</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 sm:flex-none">
              <input
                placeholder="Search resources..."
                className="w-full sm:w-40 lg:w-56 bg-(--bg-surface) border border-[rgba(255,255,255,0.1)] rounded px-3 py-2 text-xs sm:text-sm text-white placeholder-(--text-muted) outline-none focus:border-[rgba(255,255,255,0.2)]"
              />
              <Search size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-(--text-muted)" />
            </div>
            <button className="bg-transparent border border-[rgba(255,255,255,0.1)] px-3 py-2 rounded text-white text-xs sm:text-sm tracking-widest font-semibold hover:border-[rgba(255,255,255,0.2)] transition flex items-center justify-center gap-2 whitespace-nowrap">
              <Filter size={14} /> Filter System
            </button>
          </div>
        </div>
      </div>

      {/* Main grids */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
        {sections.map((sec, secIdx) => (
          <div key={secIdx} className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <span className={`text-[8px] sm:text-xs font-bold tracking-widest px-2 py-1 rounded ${
                sec.color === 'var(--accent-green)' ? 'bg-[rgba(0,230,118,0.1)] text-(--accent-green)' :
                sec.color === 'var(--accent-cyan)' ? 'bg-[rgba(0,229,255,0.1)] text-(--accent-cyan)' :
                'bg-[rgba(255,167,38,0.1)] text-(--accent-amber)'
              }`}>
                {sec.icon}
              </span>
              <div className="text-sm sm:text-base font-semibold text-white tracking-wider">
                {sec.title}
              </div>
            </div>

            {sec.items.map((item, i) => (
              <div key={i} className="bg-(--bg-surface) border border-[rgba(255,255,255,0.05)] rounded p-4 sm:p-6 flex-1 flex flex-col hover:border-[rgba(255,255,255,0.1)] transition">
                <div className="flex justify-between items-start gap-2 mb-3 sm:mb-4">
                  <div className="text-2xl sm:text-3xl">{item.icon}</div>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {item.tag1 && <span className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[7px] sm:text-[8px] tracking-widest px-1.5 py-1 text-(--text-secondary) rounded">{item.tag1}</span>}
                    {item.tag2 && <span className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[7px] sm:text-[8px] tracking-widest px-1.5 py-1 text-(--text-secondary) rounded">{item.tag2}</span>}
                  </div>
                </div>
                
                <h3 className="font-display text-base sm:text-lg text-white mb-2 sm:mb-3">{item.title}</h3>
                <p className="text-[8px] sm:text-xs lg:text-sm text-(--text-secondary) leading-relaxed mb-4 sm:mb-6 flex-1">{item.desc}</p>
                
                {item.linkUrl ? (
                  <a
                    href={item.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-t border-[rgba(255,255,255,0.05)] pt-3 sm:pt-4 flex items-center gap-2 hover:text-(--accent-cyan) transition"
                  >
                    {item.linkIcon && <span className="text-lg">{item.linkIcon}</span>}
                    <div className="text-[8px] sm:text-xs font-bold tracking-widest" style={{ color: item.linkColor }}>
                      {item.linkText}
                    </div>
                    {item.isExternal && <ExternalLink size={12} />}
                  </a>
                ) : (
                  <div className="border-t border-[rgba(255,255,255,0.05)] pt-3 sm:pt-4 flex items-center gap-2 cursor-pointer hover:text-(--accent-cyan) transition">
                    {item.linkIcon && <span className="text-lg">{item.linkIcon}</span>}
                    <div className="text-[8px] sm:text-xs font-bold tracking-widest" style={{ color: item.linkColor }}>
                      {item.linkText}
                    </div>
                    {item.isExternal && <ExternalLink size={12} />}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <footer className="border-t border-[rgba(255,255,255,0.05)] pt-4 sm:pt-6 text-center text-[8px] sm:text-xs text-(--text-muted) tracking-wide">
        <div className="mb-2">© 2026 GEOAI HACKATHON</div>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
        </div>
      </footer>
    </div>
  )
}

export default function ResourcesPage() {
  return (
    <AuthProvider>
      <AppShell>
        <ResourcesContent />
      </AppShell>
    </AuthProvider>
  )
}
