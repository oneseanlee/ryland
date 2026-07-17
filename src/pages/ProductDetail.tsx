import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, BookOpen, ArrowLeft, CheckCircle2, FileText, Layers, Tag, ShoppingBag, Shield, Zap } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CartDrawer } from "@/components/CartDrawer";
import { useCartStore } from "@/stores/cartStore";
import { storefrontApiRequest, PRODUCT_BY_HANDLE_QUERY, type ShopifyProduct } from "@/lib/shopify";
import { productContentMap } from "@/data/productContent";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";


import listingUbcb1 from "@/assets/listing-ubcb-1.png";
import listingUbcb2 from "@/assets/listing-ubcb-2.png";
import listingFp1 from "@/assets/listing-fp-1.png";
import listingFp2 from "@/assets/listing-fp-2.png";
import listingCips1 from "@/assets/listing-cips-1.png";
import listingCips2 from "@/assets/listing-cips-2.png";
import listingSch1 from "@/assets/listing-sch-1.png";
import listingSch2 from "@/assets/listing-sch-2.png";
import listingAdlp1 from "@/assets/listing-adlp-1.png";
import listingAdlp2 from "@/assets/listing-adlp-2.png";
import listingUccll1 from "@/assets/listing-uccll-1.png";
import listingUccll2 from "@/assets/listing-uccll-2.png";
import listingUcp1 from "@/assets/listing-ucp-1.png";
import listingUcp2 from "@/assets/listing-ucp-2.png";
import listingDcrw1 from "@/assets/listing-dcrw-1.png";
import listingMmw1 from "@/assets/listing-mmw-1.png";
import listingMmw2 from "@/assets/listing-mmw-2.png";
import listingSlpp1 from "@/assets/listing-slpp-1.png";
import listingSlpp2 from "@/assets/listing-slpp-2.png";
import listingC100k1 from "@/assets/listing-c100k-1.png";
import listingFlsw1 from "@/assets/listing-flsw-1.png";
import listingFlsw2 from "@/assets/listing-flsw-2.png";
import listing13wpod1 from "@/assets/listing-13wpod-1.png";
import listing23mwh1 from "@/assets/listing-23mwh-1.png";
import listingDcmg1 from "@/assets/listing-dcmg-1.png";
import listingUbccp1 from "@/assets/listing-ubccp-1.png";
import listingUbccp2 from "@/assets/listing-ubccp-2.png";
import listingFf1 from "@/assets/listing-ff-1.png";
import listingFf2 from "@/assets/listing-ff-2.png";
import listingVfein1 from "@/assets/listing-vfein-1.png";
import listingVfein2 from "@/assets/listing-vfein-2.png";
import listingBfasc1 from "@/assets/listing-bfasc-1.png";
import listingBfasc2 from "@/assets/listing-bfasc-2.png";
import listing150k1 from "@/assets/listing-150k-1.png";
import listing150k2 from "@/assets/listing-150k-2.png";
import listingFtva1 from "@/assets/listing-ftva-1.png";
import listingFtva2 from "@/assets/listing-ftva-2.png";
import listingUhh1 from "@/assets/listing-uhh-1.png";
import listingUhh2 from "@/assets/listing-uhh-2.png";
import listingSld1 from "@/assets/listing-sld-1.png";
import listingSld2 from "@/assets/listing-sld-2.png";
import listingRe1 from "@/assets/listing-re-1.png";
import listingRe2 from "@/assets/listing-re-2.png";
import listingMyc1 from "@/assets/listing-myc-1.png";
import listingMyc2 from "@/assets/listing-myc-2.png";
import listingMst1 from "@/assets/listing-mst-1.png";
import listingMst2 from "@/assets/listing-mst-2.png";
import listingLprg1 from "@/assets/listing-lprg-1.png";
import listingLprg2 from "@/assets/listing-lprg-2.png";
import listingCst1 from "@/assets/listing-cst-1.png";
import listingCst2 from "@/assets/listing-cst-2.png";
import listingIrg1 from "@/assets/listing-irg-1.png";
import listingIrg2 from "@/assets/listing-irg-2.png";
import listingCrsp1 from "@/assets/listing-crsp-1.png";
import listingCrsp2 from "@/assets/listing-crsp-2.png";
import listingCsa1 from "@/assets/listing-csa-1.png";
import listingCsa2 from "@/assets/listing-csa-2.png";
import listingCrm1 from "@/assets/listing-crm-1.png";
import listingCrm2 from "@/assets/listing-crm-2.png";
import listingCrsm1 from "@/assets/listing-crsm-1.png";
import listingCrsm2 from "@/assets/listing-crsm-2.png";
import listingCrlr1 from "@/assets/listing-crlr-1.png";
import listingCrlr2 from "@/assets/listing-crlr-2.png";
import listingCrcgpt1 from "@/assets/listing-crcgpt-1.png";
import listingCrcgpt2 from "@/assets/listing-crcgpt-2.png";
import listingCbrl1 from "@/assets/listing-cbrl-1.png";
import listingCbrl2 from "@/assets/listing-cbrl-2.png";
import listingBrb1 from "@/assets/listing-brb-1.png";
import listingBrb2 from "@/assets/listing-brb-2.png";
import listingDlt1 from "@/assets/listing-dlt-1.png";
import listingDlt2 from "@/assets/listing-dlt-2.png";
import listingUbc1 from "@/assets/listing-ubc-1.png";
import listingUbc2 from "@/assets/listing-ubc-2.png";
import listingFn301 from "@/assets/listing-fn30-1.png";
import listingFn302 from "@/assets/listing-fn30-2.png";
import listingEbcc1 from "@/assets/listing-ebcc-1.png";
import listingEbcc2 from "@/assets/listing-ebcc-2.png";
import listingBcb1 from "@/assets/listing-bcb-1.png";
import listingBcb2 from "@/assets/listing-bcb-2.png";
import listing13wpod2 from "@/assets/listing-13wpod-2.png";
import listing23mwh2 from "@/assets/listing-23mwh-2.png";
import listingC100k2 from "@/assets/listing-c100k-2.png";
import listingDcmg2 from "@/assets/listing-dcmg-2.png";
import listingDcrw2 from "@/assets/listing-dcrw-2.png";

