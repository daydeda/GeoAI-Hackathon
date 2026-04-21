'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
// Font is loaded via CSS @import in globals.css

const agricultureIdeas = [
  {
    title: 'Rain-to-Yield Risk Model',
    detail: 'พัฒนาโมเดลประเมินความเสี่ยงผลผลิตเสียหายจากฝนเกินหรือขาด โดยใช้ข้อมูลฝนและดัชนีพืชพรรณร่วมกับข้อมูลดิน',
  },
  {
    title: 'Flood Exposure for Agricultural Parcels',
    detail: 'วิเคราะห์แปลงเกษตรที่มีความเสี่ยงน้ำท่วมรายจุดด้วยข้อมูลความสูงภูมิประเทศ การใช้ที่ดิน และข้อมูลฝน',
  },
  {
    title: 'Crop Calendar Optimization Tool',
    detail: 'ปรับปฏิทินการเพาะปลูกให้เหมาะสมกับแนวโน้มฝนล่วงหน้าในระดับพื้นที่',
  },
  {
    title: 'Community Water Map Digitization',
    detail: 'แปลงข้อมูลแผนที่แหล่งน้ำชุมชนเป็นข้อมูลเชิงพื้นที่ที่ตรวจสอบและใช้งานต่อได้',
  },
  {
    title: 'Irrigation Demand Estimator',
    detail: 'คำนวณความต้องการน้ำชลประทานเชิงพื้นที่จากชนิดพืช สภาพอากาศ และช่วงการเติบโต',
  },
  {
    title: 'Drought Early Warning Dashboard',
    detail: 'สร้างแดชบอร์ดเตือนภัยแล้งเบื้องต้นด้วยตัวชี้วัดภัยแล้งในระดับตำบล',
  },
  {
    title: 'Agricultural Vulnerability Index',
    detail: 'พัฒนาดัชนีความเปราะบางภาคเกษตรจากสภาพดิน ความลาดชัน และความผิดปกติของฝน',
  },
  {
    title: 'Farm-level Safe Zone Mapping',
    detail: 'ระบุพื้นที่ปลอดภัยสำหรับเก็บผลผลิตหรือย้ายเครื่องจักรเมื่อเกิดภาวะน้ำท่วม',
  },
  {
    title: 'River Morphology Change Detector',
    detail: 'ตรวจจับการเปลี่ยนรูปร่างลำน้ำจากภาพถ่ายดาวเทียมเพื่อประเมินผลกระทบต่อพื้นที่เกษตร',
  },
  {
    title: 'Probabilistic Crop Damage Forecast',
    detail: 'พยากรณ์ความน่าจะเป็นของความเสียหายผลผลิตเพื่อช่วยวางแผนลดความเสี่ยง',
  },
]

const disasterIdeas = [
  {
    title: 'Rain-to-Flood Probability Model',
    detail: 'อินพุตเป็นฝนสะสมและความชื้นดิน เพื่อประเมินโอกาสเกิดน้ำท่วมฉับพลันรายพื้นที่',
  },
  {
    title: 'Flash Flood Susceptibility Map',
    detail: 'สร้างแผนที่ความอ่อนไหวต่อน้ำท่วมฉับพลันด้วยความลาดชัน การใช้ที่ดิน และความเข้มฝน',
  },
  {
    title: 'Actionable Evacuation Routing',
    detail: 'วางเส้นทางอพยพที่ใช้งานได้จริงจากข้อมูลถนน ความสูง และการจำลองระดับน้ำ',
  },
  {
    title: 'Offline Flood Alert Toolkit',
    detail: 'ออกแบบระบบแจ้งเตือนสำรองที่ยังทำงานได้เมื่ออินเทอร์เน็ตขัดข้อง',
  },
  {
    title: 'Flood Depth Estimation via DEM',
    detail: 'ประเมินความลึกของน้ำท่วมจากข้อมูลความสูงเชิงเลขเพื่อสนับสนุนการตัดสินใจ',
  },
  {
    title: 'Critical Facility Risk Mapping',
    detail: 'ประเมินความเสี่ยงของโรงพยาบาล โรงเรียน และโครงสร้างพื้นฐานสำคัญต่อเหตุอุทกภัย',
  },
  {
    title: 'Human Operation Simulation',
    detail: 'จำลองการปฏิบัติการภาคสนามในสถานการณ์น้ำท่วมหลายฉากทัศน์',
  },
  {
    title: 'Trust-building Visualization',
    detail: 'สื่อสารผลคาดการณ์พร้อมช่วงความไม่แน่นอนให้ผู้บริหารและประชาชนเข้าใจง่าย',
  },
  {
    title: 'Vulnerable Population Detection',
    detail: 'ระบุกลุ่มเปราะบางด้วยข้อมูลอาคารและข้อมูลประชากรเชิงกริดเพื่อจัดลำดับช่วยเหลือ',
  },
  {
    title: 'Multi-Agency Data Integration Portal',
    detail: 'ออกแบบแดชบอร์ดรวมข้อมูลจากหลายหน่วยงานเพื่อให้ทุกฝ่ายใช้ข้อมูลชุดเดียวกัน',
  },
]

