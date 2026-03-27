import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogIn, Shield } from "lucide-react";
import logoDark from "@/assets/logo-dark.png";

const SERVICE_ITEMS = [
  { icon: "💰", title: "Get Business Funding", desc: "Secure $50K–$250K in 0% APR business credit lines", href: "/funding" },
  { icon: "📊", title: "Repair My Credit", desc: "Done-for-you credit restoration in 35–90 days", href: "/credit-repair" },
  { icon: "🎓", title: "Join The Community", desc: "Private Skool network & digital business training", href: "/community" },
  { icon: "📚", title: "Shop Digital Products", desc: "eBooks & resources to accelerate your growth", href: "/store" },
  { icon: "🤝", title: "Become A Partner", desc: "Earn uncapped commissions — free to join", href: "/partners" },
  { icon: "📅", title: "Schedule A Consultation", desc: "1-on-1 strategy session with funding experts", href: "/consultation" },
];

interface NavbarProps {
  /** Which nav item is currently active. Defaults to auto-detect from route. */
  active?: string;
  /** Whether to show the services dropdown. Default: true */
  showServicesDropdown?: boolean;
}

const Navbar = ({ active, showServicesDropdown = true }: NavbarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const currentPath = active || location.pathname;

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const navLinkClass = (path: string) =>
    `nav-link relative text-sm transition-colors ${isActive(path) ? "text-slate-900 font-medium" : "text-slate-600 hover:text-slate-900"}`;

  return (
    <>
      <header className="sticky z-20 top-0 bg-white/70 backdrop-blur-xl border-b border-slate-100">
        <div className="flex max-w-7xl mx-auto py-4 px-4 sm:px-6 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoDark} alt="Ryland Partners" width={189} height={56} className="h-8 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className={navLinkClass("/")}>Home</Link>
            <Link to="/about" className={navLinkClass("/about")}>About</Link>

            {showServicesDropdown ? (
              <div className="relative group">
                <button
                  type="button"
                  className="nav-link relative text-sm text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1 cursor-default bg-transparent border-none p-0"
                >
                  Services
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:rotate-180"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-[540px] h-4" />
                <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+0.75rem)] w-[540px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out translate-y-2 group-hover:translate-y-0 z-50">
                  <div className="bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200 shadow-[0_20px_60px_-15px_rgba(0,58,112,0.25)] p-2 ring-1 ring-black/5">
                    <div className="grid grid-cols-2 gap-1">
                      {SERVICE_ITEMS.map((item) => (
                        <Link
                          key={item.title}
                          to={item.href}
                          className="flex items-start gap-3 rounded-xl px-4 py-3 hover:bg-slate-50 transition-colors group/item"
                        >
                          <span className="text-xl mt-0.5 shrink-0">{item.icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 group-hover/item:text-[#0060A9] transition-colors">{item.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-1 border-t border-slate-100 pt-2 px-4 pb-2">
                      <Link to="/funding" className="text-xs font-medium text-[#0060A9] hover:text-[#003A70] transition-colors inline-flex items-center gap-1">View all services →</Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/funding" className={navLinkClass("/funding")}>Services</Link>
            )}

            <Link to="/community" className={navLinkClass("/community")}>Community</Link>
            <Link to="/store" className={navLinkClass("/store")}>Store</Link>
            <Link
              to="/portal/login"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Partner Portal</span>
            </Link>
            <Link
              to="/portal/admin/login"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </Link>
            <Link to="/contact" className="shiny-cta !py-2 !px-5 !text-sm whitespace-nowrap focus:outline-none">
              <span>Contact</span>
            </Link>
          </nav>

          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile overlay — rendered outside header for full-viewport coverage */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer — rendered outside header */}
      <aside
        className={`mobile-menu fixed z-50 bg-white w-[80%] max-w-sm border-slate-200 border-l p-6 top-0 right-0 bottom-0 ${mobileOpen ? "open" : ""}`}
        aria-label="Mobile menu"
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900">Ryland Partners</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <ul className="mt-6 space-y-4">
          {[
            { to: "/", label: "Home" },
            { to: "/about", label: "About" },
            { to: "/funding", label: "Funding" },
            { to: "/credit-repair", label: "Credit Repair" },
            { to: "/community", label: "Community" },
            { to: "/store", label: "Store" },
            { to: "/partners", label: "Partners" },
          ].map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-lg px-2 py-2 transition-colors ${
                  isActive(item.to)
                    ? "text-slate-900 font-medium hover:bg-slate-100"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            to="/portal/login"
            onClick={() => setMobileOpen(false)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm ring-1 ring-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Partner Portal
          </Link>
          <Link
            to="/portal/admin/login"
            onClick={() => setMobileOpen(false)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm ring-1 ring-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Shield className="w-4 h-4" />
            Admin Portal
          </Link>
          <Link
            to="/contact"
            onClick={() => setMobileOpen(false)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-200 text-slate-900 transition-colors"
          >
            Contact
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Navbar;
