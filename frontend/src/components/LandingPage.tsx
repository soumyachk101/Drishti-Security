import Navbar from './Navbar'
import HeroSection from './HeroSection'
import LandingSections from './LandingSections'

interface LandingPageProps {
  onStartScan: (target: string) => void
  onLoadDemo: () => void
  loading: boolean
}

export default function LandingPage({ onStartScan, onLoadDemo, loading }: LandingPageProps) {
  return (
    <div className="bg-hero-bg min-h-screen">
      <Navbar />
      <HeroSection onStartScan={onStartScan} onLoadDemo={onLoadDemo} loading={loading} />
      <LandingSections onStartScan={onStartScan} onLoadDemo={onLoadDemo} loading={loading} />
    </div>
  )
}

