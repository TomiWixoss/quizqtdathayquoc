import { Page } from "zmp-ui";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Loader2,
  Star,
  Gift,
  User,
  Frame,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  getGachaCollectionDetail,
  getCollectionLotteries,
  type GachaCollection,
  type GachaLottery,
  type GachaCard,
  getScarcityName,
  getScarcityColor,
  getHQImage,
  getFullImage,
} from "@/services/gacha-service";
import {
  pullGacha,
  getUserGachaInventory,
  hasCard,
  hasClaimedRewards,
  claimAllRewards,
} from "@/services/gacha-pull-service";
import { GachaPullModal } from "@/components/gacha/gacha-pull-modal";
import { ShardExchangeModal } from "@/components/gacha/shard-exchange-modal";
import { useUserStore } from "@/stores/user-store";
import {
  GACHA_CONFIG,
  type GachaInventory,
  type GachaPullResult,
} from "@/types/gacha";

function GachaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUserStore();

  const [collection, setCollection] = useState<GachaCollection | null>(null);
  const [lotteries, setLotteries] = useState<GachaLottery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLottery, setSelectedLottery] = useState<number>(0);
  const [selectedCard, setSelectedCard] = useState<GachaCard | null>(null);

  // Gacha states
  const [inventory, setInventory] = useState<GachaInventory | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullResults, setPullResults] = useState<GachaPullResult[]>([]);
  const [showPullModal, setShowPullModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardsClaimed, setRewardsClaimed] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [skipPullLoading, setSkipPullLoading] = useState(false);

  const collectionId = id ? parseInt(id) : 0;

  // Check if claimed rewards from inventory
  useEffect(() => {
    if (inventory) {
      const claimed = hasClaimedRewards(inventory, collectionId);
      setRewardsClaimed(claimed);
    }
  }, [inventory, collectionId]);

  useEffect(() => {
    if (id) {
      fetchData(parseInt(id));
    }
  }, [id]);

  useEffect(() => {
    if (user?.oderId) {
      loadInventory();
    }
  }, [user?.oderId]);

  const loadInventory = async () => {
    if (!user?.oderId) return;
    const inv = await getUserGachaInventory(user.oderId);
    setInventory(inv);
  };

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

  const handlePull = async (count: 1 | 10) => {
    if (!user || !currentLottery) return;

    const cost = GACHA_CONFIG.COST_PER_PULL * count;
    if (user.gems < cost) {
      alert("Không đủ Gems!");
      return;
    }

    setIsPulling(true);
    setShowPullModal(true);
    setPullResults([]);

    const result = await pullGacha(
      user.oderId,
      collectionId,
      currentLottery,
      count,
      user.gems
    );

    if (result.success) {
      setPullResults(result.results);
      // Reload inventory
      await loadInventory();
      // Update user gems in store
      useUserStore.setState((state) => ({
        user: state.user ? { ...state.user, gems: result.newGems } : null,
      }));
    } else {
      alert(result.error || "Có lỗi xảy ra!");
      setShowPullModal(false);
    }

    setIsPulling(false);
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

  // Count owned cards
  const ownedCount = inventory?.cards[collectionId]
    ? Object.keys(inventory.cards[collectionId]).length
    : 0;
  const totalCards = currentLottery?.item_list?.length || 0;
  const isCollectionComplete = totalCards > 0 && ownedCount >= totalCards;

  // Get rewards for claiming
  const getCollectionRewards = () => {
    if (!currentLottery) return [];
    const REWARD_TYPES = [3, 1001, 1000]; // Frame, Badge, Avatar
    const collectInfos =
      currentLottery.collect_list?.collect_infos?.filter((r) =>
        REWARD_TYPES.includes(r.redeem_item_type || 0)
      ) || [];
    const collectChain =
      currentLottery.collect_list?.collect_chain?.filter((r) =>
        REWARD_TYPES.includes(r.redeem_item_type || 0)
      ) || [];
    return [...collectInfos, ...collectChain];
  };

  const handleClaimRewards = async () => {
    if (!user?.oderId) return;
    const rewards = getCollectionRewards();
    const success = await claimAllRewards(user.oderId, collectionId, rewards);
    if (success) {
      setRewardsClaimed(true);
      // Fire confetti celebration
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 7,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#DDA0DD"],
        });
        confetti({
          particleCount: 7,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#DDA0DD"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      // Show modal to view rewards
      setShowRewardModal(true);
      // Reload inventory to sync
      await loadInventory();
    }
  };

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
      <div className="fixed top-0 left-0 right-0 z-50 pt-12 pb-4 px-4 bg-gradient-to-r from-[var(--duo-purple)] to-[var(--duo-pink)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/gacha")}
              className="btn-back-3d w-10 h-10 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="font-bold text-xl text-white">
              Chi tiết bộ sưu tập
            </h1>
          </div>
          {/* Gems display */}
          <div className="flex items-center gap-1 px-3 py-1.5 bg-white/20 rounded-xl">
            <img
              src="/AppAssets/BlueDiamond.png"
              alt="gem"
              className="w-4 h-4"
            />
            <span className="font-bold text-sm text-white">
              {user?.gems || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-28 pb-32 px-4">
        {/* Banner Image */}
        <div className="card-3d overflow-hidden mb-4">
          <img
            src={getFullImage(collection.act_square_img, 800)}
            alt="Banner"
            className="w-full h-auto"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Progress */}
        <div className="card-3d p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Tiến độ sưu tập</span>
            <span className="text-sm font-bold text-[var(--duo-purple)]">
              {ownedCount}/{totalCards}
            </span>
          </div>
          <div className="h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--duo-purple)] to-[var(--duo-blue)] transition-all"
              style={{
                width: `${
                  totalCards > 0 ? (ownedCount / totalCards) * 100 : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Rates & Pity Info */}
        <div className="card-3d p-3 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Tỷ lệ rơi</span>
            {inventory && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[var(--muted-foreground)]">
                  Bảo hiểm:
                </span>
                <span className="font-bold text-[var(--duo-yellow)]">
                  {inventory.pityCounters[0] || 0}/{GACHA_CONFIG.PITY_UR}
                </span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-[var(--secondary)]">
              <Star
                className="w-4 h-4 mx-auto mb-1"
                style={{ color: getScarcityColor(40) }}
                fill={getScarcityColor(40)}
              />
              <div
                className="font-bold"
                style={{ color: getScarcityColor(40) }}
              >
                UR
              </div>
              <div className="text-[var(--muted-foreground)]">
                {GACHA_CONFIG.RATES[40]}%
              </div>
            </div>
            <div className="p-2 rounded-lg bg-[var(--secondary)]">
              <Star
                className="w-4 h-4 mx-auto mb-1"
                style={{ color: getScarcityColor(30) }}
                fill={getScarcityColor(30)}
              />
              <div
                className="font-bold"
                style={{ color: getScarcityColor(30) }}
              >
                SR
              </div>
              <div className="text-[var(--muted-foreground)]">
                {GACHA_CONFIG.RATES[30]}%
              </div>
            </div>
            <div className="p-2 rounded-lg bg-[var(--secondary)]">
              <Star
                className="w-4 h-4 mx-auto mb-1"
                style={{ color: getScarcityColor(20) }}
                fill={getScarcityColor(20)}
              />
              <div
                className="font-bold"
                style={{ color: getScarcityColor(20) }}
              >
                R
              </div>
              <div className="text-[var(--muted-foreground)]">
                {GACHA_CONFIG.RATES[20]}%
              </div>
            </div>
            <div className="p-2 rounded-lg bg-[var(--secondary)]">
              <Star
                className="w-4 h-4 mx-auto mb-1"
                style={{ color: getScarcityColor(10) }}
                fill={getScarcityColor(10)}
              />
              <div
                className="font-bold"
                style={{ color: getScarcityColor(10) }}
              >
                N
              </div>
              <div className="text-[var(--muted-foreground)]">
                {GACHA_CONFIG.RATES[10]}%
              </div>
            </div>
          </div>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-2 text-center">
            Đảm bảo UR sau {GACHA_CONFIG.PITY_UR} lần quay không trúng (tích lũy
            chung tất cả gói)
          </p>
        </div>

        {/* Shards & Exchange */}
        {inventory && (
          <div className="card-3d p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/IconPack/Currency/Crystal/256w/Crystal Blue 256px.png"
                  className="w-6 h-6"
                />
                <div>
                  <div className="font-bold">{inventory.shards} mảnh</div>
                  <div className="text-[10px] text-[var(--muted-foreground)]">
                    Đổi {GACHA_CONFIG.UR_EXCHANGE_COST} mảnh = 1 thẻ UR
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowExchangeModal(true)}
                className="btn-3d btn-3d-purple px-3 py-2 text-sm"
              >
                Đổi thẻ
              </button>
            </div>
          </div>
        )}

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
                  {groupedCards![scarcity].map((card, idx) => {
                    const hasVideo =
                      card.video_list && card.video_list.length > 1;
                    const owned = inventory
                      ? hasCard(inventory, collectionId, card.card_img)
                      : false;
                    return (
                      <button
                        key={idx}
                        onClick={() => owned && setSelectedCard(card)}
                        disabled={!owned}
                        className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                          owned
                            ? "bg-[var(--secondary)] hover:scale-105"
                            : "bg-black/30 brightness-50 cursor-not-allowed"
                        }`}
                        style={{
                          borderColor: owned
                            ? getScarcityColor(card.card_scarcity)
                            : "var(--border)",
                        }}
                      >
                        <img
                          src={getHQImage(card.card_img, 300)}
                          alt=""
                          className="w-full h-full object-cover object-top"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        {hasVideo && (
                          <div className="absolute top-1 right-1 p-1 rounded-full bg-black/50">
                            <Sparkles className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Rewards Section */}
            {(() => {
              const REWARD_TYPES = [3, 1001, 1000];
              const collectInfos =
                currentLottery.collect_list?.collect_infos?.filter((r) =>
                  REWARD_TYPES.includes(r.redeem_item_type || 0)
                ) || [];
              const collectChain =
                currentLottery.collect_list?.collect_chain?.filter((r) =>
                  REWARD_TYPES.includes(r.redeem_item_type || 0)
                ) || [];
              const allRewards = [...collectInfos, ...collectChain];

              if (allRewards.length === 0) return null;

              const getRewardLabel = (type: number) => {
                switch (type) {
                  case 3:
                    return { icon: Frame, label: "Khung" };
                  case 1001:
                    return { icon: Sparkles, label: "Huy hiệu" };
                  case 1000:
                    return { icon: User, label: "Avatar" };
                  default:
                    return { icon: Gift, label: "Thưởng" };
                }
              };

              return (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="w-4 h-4 text-[var(--duo-yellow)]" />
                    <span className="font-bold text-sm">Phần thưởng</span>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {allRewards.map((reward, idx) => {
                      const { icon: Icon, label } = getRewardLabel(
                        reward.redeem_item_type || 0
                      );
                      return (
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
                            <Icon className="w-3 h-3" />
                            <span>{label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Fixed Pull Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-[var(--border)]">
        {isCollectionComplete ? (
          // Show claim rewards button when collection complete
          <button
            onClick={() => !rewardsClaimed && handleClaimRewards()}
            disabled={rewardsClaimed}
            className={`w-full btn-3d py-3 ${
              rewardsClaimed ? "btn-3d-gray opacity-60" : "btn-3d-yellow"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Gift className="w-5 h-5" />
              <span>
                {rewardsClaimed ? "Đã nhận phần thưởng" : "Nhận phần thưởng"}
              </span>
            </div>
          </button>
        ) : (
          // Show pull buttons
          <div className="flex gap-3">
            <button
              onClick={() => handlePull(1)}
              disabled={
                isPulling || !user || user.gems < GACHA_CONFIG.COST_PER_PULL
              }
              className="flex-1 btn-3d btn-3d-purple py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span>Quay x1</span>
              </div>
              <div className="flex items-center justify-center gap-1 text-xs opacity-80 mt-0.5">
                <img
                  src="/AppAssets/BlueDiamond.png"
                  alt="gem"
                  className="w-3 h-3"
                />
                <span>{GACHA_CONFIG.COST_PER_PULL}</span>
              </div>
            </button>
            <button
              onClick={() => handlePull(10)}
              disabled={
                isPulling ||
                !user ||
                user.gems < GACHA_CONFIG.COST_PER_PULL * 10
              }
              className="flex-1 btn-3d btn-3d-red py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span>Quay x10</span>
              </div>
              <div className="flex items-center justify-center gap-1 text-xs opacity-80 mt-0.5">
                <img
                  src="/AppAssets/BlueDiamond.png"
                  alt="gem"
                  className="w-3 h-3"
                />
                <span>{GACHA_CONFIG.COST_PER_PULL * 10}</span>
              </div>
            </button>
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
            className="bg-background rounded-2xl overflow-hidden max-w-sm w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative flex-1 min-h-0"
              style={{
                aspectRatio:
                  selectedCard.width > 0 && selectedCard.height > 0
                    ? selectedCard.width / selectedCard.height
                    : 2 / 3,
              }}
            >
              {selectedCard.video_list && selectedCard.video_list.length > 1 ? (
                <video
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                  muted
                  playsInline
                  poster={getFullImage(selectedCard.card_img, 600)}
                  src={selectedCard.video_list[1]}
                />
              ) : (
                <img
                  src={getFullImage(selectedCard.card_img, 600)}
                  alt=""
                  className="w-full h-full object-contain"
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
                  <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                    <Sparkles className="w-3 h-3" />
                    Thẻ động
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

      {/* Gacha Pull Modal */}
      <GachaPullModal
        isOpen={showPullModal}
        onClose={() => {
          setShowPullModal(false);
          setPullResults([]);
          setSkipPullLoading(false);
        }}
        results={pullResults}
        isLoading={isPulling}
        skipLoading={skipPullLoading}
      />

      {/* Reward Claim Modal */}
      {showRewardModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowRewardModal(false)}
        >
          <div
            className="bg-background rounded-2xl overflow-hidden max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[var(--border)] text-center">
              <h2 className="font-bold text-lg flex items-center justify-center gap-2">
                <Gift className="w-5 h-5 text-[var(--duo-yellow)]" />
                Phần thưởng sưu tập
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Chúc mừng bạn đã hoàn thành bộ sưu tập!
              </p>
            </div>
            <div className="p-4">
              <div className="flex justify-center gap-4 mb-4">
                {getCollectionRewards().map((reward, idx) => {
                  const getRewardLabel = (type: number) => {
                    switch (type) {
                      case 3:
                        return "Khung";
                      case 1001:
                        return "Huy hiệu";
                      case 1000:
                        return "Avatar";
                      default:
                        return "Thưởng";
                    }
                  };
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      {reward.redeem_item_image && (
                        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[var(--duo-yellow)] bg-[var(--secondary)]">
                          <img
                            src={getHQImage(reward.redeem_item_image, 100)}
                            alt=""
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <span className="text-xs font-medium text-[var(--muted-foreground)]">
                        {getRewardLabel(reward.redeem_item_type || 0)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setShowRewardModal(false)}
                className="w-full btn-3d btn-3d-purple py-3"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shard Exchange Modal */}
      <ShardExchangeModal
        isOpen={showExchangeModal}
        onClose={() => setShowExchangeModal(false)}
        collectionId={collectionId}
        urCards={
          currentLottery?.item_list?.filter((c) => c.card_scarcity === 40) || []
        }
        inventory={inventory}
        userId={user?.oderId || ""}
        onExchangeSuccess={(card) => {
          // Show the exchanged card in pull modal (skip loading)
          setPullResults([
            {
              cardImg: card.card_img,
              cardScarcity: card.card_scarcity,
              isNew: true,
              shardsGained: 0,
              videoList: card.video_list,
              width: card.width,
              height: card.height,
            },
          ]);
          setSkipPullLoading(true);
          setShowPullModal(true);
          // Reload inventory
          loadInventory();
        }}
      />
    </Page>
  );
}

export default GachaDetailPage;
