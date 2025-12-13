import { Page } from "zmp-ui";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Loader2,
  Trophy,
  Flame,
  Swords,
  Sparkles,
  Package,
  X,
  Check,
  Star,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUserStore } from "@/stores/user-store";
import { getRankImage, getRankFromPoints } from "@/services/ai-quiz-service";
import {
  getFullImage,
  getHQImage,
  getScarcityColor,
  getScarcityName,
  getCollectionLotteries,
  type GachaCard,
} from "@/services/gacha-service";
import { getUserGachaInventory } from "@/services/gacha-pull-service";
import type { UserStats } from "@/types/quiz";

interface ShowcaseCard {
  cardImg: string;
  collectionId: number;
}

function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useUserStore();

  const [profile, setProfile] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showcaseCards, setShowcaseCards] = useState<
    (GachaCard & { collectionId: number })[]
  >([]);
  const [loadingShowcase, setLoadingShowcase] = useState(false);

  // Edit showcase states (only for own profile)
  const [isEditing, setIsEditing] = useState(false);
  const [ownedCards, setOwnedCards] = useState<
    (GachaCard & { collectionId: number })[]
  >([]);
  const [selectedCards, setSelectedCards] = useState<ShowcaseCard[]>([]);
  const [loadingOwnedCards, setLoadingOwnedCards] = useState(false);
  const [filterScarcity, setFilterScarcity] = useState<number | null>(null);

  // View card modal
  const [viewingCard, setViewingCard] = useState<
    (GachaCard & { collectionId: number }) | null
  >(null);

  const isOwnProfile = currentUser?.oderId === id;

  useEffect(() => {
    if (id) {
      fetchProfile(id);
    }
  }, [id]);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setError("Không tìm thấy người dùng");
        return;
      }

      const userData = userSnap.data() as UserStats;
      setProfile(userData);

      // Load showcase cards
      const showcase = (userData as any).showcase as ShowcaseCard[] | undefined;
      if (showcase && showcase.length > 0) {
        await loadShowcaseCards(showcase);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Không thể tải hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  const loadShowcaseCards = async (showcase: ShowcaseCard[]) => {
    setLoadingShowcase(true);
    try {
      const cards: (GachaCard & { collectionId: number })[] = [];
      const collectionIds = [...new Set(showcase.map((s) => s.collectionId))];

      for (const colId of collectionIds) {
        const lotteries = await getCollectionLotteries(colId);
        for (const lottery of lotteries) {
          for (const card of lottery.item_list || []) {
            const inShowcase = showcase.find(
              (s) => s.cardImg === card.card_img && s.collectionId === colId
            );
            if (inShowcase) {
              cards.push({ ...card, collectionId: colId });
            }
          }
        }
      }
      setShowcaseCards(cards);
    } catch (err) {
      console.error("Error loading showcase cards:", err);
    } finally {
      setLoadingShowcase(false);
    }
  };

  const startEditing = async () => {
    if (!currentUser?.oderId) return;
    setIsEditing(true);
    setLoadingOwnedCards(true);

    // Initialize selected cards from current showcase
    const currentShowcase = (profile as any)?.showcase || [];
    setSelectedCards(currentShowcase);

    try {
      const inventory = await getUserGachaInventory(currentUser.oderId);
      const cards: (GachaCard & { collectionId: number })[] = [];
      const collectionIds = Object.keys(inventory.cards).map(Number);

      for (const colId of collectionIds) {
        const cardImgs = Object.keys(inventory.cards[colId]);
        if (cardImgs.length === 0) continue;

        const lotteries = await getCollectionLotteries(colId);
        for (const lottery of lotteries) {
          for (const card of lottery.item_list || []) {
            if (cardImgs.includes(card.card_img)) {
              cards.push({ ...card, collectionId: colId });
            }
          }
        }
      }
      setOwnedCards(cards);
    } catch (err) {
      console.error("Error loading owned cards:", err);
    } finally {
      setLoadingOwnedCards(false);
    }
  };

  const toggleCardSelection = (card: GachaCard & { collectionId: number }) => {
    const exists = selectedCards.find(
      (s) => s.cardImg === card.card_img && s.collectionId === card.collectionId
    );

    if (exists) {
      setSelectedCards(
        selectedCards.filter(
          (s) =>
            !(
              s.cardImg === card.card_img &&
              s.collectionId === card.collectionId
            )
        )
      );
    } else {
      if (selectedCards.length >= 6) {
        return; // Max 6 cards
      }
      setSelectedCards([
        ...selectedCards,
        { cardImg: card.card_img, collectionId: card.collectionId },
      ]);
    }
  };

  const saveShowcase = async () => {
    if (!currentUser?.oderId) return;

    try {
      const { updateDoc } = await import("firebase/firestore");
      const userRef = doc(db, "users", currentUser.oderId);
      await updateDoc(userRef, { showcase: selectedCards });

      // Reload showcase
      await loadShowcaseCards(selectedCards);
      setIsEditing(false);

      // Update local profile
      if (profile) {
        setProfile({ ...profile, showcase: selectedCards } as any);
      }
    } catch (err) {
      console.error("Error saving showcase:", err);
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

  if (error || !profile) {
    return (
      <Page className="bg-background min-h-screen">
        <div className="flex flex-col items-center justify-center h-screen px-4">
          <p className="text-[var(--duo-red)] mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="btn-3d btn-3d-purple px-4 py-2"
          >
            Quay lại
          </button>
        </div>
      </Page>
    );
  }

  const rankInfo = getRankFromPoints(profile.conquestStats?.rankPoints ?? 0);
  const gachaStats = profile.gachaInventory?.gachaStats;
  const totalCards =
    (gachaStats?.totalURCards ?? 0) +
    (gachaStats?.totalSRCards ?? 0) +
    (gachaStats?.totalRCards ?? 0) +
    (gachaStats?.totalNCards ?? 0);

  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[var(--duo-purple)] to-[var(--duo-blue)] pt-12 pb-4 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-back-3d w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="font-bold text-xl text-white">Hồ sơ</h1>
        </div>
      </div>

      {/* Content */}
      <div className="pt-28 pb-24 px-4">
        {/* Profile Card */}
        <div className="card-3d p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            {/* Avatar with frame */}
            <div className="relative w-[88px] h-[88px] flex items-center justify-center shrink-0">
              {profile.equippedFrame && (
                <img
                  src={getFullImage(profile.equippedFrame, 120)}
                  alt="Frame"
                  className="absolute inset-0 w-[88px] h-[88px] object-contain z-10 pointer-events-none"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="w-12 h-12 rounded-full bg-[var(--duo-blue)] flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                {profile.equippedAvatar || profile.avatar ? (
                  <img
                    src={
                      profile.equippedAvatar
                        ? getFullImage(profile.equippedAvatar, 100)
                        : profile.avatar
                    }
                    alt=""
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  profile.odername?.charAt(0).toUpperCase() || "?"
                )}
              </div>
            </div>

            {/* Badge */}
            {profile.equippedBadge && (
              <div className="w-12 h-12 shrink-0">
                <img
                  src={getFullImage(profile.equippedBadge, 80)}
                  alt="Badge"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg text-foreground truncate">
                {profile.odername || "Người chơi"}
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                Level {profile.level ?? 1}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[var(--secondary)] rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <img src={getRankImage(rankInfo)} alt="" className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm">
                {profile.conquestStats?.rankPoints ?? 0}
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)]">
                Rank Points
              </p>
            </div>
            <div className="bg-[var(--secondary)] rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className="w-5 h-5 text-[var(--duo-orange)]" />
              </div>
              <p className="font-bold text-sm">{profile.streak ?? 0}</p>
              <p className="text-[10px] text-[var(--muted-foreground)]">
                Streak
              </p>
            </div>
            <div className="bg-[var(--secondary)] rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="w-5 h-5 text-[var(--duo-yellow)]" />
              </div>
              <p className="font-bold text-sm">{profile.totalScore ?? 0}</p>
              <p className="text-[10px] text-[var(--muted-foreground)]">Điểm</p>
            </div>
          </div>
        </div>

        {/* More Stats */}
        <div className="card-3d p-4 mb-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Swords className="w-5 h-5 text-[var(--duo-purple)]" />
            Chinh Chiến
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Tổng trận:</span>
              <span className="font-bold">
                {profile.conquestStats?.totalConquests ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Chuỗi thắng:
              </span>
              <span className="font-bold">
                {profile.conquestStats?.bestWinStreak ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Trả lời đúng:
              </span>
              <span className="font-bold text-[var(--duo-green)]">
                {profile.conquestStats?.totalConquestCorrect ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Trả lời sai:
              </span>
              <span className="font-bold text-[var(--duo-red)]">
                {profile.conquestStats?.totalConquestWrong ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Gacha Stats */}
        <div className="card-3d p-4 mb-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-[var(--duo-purple)]" />
            Bộ sưu tập
          </h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-[var(--secondary)] rounded-lg p-2">
              <p className="font-bold" style={{ color: getScarcityColor(40) }}>
                {gachaStats?.totalURCards ?? 0}
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)]">UR</p>
            </div>
            <div className="bg-[var(--secondary)] rounded-lg p-2">
              <p className="font-bold" style={{ color: getScarcityColor(30) }}>
                {gachaStats?.totalSRCards ?? 0}
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)]">SR</p>
            </div>
            <div className="bg-[var(--secondary)] rounded-lg p-2">
              <p className="font-bold" style={{ color: getScarcityColor(20) }}>
                {gachaStats?.totalRCards ?? 0}
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)]">R</p>
            </div>
            <div className="bg-[var(--secondary)] rounded-lg p-2">
              <p className="font-bold">{totalCards}</p>
              <p className="text-[10px] text-[var(--muted-foreground)]">Tổng</p>
            </div>
          </div>
        </div>

        {/* Showcase */}
        <div className="card-3d p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--duo-yellow)]" />
              Showcase
            </h3>
            {isOwnProfile && !isEditing && (
              <button
                onClick={startEditing}
                className="text-sm text-[var(--duo-blue)] font-semibold"
              >
                Chỉnh sửa
              </button>
            )}
          </div>

          {loadingShowcase ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--muted-foreground)]" />
            </div>
          ) : showcaseCards.length === 0 && !isEditing ? (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-2" />
              <p className="text-sm text-[var(--muted-foreground)]">
                {isOwnProfile
                  ? "Chưa có thẻ showcase. Bấm chỉnh sửa để thêm!"
                  : "Chưa có thẻ showcase"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {showcaseCards.map((card, idx) => (
                <button
                  key={`${card.collectionId}-${card.card_img}-${idx}`}
                  onClick={() => setViewingCard(card)}
                  className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-transform hover:scale-105 active:scale-95"
                  style={{ borderColor: getScarcityColor(card.card_scarcity) }}
                >
                  <img
                    src={getHQImage(card.card_img, 300)}
                    alt=""
                    className="w-full h-full object-cover object-top"
                    referrerPolicy="no-referrer"
                  />
                  <div
                    className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                    style={{
                      backgroundColor: getScarcityColor(card.card_scarcity),
                    }}
                  >
                    {getScarcityName(card.card_scarcity)}
                  </div>
                  {card.video_list && card.video_list.length > 1 && (
                    <div className="absolute top-1 right-1 p-1 rounded-full bg-black/50">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Card Modal */}
      {viewingCard && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setViewingCard(null)}
        >
          <div
            className="bg-background rounded-2xl overflow-hidden max-w-sm w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative flex-1 min-h-0"
              style={{
                aspectRatio:
                  viewingCard.width > 0 && viewingCard.height > 0
                    ? viewingCard.width / viewingCard.height
                    : 2 / 3,
              }}
            >
              {viewingCard.video_list && viewingCard.video_list.length > 1 ? (
                <video
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                  muted
                  playsInline
                  poster={getFullImage(viewingCard.card_img, 600)}
                  src={viewingCard.video_list[1]}
                />
              ) : (
                <img
                  src={getFullImage(viewingCard.card_img, 600)}
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
                      viewingCard.card_scarcity
                    ),
                  }}
                >
                  {getScarcityName(viewingCard.card_scarcity)}
                </span>
                {viewingCard.video_list?.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                    <Sparkles className="w-3 h-3" />
                    Thẻ động
                  </span>
                )}
              </div>
              <button
                onClick={() => setViewingCard(null)}
                className="w-full btn-3d btn-3d-purple py-2"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Showcase Bottom Sheet */}
      {isEditing && (
        <div
          className="fixed inset-0 z-[100] bg-black/60"
          onClick={() => setIsEditing(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-[var(--card)] rounded-t-3xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-[var(--border)] rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 pb-3 border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 rounded-xl bg-[var(--secondary)]"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="font-bold text-lg">Chọn thẻ Showcase</h2>
                <button
                  onClick={saveShowcase}
                  className="btn-3d btn-3d-green px-4 py-2 text-sm"
                >
                  Lưu
                </button>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mt-2 text-center">
                Chọn tối đa 6 thẻ ({selectedCards.length}/6)
              </p>
            </div>

            {/* Selected Preview */}
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="flex gap-2 overflow-x-auto flex-1">
                  {selectedCards.length === 0 ? (
                    <p className="text-xs text-[var(--muted-foreground)] py-2">
                      Chưa chọn thẻ nào
                    </p>
                  ) : (
                    selectedCards.map((s, idx) => {
                      const card = ownedCards.find(
                        (c) =>
                          c.card_img === s.cardImg &&
                          c.collectionId === s.collectionId
                      );
                      if (!card) return null;
                      return (
                        <button
                          key={idx}
                          onClick={() => toggleCardSelection(card)}
                          className="relative w-12 h-16 rounded-lg overflow-hidden border-2 shrink-0 group"
                          style={{
                            borderColor: getScarcityColor(card.card_scarcity),
                          }}
                        >
                          <img
                            src={getHQImage(card.card_img, 100)}
                            alt=""
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-active:opacity-100">
                            <X className="w-4 h-4 text-white" />
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
                {selectedCards.length > 0 && (
                  <button
                    onClick={() => setSelectedCards([])}
                    className="p-2 rounded-lg bg-[var(--duo-red)]/20 text-[var(--duo-red)] shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 py-2 border-b border-[var(--border)]">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setFilterScarcity(null)}
                  className={`flex items-center gap-1 py-1.5 px-3 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    filterScarcity === null
                      ? "bg-[var(--duo-purple)] text-white"
                      : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
                  }`}
                >
                  Tất cả
                </button>
                {[40, 30, 20, 10].map((scarcity) => (
                  <button
                    key={scarcity}
                    onClick={() => setFilterScarcity(scarcity)}
                    className="flex items-center gap-1 py-1.5 px-3 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
                    style={{
                      backgroundColor:
                        filterScarcity === scarcity
                          ? getScarcityColor(scarcity)
                          : "var(--secondary)",
                      color:
                        filterScarcity === scarcity
                          ? "white"
                          : "var(--muted-foreground)",
                    }}
                  >
                    <Star
                      className="w-3 h-3"
                      fill={
                        filterScarcity === scarcity
                          ? "white"
                          : getScarcityColor(scarcity)
                      }
                    />
                    {getScarcityName(scarcity)}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingOwnedCards ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--muted-foreground)]" />
                </div>
              ) : ownedCards.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4" />
                  <p className="text-[var(--muted-foreground)]">
                    Chưa có thẻ nào
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 pb-4">
                  {ownedCards
                    .filter(
                      (card) =>
                        filterScarcity === null ||
                        card.card_scarcity === filterScarcity
                    )
                    .map((card, idx) => {
                      const isSelected = selectedCards.some(
                        (s) =>
                          s.cardImg === card.card_img &&
                          s.collectionId === card.collectionId
                      );
                      return (
                        <button
                          key={`${card.collectionId}-${card.card_img}-${idx}`}
                          onClick={() => toggleCardSelection(card)}
                          className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                            isSelected
                              ? "ring-2 ring-[var(--duo-green)] ring-offset-2"
                              : ""
                          }`}
                          style={{
                            borderColor: getScarcityColor(card.card_scarcity),
                          }}
                        >
                          <img
                            src={getHQImage(card.card_img, 200)}
                            alt=""
                            className="w-full h-full object-cover object-top"
                            referrerPolicy="no-referrer"
                          />
                          <div
                            className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                            style={{
                              backgroundColor: getScarcityColor(
                                card.card_scarcity
                              ),
                            }}
                          >
                            {getScarcityName(card.card_scarcity)}
                          </div>
                          {isSelected && (
                            <div className="absolute inset-0 bg-[var(--duo-green)]/30 flex items-center justify-center">
                              <Check className="w-8 h-8 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

export default ProfilePage;
