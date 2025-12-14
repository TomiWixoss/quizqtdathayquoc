import { Page } from "zmp-ui";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Star,
  Sparkles,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getGachaCollections,
  getCollectionLotteries,
  getScarcityName,
  getScarcityColor,
  getHQImage,
  hasCardVideo,
  type GachaCard,
} from "@/services/gacha-service";
import { getUserGachaInventory } from "@/services/gacha-pull-service";
import { useUserStore } from "@/stores/user-store";
import { VideoCard } from "@/components/ui/video-player";

type TabType = "all" | "ur" | "sr" | "r" | "n";

interface OwnedCardInfo {
  card: GachaCard;
  collectionId: number;
  collectionName: string;
  count: number;
}

const ITEMS_PER_PAGE = 12;

function CardInventoryPage() {
  const navigate = useNavigate();
  const { user, incrementDailyCardViewed } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [allOwnedCards, setAllOwnedCards] = useState<OwnedCardInfo[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCard, setSelectedCard] = useState<OwnedCardInfo | null>(null);

  useEffect(() => {
    if (user?.oderId) {
      loadData();
    }
  }, [user?.oderId]);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const loadData = async () => {
    if (!user?.oderId) return;
    setLoading(true);

    try {
      const [inv, collections] = await Promise.all([
        getUserGachaInventory(user.oderId),
        getGachaCollections(),
      ]);

      // Build owned cards list
      const ownedCards: OwnedCardInfo[] = [];
      const collectionIds = Object.keys(inv.cards).map(Number);

      for (const colId of collectionIds) {
        const cardImgs = Object.keys(inv.cards[colId]);
        if (cardImgs.length === 0) continue;

        // Find collection info
        const col = collections.find((c) => c.id === colId);
        const colName = col?.name || col?.act_title || `Collection ${colId}`;

        // Get lotteries to find card details
        try {
          const lotteries = await getCollectionLotteries(colId);
          for (const lottery of lotteries) {
            for (const card of lottery.item_list || []) {
              if (cardImgs.includes(card.card_img)) {
                ownedCards.push({
                  card,
                  collectionId: colId,
                  collectionName: colName,
                  count: inv.cards[colId][card.card_img],
                });
              }
            }
          }
        } catch (e) {
          console.warn(`Failed to load lotteries for collection ${colId}:`, e);
        }
      }

      setAllOwnedCards(ownedCards);
    } catch (error) {
      console.error("Error loading card inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter cards by tab
  const filteredCards = useMemo(() => {
    switch (activeTab) {
      case "ur":
        return allOwnedCards.filter((c) => c.card.card_scarcity === 40);
      case "sr":
        return allOwnedCards.filter((c) => c.card.card_scarcity === 30);
      case "r":
        return allOwnedCards.filter((c) => c.card.card_scarcity === 20);
      case "n":
        return allOwnedCards.filter((c) => c.card.card_scarcity === 10);
      default:
        return allOwnedCards;
    }
  }, [allOwnedCards, activeTab]);

  // Pagination
  const totalPages = Math.ceil(filteredCards.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentCards = filteredCards.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Stats
  const stats = useMemo(() => {
    return {
      total: allOwnedCards.length,
      ur: allOwnedCards.filter((c) => c.card.card_scarcity === 40).length,
      sr: allOwnedCards.filter((c) => c.card.card_scarcity === 30).length,
      r: allOwnedCards.filter((c) => c.card.card_scarcity === 20).length,
      n: allOwnedCards.filter((c) => c.card.card_scarcity === 10).length,
    };
  }, [allOwnedCards]);

  const getTabColor = (tab: TabType) => {
    switch (tab) {
      case "ur":
        return getScarcityColor(40);
      case "sr":
        return getScarcityColor(30);
      case "r":
        return getScarcityColor(20);
      case "n":
        return getScarcityColor(10);
      default:
        return "var(--duo-purple)";
    }
  };

  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 pt-12 pb-4 px-4 bg-gradient-to-r from-[var(--duo-purple)] to-[var(--duo-pink)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-back-3d w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-white" />
              <h1 className="font-bold text-xl text-white">Kho thẻ</h1>
            </div>
            <p className="text-white/80 text-sm mt-1">
              {stats.total} thẻ đã sưu tập
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="fixed top-[116px] left-0 right-0 z-40 bg-[var(--card)] border-b border-[var(--border)]">
        <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-1.5 py-2 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === "all"
                ? "bg-[var(--duo-purple)] text-white"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
            }`}
          >
            Tất cả ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab("ur")}
            className="flex items-center gap-1.5 py-2 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-all"
            style={{
              backgroundColor:
                activeTab === "ur" ? getScarcityColor(40) : "var(--secondary)",
              color: activeTab === "ur" ? "white" : "var(--muted-foreground)",
            }}
          >
            <Star
              className="w-4 h-4"
              fill={activeTab === "ur" ? "white" : getScarcityColor(40)}
            />
            UR ({stats.ur})
          </button>
          <button
            onClick={() => setActiveTab("sr")}
            className="flex items-center gap-1.5 py-2 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-all"
            style={{
              backgroundColor:
                activeTab === "sr" ? getScarcityColor(30) : "var(--secondary)",
              color: activeTab === "sr" ? "white" : "var(--muted-foreground)",
            }}
          >
            <Star
              className="w-4 h-4"
              fill={activeTab === "sr" ? "white" : getScarcityColor(30)}
            />
            SR ({stats.sr})
          </button>
          <button
            onClick={() => setActiveTab("r")}
            className="flex items-center gap-1.5 py-2 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-all"
            style={{
              backgroundColor:
                activeTab === "r" ? getScarcityColor(20) : "var(--secondary)",
              color: activeTab === "r" ? "white" : "var(--muted-foreground)",
            }}
          >
            <Star
              className="w-4 h-4"
              fill={activeTab === "r" ? "white" : getScarcityColor(20)}
            />
            R ({stats.r})
          </button>
          <button
            onClick={() => setActiveTab("n")}
            className="flex items-center gap-1.5 py-2 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-all"
            style={{
              backgroundColor:
                activeTab === "n" ? getScarcityColor(10) : "var(--secondary)",
              color: activeTab === "n" ? "white" : "var(--muted-foreground)",
            }}
          >
            <Star
              className="w-4 h-4"
              fill={activeTab === "n" ? "white" : getScarcityColor(10)}
            />
            N ({stats.n})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-[180px] pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[var(--duo-purple)] animate-spin" />
            <p className="text-[var(--muted-foreground)] mt-3">Đang tải...</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package className="w-16 h-16 text-[var(--muted-foreground)] mb-4" />
            <p className="text-[var(--muted-foreground)]">
              {activeTab === "all"
                ? "Chưa có thẻ nào"
                : `Chưa có thẻ ${getScarcityName(
                    activeTab === "ur"
                      ? 40
                      : activeTab === "sr"
                      ? 30
                      : activeTab === "r"
                      ? 20
                      : 10
                  )}`}
            </p>
          </div>
        ) : (
          <>
            {/* Cards Grid */}
            <div className="grid grid-cols-3 gap-2">
              {currentCards.map((item, idx) => {
                const hasVideo = hasCardVideo(item.card.video_list);
                return (
                  <button
                    key={`${item.collectionId}-${item.card.card_img}-${idx}`}
                    onClick={() => {
                      setSelectedCard(item);
                      incrementDailyCardViewed();
                    }}
                    className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95"
                    style={{
                      borderColor: getScarcityColor(item.card.card_scarcity),
                    }}
                  >
                    <img
                      src={getHQImage(item.card.card_img, 300)}
                      alt=""
                      className="w-full h-full object-cover object-top"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    {/* Scarcity badge */}
                    <div
                      className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                      style={{
                        backgroundColor: getScarcityColor(
                          item.card.card_scarcity
                        ),
                      }}
                    >
                      {getScarcityName(item.card.card_scarcity)}
                    </div>
                    {/* Video indicator */}
                    {hasVideo && (
                      <div className="absolute top-1 right-1 p-1 rounded-full bg-black/50">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {/* Count badge */}
                    {item.count > 1 && (
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-bold text-white">
                        x{item.count}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-[var(--secondary)] disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4 text-foreground" />
                </button>
                <div
                  className="px-4 py-2 rounded-xl text-white font-bold text-sm"
                  style={{ backgroundColor: getTabColor(activeTab) }}
                >
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
              </div>
            )}
          </>
        )}
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="bg-background rounded-2xl overflow-hidden max-w-sm w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative flex-1 min-h-0"
              style={{
                aspectRatio:
                  selectedCard.card.width > 0 && selectedCard.card.height > 0
                    ? selectedCard.card.width / selectedCard.card.height
                    : 2 / 3,
              }}
            >
              <VideoCard
                videoList={selectedCard.card.video_list}
                imageUrl={selectedCard.card.card_img}
                className="w-full h-full object-contain"
                imageSize={600}
                collectionId={selectedCard.collectionId}
              />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span
                  className="px-3 py-1 rounded-lg text-sm font-bold text-white"
                  style={{
                    backgroundColor: getScarcityColor(
                      selectedCard.card.card_scarcity
                    ),
                  }}
                >
                  {getScarcityName(selectedCard.card.card_scarcity)}
                </span>
                <div className="flex items-center gap-2">
                  {selectedCard.card.video_list?.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                      <Sparkles className="w-3 h-3" />
                      Thẻ động
                    </span>
                  )}
                  {selectedCard.count > 1 && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      x{selectedCard.count}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="w-full btn-3d btn-3d-purple py-2"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

export default CardInventoryPage;
