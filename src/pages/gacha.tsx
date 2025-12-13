import { Page } from "zmp-ui";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getGachaCollections,
  getFullImage,
  type GachaCollection,
} from "@/services/gacha-service";

const ITEMS_PER_PAGE = 6;

function GachaPage() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<GachaCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGachaCollections();
      setCollections(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Không thể tải dữ liệu");
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

  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
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
            {/* Grid - Vertical card style */}
            <div className="grid grid-cols-2 gap-3">
              {currentItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/gacha/${item.id}`)}
                  className="rounded-xl overflow-hidden bg-[var(--secondary)] transition-transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  <img
                    src={getFullImage(item.act_square_img, 400)}
                    alt=""
                    className="w-full h-auto"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-[var(--secondary)] disabled:opacity-40"
                >
                  <ChevronsLeft className="w-4 h-4 text-foreground" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-[var(--secondary)] disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4 text-foreground" />
                </button>
                <div className="px-4 py-2 rounded-xl bg-[var(--duo-purple)] text-white font-bold text-sm">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-[var(--secondary)] disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4 text-foreground" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-[var(--secondary)] disabled:opacity-40"
                >
                  <ChevronsRight className="w-4 h-4 text-foreground" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Page>
  );
}

export default GachaPage;