const rewards = [
  { title: 'รางวัลชนะเลิศ', prize: '40,000 บาท', detail: 'พร้อมใบประกาศนียบัตรและโล่รางวัล' },
  { title: 'รองชนะเลิศอันดับ 1', prize: '20,000 บาท', detail: 'พร้อมใบประกาศนียบัตร' },
  { title: 'รองชนะเลิศอันดับ 2', prize: '10,000 บาท', detail: 'พร้อมใบประกาศนียบัตร' },
  { title: 'รางวัลพิเศษ Best AI Model', prize: '5,000 บาท', detail: 'รางวัลสำหรับผลงานโมเดลที่โดดเด่น' },
  { title: 'รางวัลพิเศษ Best Visualization', prize: '5,000 บาท', detail: 'รางวัลสำหรับการสื่อสารข้อมูลเชิงภาพยอดเยี่ยม' },
]

const rubricItems = [
  { title: 'การนิยามปัญหา', score: 5, color: '#22d3ee' },
  { title: 'โครงสร้างข้อมูลและสถาปัตยกรรมเชิงพื้นที่', score: 5, color: '#38bdf8' },
  { title: 'กรอบวิธีวิทยา', score: 30, color: '#a3e635' },
  { title: 'ผลลัพธ์ที่คาดหวังและการใช้ประโยชน์เชิงตัดสินใจ', score: 10, color: '#f59e0b' },
]

const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || ''
const TEMPLATE_PROPOSAL_URL = `${basePath}/Proposal_Hackathon_2026_Apr_07.docx`
const GEO_AI_POSTER_URL = `${basePath}/GeoAIPoster.png`

const rewardThemes = [
  {
    badge: 'Grand Prize',
    icon: '🏆',
    chipClass: 'text-[#facc15] border-[rgba(250,204,21,0.45)] bg-[rgba(250,204,21,0.1)]',
    amountClass: 'text-[#facc15]',
    glow: '0 0 24px rgba(250,204,21,0.25)',
    hoverClass: 'hover:-translate-y-1.5 hover:scale-[1.02]',
    motionClass: 'animate-pulse',
  },
  {
    badge: '1st Runner-up',
    icon: '🥈',
    chipClass: 'text-[#cbd5e1] border-[rgba(203,213,225,0.5)] bg-[rgba(148,163,184,0.12)]',
    amountClass: 'text-[#cbd5e1]',
    glow: '0 0 20px rgba(148,163,184,0.28)',
    hoverClass: 'hover:-translate-y-1 hover:rotate-[-0.5deg]',
    motionClass: 'animate-bounce',
  },
  {
    badge: '2nd Runner-up',
    icon: '🥉',
    chipClass: 'text-[#fb923c] border-[rgba(251,146,60,0.45)] bg-[rgba(251,146,60,0.1)]',
    amountClass: 'text-[#fb923c]',
    glow: '0 0 20px rgba(251,146,60,0.25)',
    hoverClass: 'hover:-translate-y-1 hover:rotate-[0.5deg]',
    motionClass: 'animate-ping',
  },
  {
    badge: 'Special Prize',
    icon: '🤖',
    chipClass: 'text-[#22d3ee] border-[rgba(34,211,238,0.45)] bg-[rgba(34,211,238,0.1)]',
    amountClass: 'text-[#22d3ee]',
    glow: '0 0 20px rgba(34,211,238,0.22)',
    hoverClass: 'hover:-translate-y-1 hover:scale-[1.01]',
    motionClass: 'animate-pulse',
  },
  {
    badge: 'Special Prize',
    icon: '📊',
    chipClass: 'text-[#a3e635] border-[rgba(163,230,53,0.45)] bg-[rgba(163,230,53,0.1)]',
    amountClass: 'text-[#a3e635]',
    glow: '0 0 20px rgba(163,230,53,0.22)',
    hoverClass: 'hover:-translate-y-1 hover:scale-[1.01]',
    motionClass: 'animate-bounce',
  },
] as const

