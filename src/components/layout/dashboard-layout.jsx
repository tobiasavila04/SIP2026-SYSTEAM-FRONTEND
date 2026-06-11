import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { useAuth } from '@/providers/auth-provider'
import { useQueryClient } from '@tanstack/react-query'
import { useAccount, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { ERC20_ABI } from '@/lib/abis'
import { API_ENDPOINTS } from '@/config/api'
import { apiRequest } from '@/lib/api-client'

export function DashboardLayout() {
  const sidebarOpen = useAuthStore((s) => s.sidebarOpen)
  const toggleSidebar = useAuthStore((s) => s.toggleSidebar)
  const hasSyncedWallet = useAuthStore((s) => s.hasSyncedWallet)
  const setWalletSynced = useAuthStore((s) => s.setWalletSynced)
  const { logout } = useAuth()
  const queryClient = useQueryClient()

  const { address, isConnected } = useAccount()
  const { data: balanceData, isSuccess } = useReadContract({
    address: import.meta.env.VITE_IDEA_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: isConnected && !hasSyncedWallet && !!address,
    }
  })

  useEffect(() => {
    if (isSuccess && balanceData !== undefined && !hasSyncedWallet) {
      const balance = Number(formatUnits(balanceData, 18))
      apiRequest(API_ENDPOINTS.WALLET_SYNC_IDEA, {
        method: 'POST',
        body: { ideaBalance: balance }
      }).then(() => {
        setWalletSynced()
        queryClient.invalidateQueries({ queryKey: ['wallet', 'summary'] })
      }).catch(err => {
        console.error("Error syncing wallet:", err)
      })
    }
  }, [isSuccess, balanceData, hasSyncedWallet, setWalletSynced, queryClient])

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={!sidebarOpen} onToggle={toggleSidebar} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onLogout={handleLogout} />
        <main id="main-content" className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
