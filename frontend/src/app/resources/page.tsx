'use client'

import { useState, useMemo } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { Search, ExternalLink, ChevronDown, ChevronUp, X } from 'lucide-react'

const ITEMS_LIMIT = 4

interface ResourceItem {
  title: string
  desc: string
  icon: string
  tag1?: string
  tag2?: string
  linkText: string
  linkColor: string
  linkUrl?: string
  linkIcon?: string
  isExternal?: boolean
}

interface Section {
  title: string
  icon: string
  color: string
  items: ResourceItem[]
}

const sections: Section[] = [
  {
    title: 'Platform & APIs',
    icon: 'SYSTEM',
    color: 'var(--accent-green)',
    items: [
      {
        title: 'GISTDA Sphere Platform',
        desc: 'ระบบรวมศูนย์ข้อมูลดาวเทียมแบบเรียลไทม์ สำหรับใช้ประกอบการประมวลผลโมเดล (Inference) โดยตรง',
        icon: '🛰️',
        tag1: 'API',
        tag2: 'REQUIRED',
        linkText: 'sphere.gistda.or.th',
        linkColor: 'var(--accent-green)',
        linkUrl: 'https://sphere.gistda.or.th/',
        isExternal: true,
      },
    ],
  },
  {
    title: 'Operational Datasets',
    icon: 'DATA',
    color: 'var(--accent-cyan)',
    items: [
      {
        title: 'Optical And SAR data from \n Sentinel 1 & 2',
        desc: ' Sentinel-1 (Radar/SAR): สำคัญมากสำหรับบริบทไทย เพราะคลื่นเรดาร์สามารถทะลุเมฆได้ นำมาใช้ประมวลผลหาพื้นที่น้ำท่วมขัง (Flood Extent) ได้อย่างแม่นยำ หรือใช้ดูความชื้นในดินเพื่อเตือนภัยแล้ง \n\n Sentinel-2 (Multispectral): เหมาะสำหรับช่วงฟ้าเปิด ใช้ดูดัชนีพืชพรรณ (NDVI, NDWI) เพื่อจำแนกประเภทพืช (เช่น ข้าว อ้อย ยางพารา) หรือดูความเสียหายของแปลงเกษตรจากแมลงศัตรูพืช ',
        icon: '🌊',
        tag1: 'DATAINFO',
        tag2: 'Disaster',
        linkText: 'dataspace.copernicus.eu',
        linkColor: 'var(--accent-green)',
        linkUrl: 'https://dataspace.copernicus.eu/data-collections/copernicus-sentinel-missions',
        isExternal: true,
      },
      {
        title: 'กรมพัฒนาที่ดิน',
        desc: 'มีการเปิดให้ขอชุดข้อมูล Shapefile แผนที่กลุ่มชุดดิน แผนที่การใช้ที่ดิน (Land Use) ซึ่งเป็น Ground Truth ชั้นดีในการนำไปเทรนโมเดล AI ด้านการเกษตร ',
        icon: '🌱',
        tag1: 'DATAINFO',
        tag2: 'Agriculture',
        linkText: 'ldd.go.th',
        linkColor: 'var(--accent-green)',
        linkUrl: 'https://www.ldd.go.th/home/',
        isExternal: true,
      },
      {
        title: 'สถาบันสารสนเทศทรัพยากรน้ำ (สสน. - HAII)',
        desc: 'มีการเปิดให้ขอชุดข้อมูล Shapefile แผนที่กลุ่มชุดดิน แผนที่การใช้ที่ดิน (Land Use) ซึ่งเป็น Ground Truth ชั้นดีในการนำไปเทรนโมเดล AI ด้านการเกษตร ',
        icon: '💧',
        tag1: 'DATAINFO',
        tag2: 'Agriculture',
        linkText: 'ThaiWater.net',
        linkColor: 'var(--accent-green)',
        linkUrl: 'https://www.thaiwater.net/',
        isExternal: true,
      },
      {
        title: 'กรมอุตุนิยมวิทยา',
        desc: 'ศูนย์กลางด้านข้อมูลสภาพอากาศและปรากฏการณ์ธรรมชาติ',
        icon: '🌪️',
        tag1: 'DATAINFO',
        tag2: 'Disaster',
        linkText: 'tmd.go.th',
        linkColor: 'var(--accent-green)',
        linkUrl: 'https://www.tmd.go.th/',
        isExternal: true,
      },
      {
        title: 'ศูนย์กลางข้อมูลเปิดภาครัฐ',
        desc: 'ศูนย์กลางด้านข้อมูลสภาพอากาศและปรากฏการณ์ธรรมชาติ',
        icon: '🏢🗂️',
        tag1: 'DATAINFO',
        tag2: 'Disaster',
        linkText: 'Data.go.th',
        linkColor: 'var(--accent-green)',
        linkUrl: 'https://data.go.th/dataset/',
        isExternal: true,
      },
      {
        title: 'สำนักงานเศรษฐกิจการเกษตร',
        desc: 'สถิติการเกษตรของประเทศไทย พื้นที่เพาะปลูกปริมาณผลผลิต ราคาพืชผล และดัชนีเศรษฐกิจการเกษตร',
        icon: '📊🌳',
        tag1: 'DATAINFO',
        tag2: 'Agriculture',
        linkText: 'oae.go.th',
        linkColor: 'var(--accent-green)',
        linkUrl: 'https://oae.go.th/home',
        isExternal: true,
      },
      {
        title: 'กรมส่งเสริมการเกษตร',
        desc: 'ข้อมูลทะเบียนเกษตรกร สถานการณ์การปลูกพืชรายจังหวัด และข้อมูลองค์ความรู้ด้านการจัดการแปลงเกษตร',
        icon: '🌾',
        tag1: 'DATAINFO',
        tag2: 'Agriculture',
        linkText: 'กรมส่งเสริมการเกษตร(DOAE)',
        linkColor: 'var(--accent-green)',
        linkUrl: 'https://www.doae.go.th/home-new-2024/',
        isExternal: true,
      },
      {
        title: 'กรมป้องกันและบรรเทาสาธารณภัย',
        desc: 'รายงานสถานการณ์สาธารณภัยประจำวัน สถิติการเกิดภัยพิบัติย้อนหลัง (น้ำท่วม ภัยแล้ง วาตภัย อัคคีภัย) พื้นที่ประกาศเขตการให้ความช่วยเหลือผู้ประสบภัยพิบัติกรณีฉุกเฉิน',
        icon: '🛘',
        tag1: 'DATAINFO',
        tag2: 'Disaster',
        linkText: 'disaster.go.th',
        linkColor: 'var(--accent-green)',
        linkUrl: 'https://www.disaster.go.th/home',
        isExternal: true,
      },
      {
        title: 'สถาบันสารสนเทศทรัพยากรน้ำ (องค์การมหาชน)',
        desc: 'ข้อมูลที่เกี่ยวกับภัยพิบัติทางน้ำโดยตรง เช่นสถานการณ์น้ำท่วม ภัยแล้ง ระดับน้ำในเขื่อน ปริมาณน้ำฝน และการคาดการณ์สภาพอากาศล่วงหน้า',
        icon: '💧',
        tag1: 'DATAINFO',
        tag2: 'Disaster',
        linkText: 'ThaiWater.net',
        linkColor: 'var(--accent-green)',
        linkUrl: 'https://www.thaiwater.net',
        isExternal: true,
      },
      {
        title: 'Agri-Map Online (NECTEC ร่วมกับกระทรวงเกษตรฯ)',
        desc: 'สามารถดาวน์โหลดเป็นไฟล์เชิงพื้นที่ (Shapefile) หรือเรียกใช้ผ่านบริการ Web Map Service (WMS) เพื่อนำไปวิเคราะห์ในซอฟต์แวร์ทางภูมิสารสนเทศได้',
        icon: '🗺️',
        tag1: 'DATAINFO',
        tag2: 'Agriculture',
        linkText: 'agri-map-online.moac.go.th',
        linkColor: 'var(--accent-green)',
        linkUrl: 'https://agri-map-online.moac.go.th/',
        isExternal: true,
      },
      {
        title: 'กรมชลประทาน',
        desc: 'มีหน้าเว็บศูนย์ปฏิบัติการน้ำอัจฉริยะ (SWOC) ที่รายงานตัวเลขและพิกัดสถานีวัดแบบรายชั่วโมง เหมาะสำหรับการดึงข้อมูล (Scraping/API) ไปใช้ประมวลผลร่วมกับระบบเซ็นเซอร์หรือบอร์ดไมโครคอนโทรลเลอร์ตรวจวัดสภาพแวดล้อมแปลงเกษตร',
        icon: '🚰',
        tag1: 'DATAINFO',
        tag2: 'Agriculture',
        linkText: 'rid.go.th',
        linkColor: 'var(--accent-green)',
        linkUrl: 'https://www.rid.go.th',
        isExternal: true,
      },
      {
        title: 'กรมควบคุมมลพิษ',
        desc: 'นอกเหนือจากเว็บ Air4Thai ยังมีการเปิดให้เข้าถึงข้อมูลดิบและ API สำหรับนักพัฒนา เพื่อดึงข้อมูลคุณภาพอากาศและพิกัดสถานีตรวจวัดทั่วประเทศไปใช้งานแบบเรียลไทม์',
        icon: '🌫️',
        tag1: 'DATAINFO',
        tag2: 'Disaster',
        linkText: 'pcd.go.th',
        linkColor: 'var(--accent-green)',
        linkUrl: 'https://www.pcd.go.th',
        isExternal: true,
      },
      {
        title: 'กองเฝ้าระวังแผ่นดินไหวกรมอุตุนิยมวิทยา',
        desc: 'มีข้อมูลพิกัดการเกิดแผ่นดินไหว (Lat/Lon) ความลึก และขนาด (Magnitude) ที่สามารถพล็อคลงแผนที่เพื่อประเมินความเสี่ยงเชิงพื้นที่ได้',
        icon: '🌫️',
        tag1: 'DATAINFO',
        tag2: 'Disaster',
        linkText: 'earthquake.tmd.go.th',
        linkColor: 'var(--accent-green)',
        linkUrl: 'https://earthquake.tmd.go.th',
        isExternal: true,
      },
    ],
  },
]