function DocsContent({ enhancedRewards = true }: { enhancedRewards?: boolean }) {
  return (
    <div className="docs-kanit min-h-screen bg-(--bg-base) px-4 py-6 sm:px-6 lg:px-8" style={{ fontFamily: 'var(--font-kanit)' }}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <section className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-7">
            <h1 className="text-2xl font-semibold text-white sm:text-3xl" style={{ fontFamily: 'var(--font-kanit)' }}>รายละเอียดการแข่งขัน</h1>
            
            {/* เปลี่ยนจาก <p> เดี่ยวๆ เป็น <div> ครอบ แล้วใช้ text-justify เพื่อให้ข้อความเท่ากัน และ space-y-4 เพื่อเว้นระยะย่อหน้า */}
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-(--text-secondary) text-justify">
              <p>
                โครงการ GeoAI Hackathon 2026 เกิดขึ้นจากความร่วมมือทางวิชาการและการผลักดันนวัตกรรมระหว่าง คณะวิศวกรรมศาสตร์ สจล. (KMITL), มจธ. (KMUTT), GISTDA และ ESRI (Thailand) โดยได้รับงบประมาณสนับสนุนหลักจาก สำนักงานพัฒนาธุรกรรมทางอิเล็กทรอนิกส์ (ETDA) ภายใต้พันธกิจในการสร้างระบบนิเวศดิจิทัลที่ปลอดภัยและเข้มแข็งให้กับประเทศ
              </p>
              <p>
                เป้าหมายสำคัญของการแข่งขันในครั้งนี้ คือการเฟ้นหาสุดยอดไอเดียจากนิสิตนักศึกษาในการประยุกต์ใช้เทคโนโลยี Generative AI (เช่น LLMs, Multi-modal AI หรือเทคนิคการสร้างข้อมูลจำลอง) มาบูรณาการร่วมกับ ข้อมูลภูมิสารสนเทศ (Geospatial Data) เพื่อสร้างสรรค์โซลูชันหรือระบบอัจฉริยะที่สามารถแก้ไขปัญหาเชิงพื้นที่ (Spatial Problems) ได้อย่างมีประสิทธิภาพ ไม่ว่าจะเป็นด้านสิ่งแวดล้อม การผังเมือง การบริหารจัดการทรัพยากร หรือความปลอดภัยในสังคม เพื่อยกระดับขีดความสามารถทางการแข่งขันด้านเทคโนโลยีของประเทศไทยให้ทัดเทียมระดับสากล
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={TEMPLATE_PROPOSAL_URL}
                download="Proposal_Hackathon_2026_Apr_07.docx"
                className="inline-flex items-center justify-center rounded border border-[rgba(255,165,0,0.45)] bg-[#FFA500] px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
              >
                Download Template Proposal
              </a>
            </div>
            <div className="mt-6 overflow-hidden rounded-lg border border-(--border-subtle) bg-(--bg-base)">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GEO_AI_POSTER_URL} alt="GEO Hackathon Poster" className="mx-auto w-full max-w-md" />
            </div>
        </section>

        <section className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-(--text-primary) sm:text-xl" style={{ fontFamily: 'var(--font-kanit)' }}>
            ตัวอย่างโจทย์ GEO Hackathon (สามารถนำเสนอโจทย์ที่อยากแก้ไขเองได้)
          </h2>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-6">
            <h2 className="text-2xl font-semibold text-(--accent-green)" style={{ fontFamily: 'var(--font-kanit)' }}>Agriculture</h2>
            <ol className="mt-4 space-y-3 text-sm text-(--text-secondary)">
              {agricultureIdeas.map((idea) => (
                <li key={idea.title}>
                  <p className="font-semibold text-white">{idea.title}</p>
                  <p className="mt-1 leading-relaxed">{idea.detail}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-6">
            <h2 className="text-2xl font-semibold text-(--accent-cyan)" style={{ fontFamily: 'var(--font-kanit)' }}>Disasters</h2>
            <ol className="mt-4 space-y-3 text-sm text-(--text-secondary)">
              {disasterIdeas.map((idea) => (
                <li key={idea.title}>
                  <p className="font-semibold text-white">{idea.title}</p>
                  <p className="mt-1 leading-relaxed">{idea.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-7">
          <h2 className="text-xl font-semibold text-white sm:text-2xl" style={{ fontFamily: 'var(--font-kanit)' }}>รางวัลการแข่งขัน</h2>
          {enhancedRewards ? (
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rewards.map((reward, index) => (
                <article
                  key={reward.title}
                  className={`group relative overflow-hidden rounded-xl border border-(--border-subtle) bg-(--bg-base) p-4 transition-all duration-300 ${rewardThemes[index]?.hoverClass ?? ''}`}
                  style={{ boxShadow: rewardThemes[index]?.glow }}
                >
                  <div className="relative">
                    <div className={`mb-3 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium ${rewardThemes[index]?.chipClass ?? ''}`}>
                      <span>{rewardThemes[index]?.icon ?? '🏅'}</span>
                      <span>{rewardThemes[index]?.badge ?? `รางวัลที่ ${index + 1}`}</span>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full bg-current ${rewardThemes[index]?.motionClass ?? 'animate-pulse'}`} />
                    </div>

                    {index === 0 && (
                      <div className="mb-3 rounded-lg border border-[rgba(250,204,21,0.35)] bg-[rgba(250,204,21,0.1)] px-2 py-1 text-xs font-medium text-[#fde68a]">
                        อันดับสูงสุดของการแข่งขัน
                      </div>
                    )}

                    <h3 className="text-base font-semibold text-white">{reward.title}</h3>
                    <p className={`mt-3 text-2xl font-bold ${rewardThemes[index]?.amountClass ?? 'text-(--accent-green)'}`}>{reward.prize}</p>
                    <p className="mt-2 text-sm leading-relaxed text-(--text-secondary)">{reward.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-(--text-secondary)">
              <li>รางวัลชนะเลิศ เงินสด 40,000 บาท พร้อมใบประกาศนียบัตรและโล่รางวัล</li>
              <li>รองชนะเลิศอันดับ 1 เงินสด 20,000 บาท พร้อมใบประกาศนียบัตร</li>
              <li>รองชนะเลิศอันดับ 2 เงินสด 10,000 บาท พร้อมใบประกาศนียบัตร</li>
              <li>รางวัลพิเศษ Best AI Model เงินสด 5,000 บาท</li>
              <li>รางวัลพิเศษ Best Visualization เงินสด 5,000 บาท</li>
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-7">
          <h2 className="text-xl font-semibold text-white sm:text-2xl" style={{ fontFamily: 'var(--font-kanit)' }}>
            เกณฑ์การตัดสินรอบแรก
          </h2>
          <div className="mt-4 rounded-xl border border-(--border-subtle) bg-(--bg-base) p-4 sm:p-5">
            <div className="space-y-3">
              {rubricItems.map((item, idx) => (
                <article
                  key={item.title}
                  className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-3 transition-all duration-300 hover:border-(--border-active)"
                >
                  <div className="flex items-start gap-3">
                    <div>
                      <p className="text-xs text-(--text-muted)">หัวข้อที่ {idx + 1}</p>
                      <h3 className="text-sm font-medium text-(--text-primary)">{item.title}</h3>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default function DocsPage() {
  return (
    <AuthProvider>
      <AppShell>
        <DocsContent />
      </AppShell>
    </AuthProvider>
  )
}
