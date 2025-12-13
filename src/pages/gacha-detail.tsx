import { Page } from "zmp-ui";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Loader2,
  Play,
  Star,
  Gift,
  User,
  Frame,
} from "lucide-react";
import {
  getGachaCollectionDetail,
  getCollectionLotteries,
  type GachaCollection,
  type GachaLottery,
  type GachaCard,
  getScarcityName,
  getScarcityColor,
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
              className="p-2 rounded-xl bg-[var(--secondary)]"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="font-bold text-lg text-foreground">
              Chi tiết bộ sưu tập
            </h1>
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
              alt="Banner"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Lottery Tabs */}
        {lotteries.length > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {lotteries.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedLottery(index)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${
                  selectedLottery === index
                    ? "bg-[var(--duo-purple)] text-white"
                    : "bg-[var(--secondary)] text-foreground"
                }`}
              >
                Pool {index + 1}
              </button>
            ))}
          </div>
        )}

        {/* Cards */}
        {currentLottery && (
          <div className="card-3d p-4 mb-4">
            <h3 className="font-bold mb-3">Danh sách thẻ</h3>

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
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      {card.video_list?.length > 0 && (
                        <div className="absolute top-1 right-1 p-1 rounded-full bg-black/50">
                          <Play className="w-3 h-3 text-white" fill="white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Avatar Frame Rewards */}
            {(() => {
              const FRAME_TYPES = [3, 1001];
              const collectInfos =
                currentLottery.collect_list?.collect_infos?.filter((r) =>
                  FRAME_TYPES.includes(r.redeem_item_type || 0)
                ) || [];
              const collectChain =
                currentLottery.collect_list?.collect_chain?.filter((r) =>
                  FRAME_TYPES.includes(r.redeem_item_type || 0)
                ) || [];
              const allRewards = [...collectInfos, ...collectChain];

              if (allRewards.length === 0) return null;

              return (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="w-4 h-4 text-[var(--duo-yellow)]" />
                    <span className="font-bold text-sm">Phần thưởng</span>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {allRewards.map((reward, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-1"
                      >
                        {reward.redeem_item_image && (
                          <img
                            src={getHQImage(reward.redeem_item_image, 100)}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
                          {reward.redeem_item_type === 3 ? (
                            <>
                              <Frame className="w-3 h-3" />
                              <span>Khung</span>
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3" />
                              <span>Avatar</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="bg-background rounded-2xl overflow-hidden max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[3/4] bg-[var(--secondary)]">
              {selectedCard.video_list?.length > 1 ? (
                <video
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  poster={getHQImage(selectedCard.card_img, 600)}
                >
                  <source src={selectedCard.video_list[1]} type="video/mp4" />
                </video>
              ) : (
                <img
                  src={getHQImage(selectedCard.card_img, 600)}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span
                  className="px-3 py-1 rounded-lg text-sm font-bold text-white"
                  style={{
                    backgroundColor: getScarcityColor(
                      selectedCard.card_scarcity
                    ),
                  }}
                >
                  {getScarcityName(selectedCard.card_scarcity)}
                </span>
                {selectedCard.video_list?.length > 0 && (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    ✨ Thẻ động
                  </span>
                )}
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

export default GachaDetailPage;
