'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'

function ResourcesContent() {
  interface ResourceItem {
    title: string;
    desc: string;
    icon: string;
    tag1?: string;
    tag2?: string;
    linkText: string;
    linkColor: string;
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
        { title: 'GISTDA Sphere Platform', desc: 'Core integration portal for real-time satellite data streams. Required for real-time inference tasks.', icon: '🛰️', tag1: 'API', tag2: 'REQUIRED', linkText: 'portal.gistda.or.th', linkColor: 'var(--accent-green)', isExternal: true },
        { title: 'Spatial DB Connection', desc: 'Credentials and documentation for accessing the read-only PostgreSQL/PostGIS cluster.', icon: '📡', tag1: 'DOCS', linkText: 'ACCESS CREDENTIALS', linkColor: 'var(--text-secondary)' },
      ]
    },
    {
      title: 'Operational Datasets',
      icon: 'DATA',
      color: 'var(--accent-cyan)',
      items: [
        { title: 'Synthetic Radar (SAR)', desc: 'Calibrated backscatter examples for flood area delineation during monsoon season simulations.', icon: '🌊', tag1: 'DATAINFO', tag2: '500MB', linkText: 'DOWNLOAD (.ZIP)', linkColor: 'white' },
        { title: 'Multispectral Crop Init', desc: 'VHR satellite mosaics covering training fields in Ayutthaya. Bands include RGB, NIR, SWIR.', icon: '🌾', tag1: 'DATASET', tag2: '2.4GB', linkText: 'ACCESS BUCKET', linkColor: 'white', linkIcon: '📁' },
      ]
    },
    {
      title: 'Manuals & Briefings',
      icon: 'DOCS',
      color: 'var(--accent-amber)',
      items: [
        { title: 'Challenge SRS v1.4', desc: 'Technical specifications and requirement checklists for all competition phases.', icon: '📋', tag1: 'MANDATORY', linkText: 'VIEW PDF', linkColor: 'white' },
        { title: 'UX/UI Guidelines', desc: 'Design system constants, fonts, and component structures required for front-end development.', icon: '🎨', tag1: 'ASSETS', linkText: 'FIGMA BOARD', linkColor: 'white' },
      ]
    }
  ]

  return (
    <div style={{ padding: '40px 60px', maxWidth: 1440, margin: '0 auto', background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--accent-green)', marginBottom: 8, letterSpacing: '0.1em' }}>
            <span style={{ color: 'var(--accent-green)', marginRight: 6 }}>■</span> DATA & INTELLIGENCE
          </div>
          <h1 className="font-display" style={{ fontSize: 44, color: 'white', marginBottom: 8 }}>Resources Hub</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Official datasets, API documentation, and mission-critical intelligence.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6 }}>SYSTEM_STATUS: NOMINAL</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, background: 'var(--accent-green)', display: 'inline-block' }} />
            <span style={{ color: 'var(--accent-green)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em' }}>OPERATIONAL</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <input
                placeholder="Search resources..."
                style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, padding: '10px 16px', fontSize: 12, width: 240, color: 'white', outline: 'none' }}
              />
              <span style={{ position: 'absolute', right: 16, top: 10, color: 'var(--text-muted)', fontSize: 14 }}>⚲</span>
            </div>
            <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', height: 36, padding: '0 16px', borderRadius: 2, color: 'white', fontSize: 11, letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              Filter System <span style={{ color: 'var(--text-muted)' }}>▼</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main grids */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
        {sections.map((sec, secIdx) => (
          <div key={secIdx} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ background: `rgba(${sec.color === 'var(--accent-green)' ? '0,230,118' : sec.color === 'var(--accent-cyan)' ? '0,229,255' : '255,167,38'}, 0.1)`, color: sec.color, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', padding: '4px 8px', borderRadius: 2 }}>
                {sec.icon}
              </span>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'white', letterSpacing: '0.05em' }}>
                {sec.title}
              </div>
            </div>

            {sec.items.map((item, i) => (
              <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ fontSize: 32, opacity: 0.9 }}>{item.icon}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {item.tag1 && <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 9, letterSpacing: '0.1em', padding: '3px 6px', color: 'var(--text-secondary)', borderRadius: 2 }}>{item.tag1}</span>}
                    {item.tag2 && <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 9, letterSpacing: '0.1em', padding: '3px 6px', color: 'var(--text-secondary)', borderRadius: 2 }}>{item.tag2}</span>}
                  </div>
                </div>
                
                <h3 className="font-display" style={{ fontSize: 18, color: 'white', marginBottom: 12 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24, flex: 1 }}>{item.desc}</p>
                
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  {item.linkIcon && <span style={{ fontSize: 16 }}>{item.linkIcon}</span>}
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: item.linkColor }}>
                    {item.linkText}
                  </div>
                  {item.isExternal && <span style={{ color: item.linkColor, fontSize: 14 }}>↗</span>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <footer style={{ marginTop: 60, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
        <div>© 2024 GEOAI HACKATHON | PRECISION LENS UI</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <span>PRIVACY POLICY</span>
          <span>TERMS OF SERVICE</span>
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
