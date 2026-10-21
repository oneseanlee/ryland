import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: { user: { id: "user-a" } as { id: string } | null, loading: false, affiliate: null },
  from: vi.fn(),
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => mocks.auth }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from } }));
import { useInquiryClients, useInquiryOrders, useInquiryDocuments, useCheckoutBatches } from "./useInquiryPortal";

function wrapperFor(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.auth.user = { id: "user-a" };
  mocks.auth.loading = false;
});

describe("inquiry read scheduling", () => {
  it.each([
    ["inquiry_clients", useInquiryClients],
    ["inquiry_orders", useInquiryOrders],
    ["inquiry_documents", useInquiryDocuments],
    ["checkout_batches", useCheckoutBatches],
  ] as const)("starts %s without waiting for an affiliate and reuses cached reads", async (table, hook) => {
    mocks.from.mockImplementation(() => ({
      select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
    }));
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: 300000, retry: false } } });
    const wrapper = wrapperFor(client);
    const first = renderHook(() => hook(), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    expect(mocks.from).toHaveBeenCalledWith(table);
    first.unmount();
    const second = renderHook(() => hook(), { wrapper });
    expect(second.result.current.isSuccess).toBe(true);
    expect(mocks.from).toHaveBeenCalledTimes(1);
    second.unmount();
    client.clear();
  });

  it("does not fetch before sign-in and does not share another user's cached orders", async () => {
    mocks.from.mockImplementation(() => ({
      select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
    }));
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: 300000, retry: false } } });
    mocks.auth.user = null;
    const view = renderHook(() => useInquiryOrders(), { wrapper: wrapperFor(client) });
    expect(mocks.from).not.toHaveBeenCalled();
    mocks.auth.user = { id: "user-a" };
    view.rerender();
    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));
    mocks.auth.user = { id: "user-b" };
    view.rerender();
    await waitFor(() => expect(mocks.from).toHaveBeenCalledTimes(2));
    view.unmount();
    client.clear();
  });
});