const promoImageImports: Record<string, string> = {
  "/src/assets/listing-ubcb-1.png": listingUbcb1,
  "/src/assets/listing-ubcb-2.png": listingUbcb2,
  "/src/assets/listing-fp-1.png": listingFp1,
  "/src/assets/listing-fp-2.png": listingFp2,
  "/src/assets/listing-cips-1.png": listingCips1,
  "/src/assets/listing-cips-2.png": listingCips2,
  "/src/assets/listing-sch-1.png": listingSch1,
  "/src/assets/listing-sch-2.png": listingSch2,
  "/src/assets/listing-adlp-1.png": listingAdlp1,
  "/src/assets/listing-adlp-2.png": listingAdlp2,
  "/src/assets/listing-uccll-1.png": listingUccll1,
  "/src/assets/listing-uccll-2.png": listingUccll2,
  "/src/assets/listing-ucp-1.png": listingUcp1,
  "/src/assets/listing-ucp-2.png": listingUcp2,
  "/src/assets/listing-dcrw-1.png": listingDcrw1,
  "/src/assets/listing-dcrw-2.png": listingDcrw2,
  "/src/assets/listing-mmw-1.png": listingMmw1,
  "/src/assets/listing-mmw-2.png": listingMmw2,
  "/src/assets/listing-slpp-1.png": listingSlpp1,
  "/src/assets/listing-slpp-2.png": listingSlpp2,
  "/src/assets/listing-c100k-1.png": listingC100k1,
  "/src/assets/listing-c100k-2.png": listingC100k2,
  "/src/assets/listing-flsw-1.png": listingFlsw1,
  "/src/assets/listing-flsw-2.png": listingFlsw2,
  "/src/assets/listing-13wpod-1.png": listing13wpod1,
  "/src/assets/listing-13wpod-2.png": listing13wpod2,
  "/src/assets/listing-23mwh-1.png": listing23mwh1,
  "/src/assets/listing-23mwh-2.png": listing23mwh2,
  "/src/assets/listing-dcmg-1.png": listingDcmg1,
  "/src/assets/listing-dcmg-2.png": listingDcmg2,
  "/src/assets/listing-ubccp-1.png": listingUbccp1,
  "/src/assets/listing-ubccp-2.png": listingUbccp2,
  "/src/assets/listing-ff-1.png": listingFf1,
  "/src/assets/listing-ff-2.png": listingFf2,
  "/src/assets/listing-vfein-1.png": listingVfein1,
  "/src/assets/listing-vfein-2.png": listingVfein2,
  "/src/assets/listing-bfasc-1.png": listingBfasc1,
  "/src/assets/listing-bfasc-2.png": listingBfasc2,
  "/src/assets/listing-150k-1.png": listing150k1,
  "/src/assets/listing-150k-2.png": listing150k2,
  "/src/assets/listing-ftva-1.png": listingFtva1,
  "/src/assets/listing-ftva-2.png": listingFtva2,
  "/src/assets/listing-uhh-1.png": listingUhh1,
  "/src/assets/listing-uhh-2.png": listingUhh2,
  "/src/assets/listing-sld-1.png": listingSld1,
  "/src/assets/listing-sld-2.png": listingSld2,
  "/src/assets/listing-re-1.png": listingRe1,
  "/src/assets/listing-re-2.png": listingRe2,
  "/src/assets/listing-myc-1.png": listingMyc1,
  "/src/assets/listing-myc-2.png": listingMyc2,
  "/src/assets/listing-mst-1.png": listingMst1,
  "/src/assets/listing-mst-2.png": listingMst2,
  "/src/assets/listing-lprg-1.png": listingLprg1,
  "/src/assets/listing-lprg-2.png": listingLprg2,
  "/src/assets/listing-cst-1.png": listingCst1,
  "/src/assets/listing-cst-2.png": listingCst2,
  "/src/assets/listing-irg-1.png": listingIrg1,
  "/src/assets/listing-irg-2.png": listingIrg2,
  "/src/assets/listing-crsp-1.png": listingCrsp1,
  "/src/assets/listing-crsp-2.png": listingCrsp2,
  "/src/assets/listing-csa-1.png": listingCsa1,
  "/src/assets/listing-csa-2.png": listingCsa2,
  "/src/assets/listing-crm-1.png": listingCrm1,
  "/src/assets/listing-crm-2.png": listingCrm2,
  "/src/assets/listing-crsm-1.png": listingCrsm1,
  "/src/assets/listing-crsm-2.png": listingCrsm2,
  "/src/assets/listing-crlr-1.png": listingCrlr1,
  "/src/assets/listing-crlr-2.png": listingCrlr2,
  "/src/assets/listing-crcgpt-1.png": listingCrcgpt1,
  "/src/assets/listing-crcgpt-2.png": listingCrcgpt2,
  "/src/assets/listing-cbrl-1.png": listingCbrl1,
  "/src/assets/listing-cbrl-2.png": listingCbrl2,
  "/src/assets/listing-brb-1.png": listingBrb1,
  "/src/assets/listing-brb-2.png": listingBrb2,
  "/src/assets/listing-dlt-1.png": listingDlt1,
  "/src/assets/listing-dlt-2.png": listingDlt2,
  "/src/assets/listing-ubc-1.png": listingUbc1,
  "/src/assets/listing-ubc-2.png": listingUbc2,
  "/src/assets/listing-fn30-1.png": listingFn301,
  "/src/assets/listing-fn30-2.png": listingFn302,
  "/src/assets/listing-ebcc-1.png": listingEbcc1,
  "/src/assets/listing-ebcc-2.png": listingEbcc2,
  "/src/assets/listing-bcb-1.png": listingBcb1,
  "/src/assets/listing-bcb-2.png": listingBcb2,
};

