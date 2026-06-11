import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/shared/loading-skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { CreateListingModal } from '@/components/features/marketplace/create-listing-modal'
import { BuyListingModal } from '@/components/features/marketplace/buy-listing-modal'
import { TxHashLink } from '@/components/shared/tx-hash-link'
import { useMarketplaceListings } from '@/hooks/use-marketplace'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp,
  ShoppingCart,
  Tag,
  Loader2,
  AlertCircle
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'

export default function MarketplacePage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [buyingListing, setBuyingListing] = useState(null)
  const { data: listings, isLoading, isError, refetch } = useMarketplaceListings()

  // Filter listings by active status safely
  const activeListings = useMemo(() => {
    if (!listings) return []
    return listings.filter(
      (l) => l.estado === 'ACTIVE' || l.estado === 'ACTIVAS' || l.estado === 'OPEN'
    )
  }, [listings])

  // Parse potential Wei values from blockchain or local simulations
  const parseWei = (val) => {
    if (!val) return 0
    const num = Number(val)
    if (num >= 1e9) return num / 1e18
    return num
  }

  // Depth chart data mapping
  const chartData = useMemo(() => {
    if (activeListings.length === 0) {
      // Fallback simulated depth curve if book is empty
      return [
        { precioTexto: '$1.10', precio: 1.10, volumenExacto: 100, volumenAcumulado: 100 },
        { precioTexto: '$1.15', precio: 1.15, volumenExacto: 150, volumenAcumulado: 250 },
        { precioTexto: '$1.20', precio: 1.20, volumenExacto: 350, volumenAcumulado: 600 },
        { precioTexto: '$1.25', precio: 1.25, volumenExacto: 200, volumenAcumulado: 800 },
        { precioTexto: '$1.35', precio: 1.35, volumenExacto: 400, volumenAcumulado: 1200 },
        { precioTexto: '$1.40', precio: 1.40, volumenExacto: 300, volumenAcumulado: 1500 },
        { precioTexto: '$1.45', precio: 1.45, volumenExacto: 500, volumenAcumulado: 2000 }
      ]
    }
    
    // Group by price to create a Depth Chart
    const depthMap = {}
    activeListings.forEach(l => {
      const p = parseWei(l.precioUnitario ?? l.precioPorToken)
      const qty = parseWei(l.cantidad)
      if (!depthMap[p]) depthMap[p] = 0
      depthMap[p] += qty
    })

    const sortedPrices = Object.keys(depthMap).map(Number).sort((a, b) => a - b)
    
    // Calculate cumulative volume for traditional Depth Chart look
    let cumulative = 0;
    return sortedPrices.map(p => {
      cumulative += depthMap[p];
      return {
        precioTexto: `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        precio: p,
        volumenExacto: depthMap[p],
        volumenAcumulado: cumulative
      }
    })
  }, [activeListings])

  // Price history chart data mapping
  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Marketplace" description="Cargando libro de órdenes..." />
        <Skeleton className="h-[250px] w-full rounded-xl bg-card animate-pulse border border-white/5" />
        <div className="rounded-xl border border-white/5 bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-48 bg-white/5" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full bg-white/5 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error warning view
  if (isError) {
    return (
      <div className="space-y-8">
        <PageHeader title="Marketplace" description="Error al conectar con el mercado" />
        <ErrorState
          message="No se pudo cargar el libro de órdenes del Marketplace. Por favor, intente de nuevo."
          onRetry={refetch}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Marketplace"
        description="Compra y vende sub-tokens de proyectos en el mercado secundario"
      >
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-violet-600 hover:bg-violet-500 text-white font-medium shadow-md shadow-violet-600/10 cursor-pointer"
        >
          + Publicar Venta
        </Button>
      </PageHeader>

      {/* Gráfico del Mercado */}
      <section aria-label="Historial de precios de mercado" className="rounded-xl border border-white/5 bg-card p-6 shadow-lg">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Profundidad de Mercado (Depth Chart)
        </h3>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrecio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
              <XAxis
                dataKey="precioTexto"
                stroke="#475569"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis
                stroke="#475569"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(tick) => tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
                tick={{ fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                labelStyle={{ color: '#10b981', fontWeight: 'bold', marginBottom: '4px' }}
                formatter={(value, name) => [
                  value.toLocaleString(),
                  name === 'volumenAcumulado' ? 'Volumen Acumulado' : 'Volumen Exacto'
                ]}
              />
              <Area
                type="monotone"
                dataKey="volumenAcumulado"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPrecio)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Libro de Órdenes */}
      <section aria-label="Libro de órdenes activas" className="rounded-xl border border-white/5 bg-card p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-4 h-4 text-violet-400" />
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Libro de Órdenes de Venta</h3>
        </div>

        {activeListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-8 h-8 text-slate-600 mb-3" />
            <p className="text-sm text-slate-400 font-medium mb-1">No hay órdenes de venta activas</p>
            <p className="text-xs text-slate-500">Sé el primero en publicar una orden usando el botón superior.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Proyecto</th>
                  <th className="py-3 px-4">Vendedor</th>
                  <th className="py-3 px-4 text-right">Cantidad</th>
                  <th className="py-3 px-4 text-right">Precio Unitario</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Tx</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {activeListings.map((listing, i) => {
                  const id = listing.id
                  const project = listing.projectName ?? `Sub-token #${listing.subtokenId}`
                  const seller = listing.sellerName ?? `Vendedor #${listing.sellerId}`
                  const qty = parseWei(listing.cantidad)
                  const unitPrice = parseWei(listing.precioUnitario ?? listing.precioPorToken)
                  const totalPrice = qty * unitPrice

                  return (
                    <motion.tr
                      key={id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.3 }}
                      className="text-sm text-slate-300 hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="py-4 px-4 font-semibold text-white">{project}</td>
                      <td className="py-4 px-4 text-xs text-slate-400 capitalize">{seller}</td>
                      <td className="py-4 px-4 text-right font-mono">{qty.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right font-mono text-emerald-400 font-medium animate-pulse-subtle">
                        {formatCurrency(unitPrice)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-white">
                        {formatCurrency(totalPrice)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {listing.txHash ? <TxHashLink hash={listing.txHash} /> : <span className="text-xs text-slate-500">-</span>}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => setBuyingListing(listing)}
                          className="bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-600/10 cursor-pointer text-xs h-8 px-4"
                        >
                          <span className="flex items-center gap-1.5">
                            <ShoppingCart className="w-3 h-3" />
                            Comprar
                          </span>
                        </Button>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal de Creación */}
      <CreateListingModal open={modalOpen} onOpenChange={setModalOpen} />

      {/* Modal de Compra */}
      <BuyListingModal 
        open={!!buyingListing} 
        onOpenChange={(val) => !val && setBuyingListing(null)} 
        listing={buyingListing} 
      />
    </div>
  )
}
