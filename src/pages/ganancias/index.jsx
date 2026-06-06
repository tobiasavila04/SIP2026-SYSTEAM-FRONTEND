import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePermissions } from '@/stores/auth-store'
import { PageHeader } from '@/components/shared/page-header'
import { CreatorEarningsTab } from '@/components/features/ganancias/creator-earnings-tab'
import { InvestorEarningsTab } from '@/components/features/ganancias/investor-earnings-tab'
import { cn } from '@/lib/utils'

const TAB_CREATOR = 'mis-proyectos'
const TAB_INVESTOR = 'mis-inversiones'

export default function GananciasPage() {
  const { isCreator, isInvestor } = usePermissions()

  const [activeTab, setActiveTab] = useState(isCreator ? TAB_CREATOR : TAB_INVESTOR)

  if (!isCreator && !isInvestor) {
    return <Navigate to="/dashboard" replace />
  }

  const showBothTabs = isCreator && isInvestor

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        title="Ganancias"
        description="Visualizá y reclamá los dividendos de tus proyectos e inversiones"
      />

      {showBothTabs && (
        <div className="flex gap-1 border-b border-white/5">
          <button
            onClick={() => setActiveTab(TAB_CREATOR)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-all',
              activeTab === TAB_CREATOR
                ? 'bg-violet-600/15 text-violet-300 border-b-2 border-violet-500'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Mis Proyectos
          </button>
          <button
            onClick={() => setActiveTab(TAB_INVESTOR)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-all',
              activeTab === TAB_INVESTOR
                ? 'bg-violet-600/15 text-violet-300 border-b-2 border-violet-500'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Mis Inversiones
          </button>
        </div>
      )}

      {/* Render the correct tab. For single-role users, always show their tab. */}
      {isCreator && (!showBothTabs || activeTab === TAB_CREATOR) && <CreatorEarningsTab />}
      {isInvestor && (!showBothTabs || activeTab === TAB_INVESTOR) && <InvestorEarningsTab />}
    </motion.div>
  )
}
