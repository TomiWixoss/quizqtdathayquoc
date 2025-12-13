import { Page } from "zmp-ui";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Loader2,
  Users,
  ShoppingCart,
  Calendar,
  Clock,
  Play,
  Star,
  Gift,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getGachaCollectionDetail,
  getCollectionLotteries,
  type GachaCollection,
  type GachaLottery,
  type GachaCard,
  getScarcityName,
  getScarcityColor,
  formatPrice,
  getHQImage,
} from "@/services/gacha-service";

function GachaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [collection, setCollection] = useState<GachaCollection | null>(null);
  const [lotteries, setLotteries] = useState<GachaLottery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLottery, setSelectedLottery] = useState<number>(0);
  const [showDescription, setShowDescription] = useState(false);
  const [selectedCard, setSelectedCard] = useState<GachaCard | null>(null);

  useEffect(() => {
    if (id) {
      fetchData(parseInt(id));
    }
  }, [id]);

  const fetchData = async (actId: number) => {
    try {
      setLoading(true);
      setError(null);

      const [collectionData, lotteriesData] = await Promise.all([
        getGachaCollectionDetail(actId),
        getCollectionLotteries(actId),
      ]);

      if (!collectionData) {
        setError("Không tìm thấy bộ sưu tập");
        return;
      }

      setCollection(collectionData);
      setLotteries(lotteriesData);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const isActive = (start: number, end: number) => {
    const now = Date.now() / 1000;
    return now >= start && now <= end;
  };

  const currentLottery = lotteries[selectedLottery];

  // Group cards by scarcity
  const groupedCards = currentLottery?.item_list?.reduce((acc, card) => {
    const scarcity = card.card_scarcity;
    if (!acc[scarcity]) acc[scarcity] = [];
    acc[scarcity].push(card);
    return acc;
  }, {} as Record<number, GachaCard[]>);

  // Sort scarcities descending (UR first)
  const sortedScarcities = groupedCards
    ? Object.keys(groupedCards)
        .map(Number)
        .sort((a, b) => b - a)
    : [];

  // Get UP chủ info
  const upInfo = collection?.related_user_infos
    ? Object.values(collection.related_user_infos)[0]
    : null;

  if (loading) {
    return (
      <Page className="bg-background min-h-screen">
        <div className="flex flex-col items-center justify-center h-screen">
          <Loader2 className="w-10 h-10 text-[var(--duo-purple)] animate-spin" />
          <p className="text-[var(--muted-foreground)] mt-3">Đang tải...</p>
        </div>
      </Page>
    );
  }

  if (error || !collection) {
    return (
      <Page className="bg-background min-h-screen">
        <div className="flex flex-col items-center justify-center h-screen px-4">
          <p className="text-[var(--duo-red)] mb-4">{error}</p>
          <button
            onClick={() => navigate("/gacha")}
            className="btn-3d btn-3d-purple px-4 py-2"
          >
            Quay lại
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-[var(--border)]">
        <div className="pt-12 pb-3 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/gacha")}
              className="p-2 rounded-xl bg-[var(--secondary)] hover:bg-[var(--secondary)]/80"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg text-foreground truncate">
                {collection.act_title || collection.name}
              </h1>
              {upInfo && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  by {upInfo.nickname}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-28 pb-6 px-4">
        {/* Banner Image */}
        <div className="card-3d overflow-hidden mb-4">
          <div className="aspect-video relative bg-[var(--secondary)]">
            <img
              src={getHQImage(collection.act_square_img, 800)}
              alt={collection.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Status badge */}
            {collection.end_time && (
              <div
                className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold ${
                  isActive(collection.startTime, collection.end_time)
                    ? "bg-green-500 text-white"
                    : "bg-gray-500 text-white"
                }`}
              >
                {isActive(collection.startTime, collection.end_time)
                  ? "Đang diễn ra"
                  : "Đã kết thúc"}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card-3d p-3">
            <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">Bắt đầu</span>
            </div>
            <p className="font-bold text-sm mt-1">
              {formatDate(collection.startTime)}
            </p>
          </div>
          <div className="card-3d p-3">
            <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Kết thúc</span>
            </div>
            <p className="font-bold text-sm mt-1">
              {formatDate(collection.end_time || 0)}
            </p>
          </div>
          <div className="card-3d p-3">
            <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
              <Users className="w-4 h-4" />
              <span className="text-xs">Đặt trước</span>
            </div>
            <p className="font-bold text-sm mt-1">
              {formatNumber(
                collection.total_book_cnt || collection.totalPreorderCount
              )}
            </p>
          </div>
          <div className="card-3d p-3">
            <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-xs">Đã mua</span>
            </div>
            <p className="font-bold text-sm mt-1">
              {formatNumber(
                collection.total_buy_cnt || collection.totalPurchaseCount
              )}
            </p>
          </div>
        </div>

        {/* Description */}
        {collection.product_introduce && (
          <div className="card-3d p-4 mb-4">
            <button
              onClick={() => setShowDescription(!showDescription)}
              className="flex items-center justify-between w-full"
            >
              <span className="font-bold text-sm">Giới thiệu</span>
              {showDescription ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showDescription && (
              <p className="text-sm text-[var(--muted-foreground)] mt-3 whitespace-pre-line">
                {collection.product_introduce}
              </p>
            )}
          </div>
        )}

        {/* Lottery Tabs */}
        {lotteries.length > 0 && (
          <>
            {lotteries.length > 1 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {lotteries.map((lottery, index) => (
                  <button
                    key={lottery.lottery_id}
                    onClick={() => setSelectedLottery(index)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                      selectedLottery === index
                        ? "bg-[var(--duo-purple)] text-white"
                        : "bg-[var(--secondary)] text-foreground"
                    }`}
                  >
                    {lottery.lottery_name}
                  </button>
                ))}
              </div>
            )}

            {/* Current Lottery Info */}
            {currentLottery && (
              <div className="card-3d p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">{currentLottery.lottery_name}</h3>
                  <span className="text-[var(--duo-purple)] font-bold">
                    {formatPrice(currentLottery.price)}/抽
                  </span>
                </div>

                {/* Cards by Scarcity */}
                {sortedScarcities.map((scarcity) => (
                  <div key={scarcity} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star
                        className="w-4 h-4"
                        style={{ color: getScarcityColor(scarcity) }}
                        fill={getScarcityColor(scarcity)}
                      />
                      <span
                        className="font-bold text-sm"
                        style={{ color: getScarcityColor(scarcity) }}
                      >
                        {getScarcityName(scarcity)} (
                        {groupedCards![scarcity].length})
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {groupedCards![scarcity].map((card, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedCard(card)}
                          className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[var(--secondary)] border-2 transition-all hover:scale-105"
                          style={{
                            borderColor: getScarcityColor(card.card_scarcity),
                          }}
                        >
                          <img
                            src={getHQImage(card.card_img, 300)}
                            alt={card.card_name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                          {card.video_list?.length > 0 && (
                            <div className="absolute top-1 right-1 p-1 rounded-full bg-black/50">
                              <Play
                                className="w-3 h-3 text-white"
                                fill="white"
                              />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-[10px] text-white font-medium truncate">
                              {card.card_name}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Collect Rewards */}
                {currentLottery.collect_list?.collect_infos &&
                  currentLottery.collect_list.collect_infos.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                      <div className="flex items-center gap-2 mb-3">
                        <Gift className="w-4 h-4 text-[var(--duo-yellow)]" />
                        <span className="font-bold text-sm">
                          Phần thưởng sưu tập
                        </span>
                      </div>
                      <div className="space-y-2">
                        {currentLottery.collect_list.collect_infos.map(
                          (reward, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-2 rounded-lg bg-[var(--secondary)]"
                            >
                              {reward.redeem_item_image && (
                                <img
                                  src={getHQImage(
                                    reward.redeem_item_image,
                                    100
                                  )}
                                  alt={reward.redeem_item_name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {reward.redeem_item_name}
                                </p>
                                <p className="text-[10px] text-[var(--muted-foreground)] line-clamp-2">
                                  {reward.redeem_text}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
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
            className="bg-background rounded-2xl overflow-hidden max-w-sm w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Card Image/Video */}
            <div className="relative aspect-[3/4] bg-[var(--secondary)]">
              {selectedCard.video_list?.length > 0 ? (
                <video
                  src={selectedCard.video_list[0]}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={getHQImage(selectedCard.card_img, 600)}
                  alt={selectedCard.card_name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Card Info */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">{selectedCard.card_name}</h3>
                <span
                  className="px-2 py-1 rounded-lg text-xs font-bold text-white"
                  style={{
                    backgroundColor: getScarcityColor(
                      selectedCard.card_scarcity
                    ),
                  }}
                >
                  {getScarcityName(selectedCard.card_scarcity)}
                </span>
              </div>

              {selectedCard.video_list?.length > 0 && (
                <p className="text-xs text-[var(--muted-foreground)] mb-3">
                  ✨ Thẻ động (có hiệu ứng video)
                </p>
              )}

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

export default GachaDetailPage;
