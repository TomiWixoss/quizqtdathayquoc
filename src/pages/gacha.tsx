import { Page } from "zmp-ui";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Users,
  ShoppingCart,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  getGachaCollections,
  type GachaCollection,
} from "@/services/gacha-service";

const ITEMS_PER_PAGE = 6;

function GachaPage() {
  const [collections, setCollections] = useState<GachaCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      // Đọc từ Firestore thay vì API trực tiếp
      const data = await getGachaCollections();
      setCollections(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Không thể tải dữ liệu. Nhấn để thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const totalPages = Math.ceil(collections.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = collections.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("vi-VN");
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  // Get high quality image from Bilibili CDN
  const getHQImage = (url: string) => {
    if (!url) return "";
    // Add @400w suffix for 400px width, good quality for mobile
    if (url.includes("hdslb.com")) {
      return url + "@400w_400h_1c.webp";
    }
    return url;
  };

  return (
    <Page className="bg-background min-h-screen">
      {/* Header - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-50 pt-12 pb-4 px-4 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-white" />
          <h1 className="font-bold text-xl text-white">Gacha</h1>
        </div>
        <p className="text-white/80 text-sm mt-1">Bộ sưu tập thẻ số</p>
      </div>

      {/* Content */}
      <div className="px-4 pt-32 pb-28">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[var(--duo-purple)] animate-spin" />
            <p className="text-[var(--muted-foreground)] mt-3">Đang tải...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[var(--duo-red)] mb-4">{error}</p>
            <button
              onClick={fetchCollections}
              className="btn-3d btn-3d-purple px-4 py-2"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-2 gap-3">
              {currentItems.map((item) => (
                <div key={item.id} className="card-3d overflow-hidden">
                  <div className="aspect-square relative bg-[var(--secondary)]">
                    <img
                      src={getHQImage(item.act_square_img)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2.5">
                    <h3 className="font-bold text-sm text-foreground line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                      {formatDate(item.startTime)}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--muted-foreground)]">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{formatNumber(item.totalPreorderCount)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ShoppingCart className="w-3 h-3" />
                        <span>{formatNumber(item.totalPurchaseCount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="space-y-3 mt-6">
                {/* Navigation buttons */}
                <div className="flex items-center justify-center gap-1.5">
                  {/* First page */}
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl bg-[var(--secondary)] disabled:opacity-40"
                  >
                    <ChevronsLeft className="w-4 h-4 text-foreground" />
                  </button>

                  {/* Previous */}
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl bg-[var(--secondary)] disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4 text-foreground" />
                  </button>

                  {/* Page indicator */}
                  <div className="px-3 py-2 rounded-xl bg-[var(--duo-purple)] text-white font-bold text-sm min-w-[80px] text-center">
                    {currentPage} / {totalPages}
                  </div>

                  {/* Next */}
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl bg-[var(--secondary)] disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4 text-foreground" />
                  </button>

                  {/* Last page */}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl bg-[var(--secondary)] disabled:opacity-40"
                  >
                    <ChevronsRight className="w-4 h-4 text-foreground" />
                  </button>
                </div>

                {/* Quick jump */}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Đi tới:
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= totalPages) {
                        setCurrentPage(val);
                      }
                    }}
                    className="w-16 px-2 py-1.5 rounded-lg bg-[var(--secondary)] text-foreground text-center text-sm font-bold"
                  />
                </div>

                {/* Info */}
                <p className="text-center text-xs text-[var(--muted-foreground)]">
                  {collections.length} bộ sưu tập
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Page>
  );
}

export default GachaPage;
