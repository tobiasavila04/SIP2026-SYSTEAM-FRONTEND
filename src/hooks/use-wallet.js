import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/api";

export function useWalletSummary() {
  return useQuery({
    queryKey: ["wallet", "summary"],
    queryFn: () => apiRequest(API_ENDPOINTS.WALLET_SUMMARY),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

export function useTransferTokens() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) =>
      apiRequest(API_ENDPOINTS.WALLET_TRANSFER, {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })
}

export function useWalletHistory(desde, hasta) {
  return useQuery({
    queryKey: ["wallet", "history", desde, hasta],
    queryFn: () => {
      const params = new URLSearchParams();
      if (desde !== null && desde !== undefined) params.append("desde", desde);
      if (hasta !== null && hasta !== undefined) params.append("hasta", hasta);
      const queryString = params.toString();
      const url = `${API_ENDPOINTS.WALLET_MOVEMENT_HISTORY}${queryString ? `?${queryString}` : ""}`;
      return apiRequest(url);
    },
    staleTime: 10_000,
  });
}
