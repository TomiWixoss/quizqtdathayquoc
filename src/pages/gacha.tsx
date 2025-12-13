import { Page } from "zmp-ui";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Check,
  Bookmark,
  BookmarkCheck,
  List,
  RotateCw,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getGachaCollections,
  getFullImage,
  getCollectionLotteries,
  type GachaCollection,
} from "@/services/gacha-service";
import {
  getUserGachaInventory,
  updateGachaInventory,
} from "@/services/gacha-pull-service";
import { useUserStore } from "@/stores/user-store";
import type { GachaInventory } from "@/types/gacha";

const ITEMS_PER_PAGE = 6;

type TabType = "all" | "bookmarked" | "spinning" | "completed";

function GachaPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUserStore();
  const [collections, setCollections] = useState<GachaCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<GachaInventory | null>(null);
  const [collectionCardCounts, setCollectionCardCounts] = useState<
    Record<number, number>
  >({});

  // Restore tab and page from URL params
  const initialTab = (searchParams.get("tab") as TabType) || "all";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const CARD_COUNTS_CACHE_KEY = "gacha_card_counts";
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24h

  // Load cached card counts on mount
  useEffect(() => {
    const cachedCounts = localStorage.getItem(CARD_COUNTS_CACHE_KEY);
    if (cachedCounts) {
      try {
        const parsed = JSON.parse(cachedCounts);
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          setCollectionCardCounts(parsed.data);
        }
      } catch {
        // Invalid cache
      }
    }
  }, []);

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

  useEffect(() => {
    if (user?.oderId) {
      getUserGachaInventory(user.oderId).then(setInventory);
    }
  }, [user?.oderId]);

  // Track if tab was changed by user click (not from URL restore)
  const [tabChangedByUser, setTabChangedByUser] = useState(false);

  // Reset page when tab changes by user click
  useEffect(() => {
    if (tabChangedByUser) {
      setCurrentPage(1);
      setTabChangedByUser(false);
    }
  }, [activeTab, tabChangedByUser]);

  // Wrapper to set tab with user flag
  const handleTabChange = (tab: TabType) => {
    setTabChangedByUser(true);
    setActiveTab(tab);
  };

  // Helper: check if collection is spinning (has cards but not complete)
  const isSpinning = (collectionId: number) => {
    if (!inventory) return false;
    const totalCards = collectionCardCounts[collectionId] || 0;
    const ownedCards = inventory.cards[collectionId]
      ? Object.keys(inventory.cards[collectionId]).length
      : 0;
    return ownedCards > 0 && ownedCards < totalCards;
  };

  // Helper: check if collection is completed
  const isCompleted = (collectionId: number) => {
    if (!inventory) return false;
    const totalCards = collectionCardCounts[collectionId] || 0;
    const ownedCards = inventory.cards[collectionId]
      ? Object.keys(inventory.cards[collectionId]).length
      : 0;
    return totalCards > 0 && ownedCards >= totalCards;
  };

  // Filter collections based on active tab
  const filteredCollections = useMemo(() => {
    if (!inventory) return activeTab === "all" ? collections : [];

    const bookmarked = inventory.bookmarked || [];

    switch (activeTab) {
      case "bookmarked":
        return collections.filter((c) => bookmarked.includes(c.id));
      case "spinning":
        // Auto: có card nhưng chưa hoàn thành
        return collections.filter((c) => isSpinning(c.id));
      case "completed":
        // Auto: đã hoàn thành
        return collections.filter((c) => isCompleted(c.id));
      case "all":
      default:
        // Tất cả trừ đã lưu, đang quay, hoàn thành
        return collections.filter(
          (c) =>
            !bookmarked.includes(c.id) &&
            !isSpinning(c.id) &&
            !isCompleted(c.id)
        );
    }
  }, [collections, inventory, activeTab, collectionCardCounts]);

  const totalPages = Math.ceil(filteredCollections.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredCollections.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Lazy load card counts for current page items only
  useEffect(() => {
    if (currentItems.length === 0) return;

    const loadCardCounts = async () => {
      const missingIds = currentItems
        .filter((item) => collectionCardCounts[item.id] === undefined)
        .map((item) => item.id);

      if (missingIds.length === 0) return;

      const newCounts = { ...collectionCardCounts };

      // Load in parallel for current page only
      await Promise.all(
        missingIds.map(async (id) => {
          try {
            const lotteries = await getCollectionLotteries(id);
            newCounts[id] = lotteries.reduce(
              (sum, l) => sum + (l.item_list?.length || 0),
              0
            );
          } catch {
            newCounts[id] = 0;
          }
        })
      );

      setCollectionCardCounts(newCounts);

      // Update cache
      localStorage.setItem(
        CARD_COUNTS_CACHE_KEY,
        JSON.stringify({
          data: newCounts,
          timestamp: Date.now(),
        })
      );
    };

    loadCardCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItems.map((i) => i.id).join(",")]);

  // Toggle bookmark for a collection
  const toggleBookmark = async (collectionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.oderId || !inventory) return;

    const bookmarked = inventory.bookmarked || [];

    let newBookmarked: number[];
    if (bookmarked.includes(collectionId)) {
      newBookmarked = bookmarked.filter((id) => id !== collectionId);
    } else {
      newBookmarked = [...bookmarked, collectionId];
    }

    const newInventory = {
      ...inventory,
      bookmarked: newBookmarked,
    };
    setInventory(newInventory);
    await updateGachaInventory(user.oderId, newInventory);
  };

  const getTabColor = () => {
    switch (activeTab) {
      case "bookmarked":
        return "from-[var(--duo-yellow)] to-[var(--duo-orange)]";
      case "spinning":
        return "from-[var(--duo-blue)] to-[var(--duo-purple)]";
      case "completed":
        return "from-[var(--duo-green)] to-[#10b981]";
      default:
        return "from-[#8b5cf6] to-[#ec4899]";
    }
  };

  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 pt-12 pb-4 px-4 bg-gradient-to-r ${getTabColor()}`}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-white" />
          <h1 className="font-bold text-xl text-white">Gacha</h1>
        </div>
        <p className="text-white/80 text-sm mt-1">Bộ sưu tập thẻ số</p>
      </div>

      {/* Tabs - Scrollable */}
      <div className="fixed top-[116px] left-0 right-0 z-40 bg-[var(--card)] border-b border-[var(--border)]">
        <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => handleTabChange("all")}
            className={`flex items-center gap-1.5 py-2 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === "all"
                ? "bg-[var(--duo-purple)] text-white"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
            }`}
          >
            <List className="w-4 h-4" />
            Tất cả
          </button>
          <button
            onClick={() => handleTabChange("bookmarked")}
            className={`flex items-center gap-1.5 py-2 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === "bookmarked"
                ? "bg-[var(--duo-yellow)] text-white"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Đã lưu
          </button>
          <button
            onClick={() => handleTabChange("spinning")}
            className={`flex items-center gap-1.5 py-2 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === "spinning"
                ? "bg-[var(--duo-blue)] text-white"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
            }`}
          >
            <RotateCw className="w-4 h-4" />
            Đang quay
          </button>
          <button
            onClick={() => handleTabChange("completed")}
            className={`flex items-center gap-1.5 py-2 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === "completed"
                ? "bg-[var(--duo-green)] text-white"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Hoàn thành
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-[180px] pb-28">
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
        ) : filteredCollections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            {activeTab === "all" ? (
              <List className="w-16 h-16 text-[var(--muted-foreground)] mb-4" />
            ) : activeTab === "bookmarked" ? (
              <Bookmark className="w-16 h-16 text-[var(--muted-foreground)] mb-4" />
            ) : activeTab === "spinning" ? (
              <RotateCw className="w-16 h-16 text-[var(--muted-foreground)] mb-4" />
            ) : (
              <CheckCircle2 className="w-16 h-16 text-[var(--muted-foreground)] mb-4" />
            )}
            <p className="text-[var(--muted-foreground)]">
              {activeTab === "all"
                ? "Tất cả gói đã được phân loại"
                : activeTab === "bookmarked"
                ? "Chưa có gói nào được lưu"
                : activeTab === "spinning"
                ? "Chưa có gói nào đang quay"
                : "Chưa có gói nào hoàn thành"}
            </p>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-2 gap-3">
              {currentItems.map((item) => {
                const totalCards = collectionCardCounts[item.id] || 0;
                const ownedCards = inventory?.cards[item.id]
                  ? Object.keys(inventory.cards[item.id]).length
                  : 0;
                const complete = totalCards > 0 && ownedCards >= totalCards;
                const bookmarked = inventory?.bookmarked?.includes(item.id);

                return (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() =>
                        navigate(
                          `/gacha/${item.id}?tab=${activeTab}&page=${currentPage}`
                        )
                      }
                      className="w-full rounded-xl overflow-hidden bg-[var(--secondary)] transition-transform hover:scale-105 active:scale-95 shadow-lg"
                    >
                      <img
                        src={getFullImage(item.act_square_img, 400)}
                        alt=""
                        className="w-full h-auto"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      {/* Progress badge */}
                      {ownedCards > 0 && (
                        <div
                          className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-bold ${
                            complete
                              ? "bg-[var(--duo-green)] text-white"
                              : "bg-black/60 text-white"
                          }`}
                        >
                          {complete ? (
                            <span className="flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Xong
                            </span>
                          ) : (
                            `${ownedCards}/${totalCards}`
                          )}
                        </div>
                      )}
                    </button>

                    {/* Bookmark button */}
                    <button
                      onClick={(e) => toggleBookmark(item.id, e)}
                      className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all ${
                        bookmarked
                          ? "bg-[var(--duo-yellow)] text-white"
                          : "bg-black/60 text-white hover:bg-black/80"
                      }`}
                    >
                      {bookmarked ? (
                        <BookmarkCheck className="w-4 h-4" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              })}
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
