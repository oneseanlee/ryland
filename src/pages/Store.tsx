import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Loader2, BookOpen, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { CartDrawer } from "@/components/CartDrawer";
import { useCartStore } from "@/stores/cartStore";
import { storefrontApiRequest, STOREFRONT_PRODUCTS_QUERY, type ShopifyProduct } from "@/lib/shopify";
import { motion } from "framer-motion";
import InfiniteGrid from "@/components/ui/infinite-grid";
import Footer from "@/components/Footer";
import FeaturedBundles from "@/components/FeaturedBundles";
import StoreHero from "@/components/store/StoreHero";
import TrustStrip from "@/components/store/TrustStrip";
import SocialProofStrip from "@/components/store/SocialProofStrip";
import WhyChooseUs from "@/components/store/WhyChooseUs";
import PreFooterCTA from "@/components/store/PreFooterCTA";
import ProductCard from "@/components/store/ProductCard";
import Navbar from "@/components/Navbar";

import PageMeta from "@/components/PageMeta";
import JsonLd, { breadcrumbSchema } from "@/components/JsonLd";

const BUNDLES = [
  { id: "credit-authority", tag: "Business Authority Bundle", name: "Business Authority Bundle", tagline: "Premium blueprints and lender lists to dominate business credit" },
  { id: "credit-accelerator", tag: "Entrepreneur Accelerator", name: "Entrepreneur Accelerator", tagline: "Essential DIY guides and workbooks for financial mastery" },
  { id: "credit-funding", tag: "Business Funding Essentials", name: "Business Funding Essentials", tagline: "Advanced strategies to secure $50K–$250K+ in business capital" },
  { id: "credit-quickstart", tag: "Entrepreneur Quickstart", name: "Entrepreneur Quickstart", tagline: "Get started with business credit in days, not months" },
  { id: "ultimate-bundle", tag: "Ultimate Business Education Bundle", name: "Ultimate Business Education Bundle", tagline: "The complete 18-resource library for total business transformation" },
  { id: "standalone", tag: "Standalone", name: "Standalone Guides", tagline: "Specialized guides for homebuying and financial optimization" },
];

const Store = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBundle, setActiveBundle] = useState(BUNDLES[0].id);
  const addItem = useCartStore(state => state.addItem);
  const isLoading = useCartStore(state => state.isLoading);
  const openCart = useCartStore(state => state.openCart);
  const cartItems = useCartStore(state => state.items);
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const productGridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await storefrontApiRequest(STOREFRONT_PRODUCTS_QUERY, { first: 250 });
        setProducts(data?.data?.products?.edges || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = async (product: ShopifyProduct) => {
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
    toast.success("Added to cart", { description: product.node.title });
    openCart();
  };

  const scrollToBundle = (bundleId: string) => {
    setActiveBundle(bundleId);
    sectionRefs.current[bundleId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToProducts = () => {
    productGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const getProductsForBundle = (tag: string) =>
    products.filter(p => p.node.tags.includes(tag));

  return (
    <div className="min-h-screen bg-slate-50 font-[Manrope,sans-serif]">
      
      <PageMeta
        title="Digital Education Store | Ryland Partners"
        description="Browse eBooks, guides, and resources for business education, funding strategy, and financial literacy."
        canonical="/store"
      />
      <JsonLd
        id="store-breadcrumb"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Store", path: "/store" },
        ])}
      />
      <Navbar />

      {/* Hero */}
      <StoreHero onBrowse={scrollToProducts} />

      {/* Trust Strip */}
      <TrustStrip />

      {/* Social Proof Strip */}
      <SocialProofStrip />

      {/* Featured Bundles Showcase */}
      <FeaturedBundles onScrollToBundle={scrollToBundle} />

      {/* Bundle Navigation with Cart CTA */}
      <div ref={productGridRef} className="sticky top-[65px] z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 scroll-mt-[65px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
              {BUNDLES.map(bundle => (
                <button
                  key={bundle.id}
                  onClick={() => scrollToBundle(bundle.id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                    activeBundle === bundle.id
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/25"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {bundle.name}
                </button>
              ))}
            </div>
            {totalCartItems > 0 && (
              <CartDrawer />
            )}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="relative">
        <div className="absolute inset-0 z-0">
          <InfiniteGrid />
        </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">No products found</h2>
            <p className="text-slate-500">Check back soon for new ebooks and guides.</p>
          </div>
        ) : (
          <div className="space-y-24">
            {BUNDLES.map((bundle) => {
              const bundleProducts = getProductsForBundle(bundle.tag);
              if (bundleProducts.length === 0) return null;
              return (
                <section
                  key={bundle.id}
                  ref={(el) => { sectionRefs.current[bundle.id] = el; }}
                  className="scroll-mt-36"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                  >
                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-3">
                      {bundleProducts.length} {bundleProducts.length === 1 ? "Product" : "Products"}
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-2">
                      {bundle.name}
                    </h2>
                    <p className="text-slate-500 text-base sm:text-lg max-w-2xl">
                      {bundle.tagline}
                    </p>
                  </motion.div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {bundleProducts.map((product, idx) => (
                      <ProductCard
                        key={product.node.id}
                        product={product}
                        index={idx}
                        onAddToCart={handleAddToCart}
                        isLoading={isLoading}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
      </div>

      {/* FAQ + Guarantee */}
      <WhyChooseUs onBrowse={scrollToProducts} />

      {/* Pre-Footer CTA */}
      <PreFooterCTA onBrowse={scrollToProducts} />

      <Footer />
    </div>
  );
};

export default Store;
