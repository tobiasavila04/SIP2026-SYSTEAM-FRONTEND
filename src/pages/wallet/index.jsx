import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useWalletSummary, useWalletHistory } from "@/hooks/use-wallet";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/utils";
import {
  Wallet,
  Coins,
  TrendingUp,
  ExternalLink,
  Loader2,
  Calendar,
  RotateCcw,
  History,
  Receipt,
} from "lucide-react";

export default function WalletPage() {
  const { data, isLoading, isError, refetch } = useWalletSummary();

  const [inputDesde, setInputDesde] = useState("");
  const [inputHasta, setInputHasta] = useState("");
  const [typeFilter, setTypeFilter] = useState("TODOS");
  const [queryDesde, setQueryDesde] = useState(null);
  const [queryHasta, setQueryHasta] = useState(null);

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    refetch: refetchHistory,
  } = useWalletHistory(queryDesde, queryHasta);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState message="No se pudo cargar la billetera." onRetry={refetch} />
    );
  }

  const balances = data?.balances ?? {};
  const portfolio = data?.portfolio ?? [];
  const saldoIdea = Number(balances.idea ?? 0);
  const saldoUsdt = Number(balances.usdt ?? 0);
  const valorPortfolio = portfolio.reduce(
    (acc, p) => acc + Number(p.cantidad) * Number(p.precioActual ?? 0),
    0,
  );
  const total = saldoIdea + saldoUsdt + valorPortfolio;

  const handleAplicar = () => {
    setQueryDesde(inputDesde ? `${inputDesde}T00:00:00` : null);
    setQueryHasta(inputHasta ? `${inputHasta}T23:59:59` : null);
  };

  const handleLimpiar = () => {
    setInputDesde("");
    setInputHasta("");
    setTypeFilter("TODOS");
    setQueryDesde(null);
    setQueryHasta(null);
  };

  const filteredHistory = (historyData ?? []).filter((item) => {
    if (typeFilter === "TODOS") return true;
    return item.tipo === typeFilter;
  });

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    const parts = fechaStr.split("T");
    if (parts.length < 1) return "—";
    const dateParts = parts[0].split("-");
    if (dateParts.length !== 3) return "—";
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
  };

  const formatHora = (fechaStr) => {
    if (!fechaStr) return "—";
    const parts = fechaStr.split("T");
    if (parts.length < 2) return "—";
    const timeParts = parts[1].split(":");
    if (timeParts.length < 2) return "—";
    return `${timeParts[0]}:${timeParts[1]}`;
  };

  const typeBadgeMap = {
    COMPRA: {
      label: "Compra",
      classes: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
    },
    VENTA: {
      label: "Venta",
      classes: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    },
    TRANSFERENCIA_ENVIADA: {
      label: "Transferencia enviada",
      classes: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    },
    TRANSFERENCIA_RECIBIDA: {
      label: "Transferencia recibida",
      classes:
        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    },
    DIVIDENDO: {
      label: "Dividendo",
      classes:
        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        icon={Wallet}
        title="Mi Billetera"
        description="Resumen de tu saldo y portfolio de subtokens"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BalanceCard
          icon={Coins}
          label="$IDEA"
          value={`${saldoIdea.toLocaleString()} $IDEA`}
          sub="Token IDEAFY"
          accent="violet"
        />
        <BalanceCard
          icon={TrendingUp}
          label="USDT"
          value={`${saldoUsdt.toLocaleString()} USDT`}
          sub="Stablecoin"
          accent="emerald"
        />
        <BalanceCard
          icon={Wallet}
          label="Total portafolio"
          value={formatCurrency(total)}
          sub="IDEA + USDT + subtokens"
          accent="amber"
        />
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
          <Coins className="w-4 h-4" />
          Mi Portfolio
        </h3>

        <div className="rounded-xl border border-white/5 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            {portfolio.length === 0 ? (
              <EmptyState
                icon={Coins}
                title="No tenés subtokens todavía"
                description="Invertí en un proyecto para recibir subtokens."
              />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-medium">Proyecto</th>
                    <th className="px-4 py-3 font-medium">Subtoken</th>
                    <th className="px-4 py-3 font-medium">Cantidad</th>
                    <th className="px-4 py-3 font-medium">Precio actual</th>
                    <th className="px-4 py-3 font-medium">Valor total</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {portfolio.map((item, i) => {
                    const cantidad = Number(item.cantidad ?? 0);
                    const precio = Number(item.precioActual ?? 0);
                    const valor = cantidad * precio;
                    return (
                      <tr
                        key={item.subtokenId ?? i}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3 text-white font-medium">
                          {item.proyectoNombre ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-white font-medium">
                          {item.subtokenSimbolo
                            ? `$ ${item.subtokenSimbolo}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {cantidad.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {precio > 0 ? `${precio.toFixed(2)} $IDEA` : "—"}
                        </td>
                        <td className="px-4 py-3 text-emerald-300 font-mono font-medium">
                          {valor > 0 ? `${valor.toFixed(2)} $IDEA` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/proyectos/${item.subtokenId}`}
                            className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                          >
                            Ver proyecto
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {portfolio.length > 0 && (
          <p className="text-xs text-slate-500 mt-3 text-right">
            Valor total portfolio:{" "}
            <span className="font-medium text-slate-300">
              {valorPortfolio.toFixed(2)} $IDEA
            </span>
          </p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
          <History className="w-4 h-4" />
          Historial de movimientos
        </h3>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Desde</label>
              <input
                type="date"
                value={inputDesde}
                onChange={(e) => setInputDesde(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Hasta</label>
              <input
                type="date"
                value={inputHasta}
                onChange={(e) => setInputHasta(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Tipo de movimiento
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                  backgroundPosition: "right 0.75rem center",
                  backgroundSize: "1rem",
                  backgroundRepeat: "no-repeat",
                  paddingRight: "2.5rem",
                }}
              >
                <option value="TODOS" className="bg-slate-900">
                  Todos
                </option>
                <option value="COMPRA" className="bg-slate-900">
                  Compra
                </option>
                <option value="VENTA" className="bg-slate-900">
                  Venta
                </option>
                <option value="TRANSFERENCIA_ENVIADA" className="bg-slate-900">
                  Transferencia enviada
                </option>
                <option value="TRANSFERENCIA_RECIBIDA" className="bg-slate-900">
                  Transferencia recibida
                </option>
                <option value="DIVIDENDO" className="bg-slate-900">
                  Dividendo
                </option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAplicar}
              className="flex-1 sm:flex-none bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
            >
              Aplicar
            </button>
            <button
              onClick={handleLimpiar}
              className="flex-1 sm:flex-none bg-white/5 hover:bg-white/10 active:bg-white/15 text-slate-300 rounded-lg px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpiar
            </button>
          </div>
        </div>

        {/* Tabla / Contenido */}
        {isHistoryLoading ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : isHistoryError ? (
          <ErrorState
            message="No se pudo cargar el historial de movimientos."
            onRetry={refetchHistory}
          />
        ) : filteredHistory.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Sin movimientos"
            description="No tenés movimientos en este período"
          />
        ) : (
          <div className="rounded-xl border border-white/5 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Hora</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Descripción</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Monto / Cantidad
                    </th>
                    <th className="px-4 py-3 font-medium text-center">Tx</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredHistory.map((item, index) => {
                    const badge = typeBadgeMap[item.tipo] || {
                      label: item.tipo,
                      classes:
                        "bg-white/5 text-white/70 border border-white/10",
                    };
                    return (
                      <tr
                        key={item.txHash || index}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3 text-white font-medium">
                          {formatFecha(item.fecha)}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {formatHora(item.fecha)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.classes}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {item.descripcion || "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-white">
                          {item.monto !== null && item.monto !== undefined ? (
                            <span className="text-violet-300 font-mono">
                              {item.monto.toLocaleString()} $IDEA
                            </span>
                          ) : item.cantidad !== null &&
                            item.cantidad !== undefined ? (
                            <span className="text-slate-300">
                              {item.cantidad.toLocaleString()} tokens
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.txHash ? (
                            <a
                              href={`https://sepolia.etherscan.io/tx/${item.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-violet-400 hover:text-violet-300 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function BalanceCard({ icon: Icon, label, value, sub, accent }) {
  const gradientMap = {
    violet: "from-violet-500/10 to-violet-600/5 border-violet-500/20",
    emerald: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20",
    amber: "from-amber-500/10 to-amber-600/5 border-amber-500/20",
  };
  const iconMap = {
    violet: "text-violet-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
  };

  return (
    <div
      className={`p-5 rounded-xl bg-gradient-to-b ${gradientMap[accent]} border`}
    >
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
        <Icon className={`w-4 h-4 ${iconMap[accent]}`} />
        {label}
      </div>
      <p className="text-xl font-bold text-white mb-1">{value}</p>
      <p className="text-[11px] text-slate-500">{sub}</p>
    </div>
  );
}
