import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/shared/types'

/**
 * contractRules.md §33 — 409는 게임 상태가 바뀌었다는 신호이지 장애가 아니다.
 * 재시도하지 말고 최신 상태를 다시 조회해 화면을 옮긴다.
 * 권한 오류도 재시도 대상이 아니다.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000,
      retry: (failureCount, error) => {
        if (isApiError(error) && (error.isConflict || error.isAuthError)) {
          return false
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
    },
  },
})