// Collect all unique tags from all items across all sections
function getAllTags(sections: Section[]): string[] {
  const tagSet = new Set<string>()
  for (const sec of sections) {
    for (const item of sec.items) {
      if (item.tag1) tagSet.add(item.tag1)
      if (item.tag2) tagSet.add(item.tag2)
    }
  }
  return Array.from(tagSet).sort()
}

function ResourcesContent() {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  const [filterOpen, setFilterOpen] = useState(false)

  const allTags = useMemo(() => getAllTags(sections), [])

  const toggleSection = (idx: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  const toggleTag = (tag: string) => {
    setActiveTags(prev => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  const clearAll = () => {
    setSearchQuery('')
    setActiveTags(new Set())
  }

  const hasFilters = searchQuery.trim() !== '' || activeTags.size > 0

  // Filter logic: item matches if it passes both search AND tag filter
  const filteredSections = useMemo(() => {
    return sections.map(sec => {
      const filteredItems = sec.items.filter(item => {
        // Search: match title or desc (case-insensitive)
        const q = searchQuery.trim().toLowerCase()
        const matchesSearch =
          q === '' ||
          item.title.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          (item.tag1 ?? '').toLowerCase().includes(q) ||
          (item.tag2 ?? '').toLowerCase().includes(q)

        // Tag filter: item must have ALL active tags
        const matchesTags =
          activeTags.size === 0 ||
          Array.from(activeTags).every(
            t => item.tag1 === t || item.tag2 === t
          )

        return matchesSearch && matchesTags
      })
      return { ...sec, items: filteredItems }
    }).filter(sec => sec.items.length > 0)
  }, [searchQuery, activeTags])

  const totalResults = filteredSections.reduce((sum, sec) => sum + sec.items.length, 0)

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto bg-(--bg-base) flex flex-col">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 sm:gap-8 mb-8 sm:mb-12">
        <div>
          <div className="font-mono text-[8px] sm:text-xs text-(--accent-green) mb-2 sm:mb-4 tracking-widest">
            <span className="text-(--accent-green) mr-1.5">■</span> DATA & INTELLIGENCE
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl text-white mb-2 sm:mb-4">Resources Hub</h1>
          <p className="text-(--text-secondary) text-xs sm:text-sm lg:text-base">
            Official datasets, API documentation, and mission-critical intelligence.
          </p>
        </div>

        <div className="text-left lg:text-right">
          <div className="font-mono text-[8px] sm:text-xs text-(--text-muted) tracking-widest mb-2 sm:mb-4">
            SYSTEM_STATUS: NOMINAL
          </div>
          <div className="flex items-center gap-2 justify-start lg:justify-end mb-4 sm:mb-6">
            <span className="w-1.5 h-1.5 bg-(--accent-green)" />
            <span className="text-(--accent-green) text-[8px] sm:text-xs font-semibold tracking-widest">OPERATIONAL</span>
          </div>

          {/* Search + Filter row */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search input */}
            <div className="relative flex-1 sm:flex-none">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search resources..."
                className="w-full sm:w-48 lg:w-64 bg-(--bg-surface) border border-[rgba(255,255,255,0.1)] rounded px-3 py-2 pr-8 text-xs sm:text-sm text-white placeholder-(--text-muted) outline-none focus:border-[rgba(255,255,255,0.25)] transition"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-white transition"
                >
                  <X size={13} />
                </button>
              ) : (
                <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted) pointer-events-none" />
              )}
            </div>

            {/* Filter toggle button */}
            <button
              onClick={() => setFilterOpen(v => !v)}
              className={`bg-transparent border px-3 py-2 rounded text-white text-xs sm:text-sm tracking-widest font-semibold transition flex items-center justify-center gap-2 whitespace-nowrap relative ${
                activeTags.size > 0
                  ? 'border-[rgba(0,229,255,0.5)] text-(--accent-cyan)'
                  : 'border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)]'
              }`}
            >
              Filter System
              {activeTags.size > 0 && (
                <span className="bg-(--accent-cyan) text-black text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {activeTags.size}
                </span>
              )}
              {filterOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          {/* Filter dropdown panel */}
          {filterOpen && (
            <div className="mt-2 bg-(--bg-surface) border border-[rgba(255,255,255,0.1)] rounded p-3 sm:p-4 w-full sm:w-auto lg:min-w-64 text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[8px] tracking-widest text-(--text-muted)">FILTER BY TAG</span>
                {activeTags.size > 0 && (
                  <button
                    onClick={() => setActiveTags(new Set())}
                    className="text-[8px] tracking-widest text-(--text-muted) hover:text-white transition flex items-center gap-1"
                  >
                    <X size={10} /> CLEAR
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => {
                  const isActive = activeTags.has(tag)
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`text-[8px] sm:text-[10px] tracking-widest px-2 py-1 rounded border font-semibold transition ${
                        isActive
                          ? 'bg-(--accent-cyan) border-(--accent-cyan) text-black'
                          : 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-(--text-secondary) hover:border-[rgba(255,255,255,0.25)] hover:text-white'
                      }`}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active filter chips + result count */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="font-mono text-[8px] text-(--text-muted) tracking-widest">
            {totalResults} RESULT{totalResults !== 1 ? 'S' : ''}
          </span>

          {searchQuery.trim() && (
            <span className="flex items-center gap-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[8px] tracking-widest px-2 py-1 rounded text-(--text-secondary)">
              &quot;{searchQuery.trim()}&quot;
              <button onClick={() => setSearchQuery('')} className="hover:text-white transition">
                <X size={9} />
              </button>
            </span>
          )}

          {Array.from(activeTags).map(tag => (
            <span
              key={tag}
              className="flex items-center gap-1 bg-[rgba(0,229,255,0.1)] border border-[rgba(0,229,255,0.3)] text-[8px] tracking-widest px-2 py-1 rounded text-(--accent-cyan)"
            >
              {tag}
              <button onClick={() => toggleTag(tag)} className="hover:text-white transition">
                <X size={9} />
              </button>
            </span>
          ))}

          <button
            onClick={clearAll}
            className="text-[8px] tracking-widest text-(--text-muted) hover:text-white transition ml-1"
          >
            CLEAR ALL
          </button>
        </div>
      )}

      {/* Empty state */}
      {filteredSections.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-white font-display text-lg mb-2">No results found</p>
          <p className="text-(--text-secondary) text-xs mb-6">
            Try adjusting your search or removing some filters.
          </p>
          <button
            onClick={clearAll}
            className="border border-[rgba(255,255,255,0.15)] rounded px-4 py-2 text-xs tracking-widest text-(--text-secondary) hover:text-white hover:border-[rgba(255,255,255,0.3)] transition"
          >
            CLEAR ALL FILTERS
          </button>
        </div>
      )}

      {/* Main grid */}
      {filteredSections.length > 0 && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12 items-start">
          {filteredSections.map((sec, secIdx) => {
            // Use original section index for expand state (so it doesn't shift when filtering)
            const originalIdx = sections.findIndex(s => s.title === sec.title)
            const isExpanded = expandedSections.has(originalIdx)

            // When search/filter is active → show all matches (no limit)
            const isFiltering = hasFilters
            const visibleItems = isFiltering || isExpanded
              ? sec.items
              : sec.items.slice(0, ITEMS_LIMIT)
            const hiddenCount = sec.items.length - ITEMS_LIMIT
            const hasMore = !isFiltering && sec.items.length > ITEMS_LIMIT

            return (
              <div key={sec.title} className="flex flex-col gap-3 sm:gap-4">
                {/* Section header */}
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <span
                    className={`text-[8px] sm:text-xs font-bold tracking-widest px-2 py-1 rounded ${
                      sec.color === 'var(--accent-green)'
                        ? 'bg-[rgba(0,230,118,0.1)] text-(--accent-green)'
                        : sec.color === 'var(--accent-cyan)'
                        ? 'bg-[rgba(0,229,255,0.1)] text-(--accent-cyan)'
                        : 'bg-[rgba(255,167,38,0.1)] text-(--accent-amber)'
                    }`}
                  >
                    {sec.icon}
                  </span>
                  <div className="text-sm sm:text-base font-semibold text-white tracking-wider">
                    {sec.title}
                  </div>
                  <div className="font-mono text-[8px] text-(--text-muted) ml-auto">
                    {sec.items.length} items
                  </div>
                </div>

                {/* Cards */}
                {visibleItems.map((item, i) => (
                  <div
                    key={i}
                    className="bg-(--bg-surface) border border-[rgba(255,255,255,0.05)] rounded p-4 sm:p-6 flex flex-col hover:border-[rgba(255,255,255,0.1)] transition"
                  >
                    <div className="flex justify-between items-start gap-2 mb-3 sm:mb-4">
                      <div className="text-2xl sm:text-3xl">{item.icon}</div>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {item.tag1 && (
                          <button
                            onClick={() => {
                              toggleTag(item.tag1!)
                              setFilterOpen(false)
                            }}
                            className={`text-[7px] sm:text-[8px] tracking-widest px-1.5 py-1 rounded border transition ${
                              activeTags.has(item.tag1)
                                ? 'bg-(--accent-cyan) border-(--accent-cyan) text-black'
                                : 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-(--text-secondary) hover:border-[rgba(255,255,255,0.25)] hover:text-white'
                            }`}
                          >
                            {item.tag1}
                          </button>
                        )}
                        {item.tag2 && (
                          <button
                            onClick={() => {
                              toggleTag(item.tag2!)
                              setFilterOpen(false)
                            }}
                            className={`text-[7px] sm:text-[8px] tracking-widest px-1.5 py-1 rounded border transition ${
                              activeTags.has(item.tag2)
                                ? 'bg-(--accent-cyan) border-(--accent-cyan) text-black'
                                : 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-(--text-secondary) hover:border-[rgba(255,255,255,0.25)] hover:text-white'
                            }`}
                          >
                            {item.tag2}
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="font-display text-base sm:text-lg text-white mb-2 sm:mb-3 whitespace-pre-line">
                      {item.title}
                    </h3>
                    <p className="text-[8px] sm:text-xs lg:text-sm text-(--text-secondary) leading-relaxed mb-4 sm:mb-6 flex-1 whitespace-pre-line">
                      {item.desc}
                    </p>

                    {item.linkUrl ? (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-t border-[rgba(255,255,255,0.05)] pt-3 sm:pt-4 flex items-center gap-2 hover:text-(--accent-cyan) transition"
                      >
                        {item.linkIcon && <span className="text-lg">{item.linkIcon}</span>}
                        <div
                          className="text-[8px] sm:text-xs font-bold tracking-widest"
                          style={{ color: item.linkColor }}
                        >
                          {item.linkText}
                        </div>
                        {item.isExternal && <ExternalLink size={12} />}
                      </a>
                    ) : (
                      <div className="border-t border-[rgba(255,255,255,0.05)] pt-3 sm:pt-4 flex items-center gap-2 cursor-pointer hover:text-(--accent-cyan) transition">
                        {item.linkIcon && <span className="text-lg">{item.linkIcon}</span>}
                        <div
                          className="text-[8px] sm:text-xs font-bold tracking-widest"
                          style={{ color: item.linkColor }}
                        >
                          {item.linkText}
                        </div>
                        {item.isExternal && <ExternalLink size={12} />}
                      </div>
                    )}
                  </div>
                ))}

                {/* Show more / less — hidden when actively filtering */}
                {hasMore && (
                  <button
                    onClick={() => toggleSection(originalIdx)}
                    className="w-full border border-[rgba(255,255,255,0.08)] rounded py-2.5 flex items-center justify-center gap-2 text-[8px] sm:text-xs tracking-widest font-semibold text-(--text-secondary) hover:text-white hover:border-[rgba(255,255,255,0.2)] transition"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp size={12} /> SHOW LESS
                      </>
                    ) : (
                      <>
                        <ChevronDown size={12} /> {hiddenCount} MORE ITEMS
                      </>
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[rgba(255,255,255,0.05)] pt-4 sm:pt-6 text-center text-[8px] sm:text-xs text-(--text-muted) tracking-wide">
        <div className="mb-2">© 2026 GEOAI HACKATHON</div>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6" />
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