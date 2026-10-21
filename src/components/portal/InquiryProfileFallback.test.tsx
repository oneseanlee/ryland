import { cleanup, render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const role = vi.hoisted(() => ({ isAdmin: false, isLoading: false }));
vi.mock("@/hooks/useAdminRole", () => ({ useAdminRole: () => role }));
import InquiryProfileFallback from "./InquiryProfileFallback";

afterEach(() => {
  cleanup();
  role.isAdmin = false;
  role.isLoading = false;
});

describe("inquiry navigation without an affiliate profile", () => {
  function openInquiry() {
    const visited = vi.fn();
    function LocationObserver() {
      visited(useLocation().pathname);
      return null;
    }
    render(
      <MemoryRouter initialEntries={["/portal/inquiries"]}>
        <LocationObserver />
        <Routes>
          <Route path="/portal/inquiries" element={<InquiryProfileFallback />} />
          <Route path="/portal/admin/inquiries" element={<div />} />
        </Routes>
      </MemoryRouter>
    );
    return visited;
  }

  it("sends an admin with no affiliate profile to admin inquiry orders", async () => {
    role.isAdmin = true;
    const visited = openInquiry();
    await waitFor(() => expect(visited).toHaveBeenLastCalledWith("/portal/admin/inquiries"));
  });

  it("does not redirect a partner to admin orders", () => {
    const visited = openInquiry();
    expect(visited).toHaveBeenLastCalledWith("/portal/inquiries");
  });

  it("waits for the role check before redirecting", () => {
    role.isAdmin = true;
    role.isLoading = true;
    const visited = openInquiry();
    expect(visited).toHaveBeenLastCalledWith("/portal/inquiries");
  });
});