const ProductDetail = () => {
  const { handle } = useParams<{ handle: string }>();
  const [product, setProduct] = useState<ShopifyProduct["node"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const addItem = useCartStore(state => state.addItem);
  const isLoading = useCartStore(state => state.isLoading);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
        setProduct(data?.data?.productByHandle || null);
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [handle]);

  const handleAddToCart = async () => {
    if (!product) return;
    const variant = product.variants.edges[selectedVariantIdx]?.node;
    if (!variant) return;
    await addItem({
      product: { node: product },
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
    toast.success("Added to cart", { description: product.title });
    useCartStore.getState().openCart();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <BookOpen className="w-16 h-16 text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Product not found</h2>
        <Link to="/store" className="text-primary hover:underline mt-4">Back to Store</Link>
      </div>
    );
  }

  const content = handle ? productContentMap[handle] : null;
  const variant = product.variants.edges[selectedVariantIdx]?.node;
  const mainImage = product.images.edges[0]?.node;
  const price = variant ? parseFloat(variant.price.amount) : parseFloat(product.priceRange.minVariantPrice.amount);

  // Build gallery: main shopify image + promo images
  const galleryImages: { url: string; alt: string }[] = [];
  if (mainImage) galleryImages.push({ url: mainImage.url, alt: mainImage.altText || product.title });
  if (content?.promoImages) {
    content.promoImages.forEach((path, i) => {
      const resolved = promoImageImports[path] || path;
      galleryImages.push({ url: resolved, alt: `${product.title} - Image ${i + 2}` });
    });
  }

  const activeImage = galleryImages[selectedImageIdx] || galleryImages[0];

  return (
    <div className="min-h-screen bg-slate-50 font-[Manrope,sans-serif]">
      <PageMeta
        title={`${product.title} | Ryland Partners Store`}
        description={content?.headline || product.description?.slice(0, 160) || "Digital product from Ryland Partners."}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            description: content?.headline || product.description || undefined,
            image: mainImage?.url,
            offers: {
              "@type": "Offer",
              price: price.toFixed(2),
              priceCurrency: variant?.price?.currencyCode || product.priceRange.minVariantPrice.currencyCode || "USD",
              availability: "https://schema.org/InStock",
              url: typeof window !== "undefined" ? window.location.href : undefined,
            },
          }),
        }}
      />
      
      <Navbar />

      {/* Cart bar + Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3 pb-1 flex items-center justify-between">
        <Link to="/store" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>
        <CartDrawer />
      </div>

      {/* Hero section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Product image gallery */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-gradient-to-br from-[#003A70] to-[#0060A9] rounded-3xl overflow-hidden flex items-center justify-center p-4 lg:p-6 shadow-2xl shadow-blue-900/20">
              {activeImage ? (
                <img
                  src={activeImage.url}
                  srcSet={
                    activeImage.url.includes('shopify.com')
                      ? `${activeImage.url}&width=400 400w, ${activeImage.url}&width=600 600w, ${activeImage.url}&width=800 800w, ${activeImage.url}&width=1200 1200w`
                      : undefined
                  }
                  sizes={activeImage.url.includes('shopify.com') ? "(max-width: 768px) 90vw, 50vw" : undefined}
                  alt={activeImage.alt}
                  className="w-full h-full object-contain drop-shadow-2xl rounded-2xl"
                />
              ) : (
                <BookOpen className="w-24 h-24 text-white/30" />
              )}
            </div>

            {/* Thumbnail strip */}
            {galleryImages.length > 1 && (
              <div className="flex gap-3 mt-4">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIdx(i)}
                    className={`w-16 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      i === selectedImageIdx
                        ? "border-blue-600 shadow-md"
                        : "border-slate-200 hover:border-slate-300 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col"
          >
            {content && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
                <Tag className="w-3.5 h-3.5" />
                {content.details.category}
              </span>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-slate-900 leading-tight mb-4 tracking-tight">
              {product.title}
            </h1>

            {content && (
              <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed mb-6">
                {content.headline}
              </p>
            )}

            <p className="text-slate-500 leading-relaxed mb-8">
              {content?.description || product.description}
            </p>

            {/* Price + CTA */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
              <div className="flex items-end gap-3 mb-5">
                <span className="text-4xl font-black text-slate-900">${price.toFixed(0)}</span>
                <div className="flex items-center gap-1.5 pb-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">Instant Download</span>
                </div>
              </div>

              {/* Variant selection */}
              {product.variants.edges.length > 1 && (
                <div className="mb-5">
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Format</label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.edges.map((v, i) => (
                      <button
                        key={v.node.id}
                        onClick={() => setSelectedVariantIdx(i)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                          i === selectedVariantIdx
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {v.node.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleAddToCart}
                disabled={isLoading || !variant?.availableForSale}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-xl text-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/25"
              >
                <ShoppingBag className="w-5 h-5" />
                {isLoading ? "Adding..." : !variant?.availableForSale ? "Sold Out" : "Get Instant Access"}
              </button>

              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Secure Checkout</span>
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Instant Delivery</span>
              </div>
            </div>

            {/* Compact Product Details - inline */}
            {content && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <FileText className="w-4 h-4 text-blue-600 mx-auto mb-1.5" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Format</p>
                  <p className="text-sm font-bold text-slate-900">{content.details.format}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <Layers className="w-4 h-4 text-blue-600 mx-auto mb-1.5" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Length</p>
                  <p className="text-sm font-bold text-slate-900">{content.details.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <Tag className="w-4 h-4 text-blue-600 mx-auto mb-1.5" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Category</p>
                  <p className="text-sm font-bold text-slate-900 text-[11px]">{content.details.category}</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Rich content sections — only if we have curated content */}
      {content && (
        <>
          {/* What You'll Get */}
          <section className="bg-white border-y border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-10 tracking-tight">
                  What You'll Get
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {content.benefits.map((benefit, i) => {
                    const [bold, ...rest] = benefit.split(" – ");
                    const desc = rest.join(" – ");
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: i * 0.08 }}
                        className="flex items-start gap-3 bg-slate-50 rounded-xl p-5 border border-slate-100"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900">{bold}</span>
                          {desc && <span className="text-slate-500"> – {desc}</span>}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </section>

          {/* What's Included — Bundle only */}
          {content.bundleIncludes && content.bundleIncludes.length > 0 && (
            <section className="bg-gradient-to-br from-blue-50 to-slate-50 border-y border-slate-200">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
                    What's Included
                  </h2>
                  <p className="text-slate-500 mb-8">
                    {content.bundleIncludes.length} premium guides — individually valued at {content.bundleValue}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {content.bundleIncludes.map((item, i) => (
                      <motion.div
                        key={item.handle}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: i * 0.06 }}
                      >
                        <Link
                          to={`/product/${item.handle}`}
                          className="flex items-center gap-4 bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 text-sm leading-snug group-hover:text-blue-700 transition-colors truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">Individual price: {item.price}</p>
                          </div>
                          <ArrowLeft className="w-4 h-4 text-slate-300 rotate-180 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </section>
          )}

          {/* Why You Need This */}
          {content.whyYouNeedThis && content.whyYouNeedThis.length > 0 && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-10 tracking-tight">
                  Why You Need This
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {content.whyYouNeedThis.map((reason, i) => {
                    const [bold, ...rest] = reason.split(" – ");
                    const desc = rest.join(" – ");
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: i * 0.08 }}
                        className="flex items-start gap-3 bg-blue-50 rounded-xl p-5 border border-blue-100"
                      >
                        <Zap className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900">{bold}</span>
                          {desc && <span className="text-slate-500"> – {desc}</span>}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </section>
          )}

          {/* Bottom CTA */}
          <section className="bg-gradient-to-br from-[#001228] to-[#003A70] py-16">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
                Ready to Take Control?
              </h2>
              <p className="text-blue-200/80 mb-8 max-w-xl mx-auto">
                Get instant access to {product.title} and start transforming your financial future today.
              </p>
              <button
                onClick={handleAddToCart}
                disabled={isLoading || !variant?.availableForSale}
                className="bg-white text-slate-900 hover:bg-blue-50 px-8 py-4 rounded-xl text-lg font-bold transition-all disabled:opacity-50 inline-flex items-center gap-2.5 shadow-xl"
              >
                <ShoppingBag className="w-5 h-5" />
                Get Instant Access — ${price.toFixed(0)}
              </button>
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  );
};

export default ProductDetail;
