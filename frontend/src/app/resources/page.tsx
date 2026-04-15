'use client'

import { useState } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { Search, Filter, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

const ITEMS_LIMIT = 4

function ResourcesContent() {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())

  const toggleSection = (idx: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

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
          tag2: '',
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
          tag2: '',
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
          tag2: '',
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
          tag2: '',
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
          tag2: '',
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
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12 items-start">
        {sections.map((sec, secIdx) => {
          const isExpanded = expandedSections.has(secIdx)
          const visibleItems = isExpanded ? sec.items : sec.items.slice(0, ITEMS_LIMIT)
          const hiddenCount = sec.items.length - ITEMS_LIMIT
          const hasMore = sec.items.length > ITEMS_LIMIT

          return (
            <div key={secIdx} className="flex flex-col gap-3 sm:gap-4">
              {/* Section header */}
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
                        <span className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[7px] sm:text-[8px] tracking-widest px-1.5 py-1 text-(--text-secondary) rounded">
                          {item.tag1}
                        </span>
                      )}
                      {item.tag2 && (
                        <span className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[7px] sm:text-[8px] tracking-widest px-1.5 py-1 text-(--text-secondary) rounded">
                          {item.tag2}
                        </span>
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

              {/* Show more / less toggle */}
              {hasMore && (
                <button
                  onClick={() => toggleSection(secIdx)}
                  className="w-full border border-[rgba(255,255,255,0.08)] rounded py-2.5 flex items-center justify-center gap-2 text-[8px] sm:text-xs tracking-widest font-semibold text-(--text-secondary) hover:text-white hover:border-[rgba(255,255,255,0.2)] transition"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={12} />
                      SHOW LESS
                    </>
                  ) : (
                    <>
                      <ChevronDown size={12} />
                      {hiddenCount} MORE ITEMS
                    </>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

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