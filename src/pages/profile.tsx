import { Page } from "@/components/ui/page";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Loader2,
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
  hasCardVideo,
  type GachaCard,
} from "@/services/gacha-service";
import { VideoCard } from "@/components/ui/video-player";
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
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[var(--duo-purple)] to-[var(--duo-blue)] pt-4 pb-4 px-4">
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
      <div className="pt-24 pb-24 px-4">
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
                <img
                  src={getRankImage(rankInfo)}
                  alt=""
                  className="w-10 h-10"
                />
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
                <img
                  src="/AppAssets/Fire.png"
                  alt="streak"
                  className="w-10 h-10"
                />
              </div>
              <p className="font-bold text-sm">{profile.streak ?? 0}</p>
              <p className="text-[10px] text-[var(--muted-foreground)]">
                Streak
              </p>
            </div>
            <div className="bg-[var(--secondary)] rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <img
                  src="/AppAssets/Lighting.png"
                  alt="xp"
                  className="w-10 h-10"
                />
              </div>
              <p className="font-bold text-sm">{profile.exp ?? 0}</p>
              <p className="text-[10px] text-[var(--muted-foreground)]">XP</p>
            </div>
          </div>

          {/* Score Categories */}
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--muted-foreground)] mb-2">
              Điểm theo lĩnh vực
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              <div className="bg-[var(--duo-green)]/10 rounded-lg p-2 text-center">
                <p className="text-xs font-bold text-[var(--duo-green)]">
                  {(
                    (profile.totalCorrect ?? 0) * 10 +
                    (profile.perfectLessons ?? 0) * 50
                  ).toLocaleString()}
                </p>
                <p className="text-[8px] text-[var(--muted-foreground)]">
                  Quiz
                </p>
              </div>
              <div className="bg-[var(--duo-purple)]/10 rounded-lg p-2 text-center">
                <p className="text-xs font-bold text-[var(--duo-purple)]">
                  {(
                    (profile.conquestStats?.rankPoints ?? 0) +
                    (profile.conquestStats?.totalConquests ?? 0) * 5
                  ).toLocaleString()}
                </p>
                <p className="text-[8px] text-[var(--muted-foreground)]">
                  Battle
                </p>
              </div>
              <div className="bg-[var(--duo-yellow)]/10 rounded-lg p-2 text-center">
                <p className="text-xs font-bold text-[var(--duo-yellow)]">
                  {(
                    (gachaStats?.totalURCards ?? 0) * 100 +
                    (gachaStats?.totalSRCards ?? 0) * 50 +
                    (gachaStats?.totalRCards ?? 0) * 20 +
                    (gachaStats?.totalNCards ?? 0) * 5
                  ).toLocaleString()}
                </p>
                <p className="text-[8px] text-[var(--muted-foreground)]">
                  Gacha
                </p>
              </div>
              <div className="bg-[var(--duo-orange)]/10 rounded-lg p-2 text-center">
                <p className="text-xs font-bold text-[var(--duo-orange)]">-</p>
                <p className="text-[8px] text-[var(--muted-foreground)]">
                  Tower
                </p>
              </div>
              <div className="bg-[var(--duo-blue)]/10 rounded-lg p-2 text-center">
                <p className="text-xs font-bold text-[var(--duo-blue)]">
                  {((profile.achievements?.length ?? 0) * 25).toLocaleString()}
                </p>
                <p className="text-[8px] text-[var(--muted-foreground)]">
                  Achieve
                </p>
              </div>
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

        {/* Tủ trưng bày */}
        <div className="card-3d p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--duo-yellow)]" />
              Tủ trưng bày
            </h3>
            {isOwnProfile && !isEditing && (
              <button
                onClick={startEditing}
                className="btn-3d btn-3d-blue px-4 py-1.5 rounded-xl text-sm font-bold text-white flex items-center gap-1.5"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
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
                  ? "Chưa có thẻ trưng bày. Bấm chỉnh sửa để thêm!"
                  : "Chưa có thẻ trưng bày"}
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
                  {hasCardVideo(card.video_list) && (
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
              <VideoCard
                videoList={viewingCard.video_list}
                imageUrl={viewingCard.card_img}
                className="w-full h-full object-contain"
                imageSize={600}
                collectionId={viewingCard.collectionId}
              />
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
                {hasCardVideo(viewingCard.video_list) && (
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
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
          onClick={() => setIsEditing(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-[var(--card)] to-[var(--background)] rounded-t-[2rem] max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 bg-[var(--border)] rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--secondary)] border-2 border-[var(--border)] active:scale-95 transition-transform"
                >
                  <X className="w-5 h-5 text-[var(--muted-foreground)]" />
                </button>
                <div className="text-center">
                  <h2 className="font-bold text-lg">Tủ trưng bày</h2>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Chọn thẻ yêu thích để khoe
                  </p>
                </div>
                <button
                  onClick={saveShowcase}
                  className="btn-3d btn-3d-green px-4 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Lưu
                </button>
              </div>
            </div>

            {/* Selected Preview */}
            <div className="px-5 pb-4">
              <div className="bg-[var(--secondary)]/50 rounded-2xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                    Đã chọn
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--duo-purple)]/20 text-[var(--duo-purple)]">
                    {selectedCards.length}/6
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-2 overflow-x-auto flex-1 py-1 scrollbar-hide">
                    {selectedCards.length === 0 ? (
                      <div className="flex items-center gap-2 py-3">
                        <Sparkles className="w-4 h-4 text-[var(--muted-foreground)]" />
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Chạm vào thẻ bên dưới để chọn
                        </p>
                      </div>
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
                            className="relative w-14 h-[4.5rem] rounded-xl overflow-hidden border-2 shrink-0 group shadow-md hover:shadow-lg transition-all hover:scale-105"
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
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                              <X className="w-5 h-5 text-white" />
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                  {selectedCards.length > 0 && (
                    <button
                      onClick={() => setSelectedCards([])}
                      className="p-2 rounded-xl shrink-0 bg-[var(--duo-red)]/15 border-2 border-[var(--duo-red)]/30 active:scale-95 transition-transform"
                    >
                      <X className="w-4 h-4 text-[var(--duo-red)]" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-5 pb-3">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setFilterScarcity(null)}
                  className={`flex items-center gap-1.5 py-2 px-4 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    filterScarcity === null
                      ? "bg-gradient-to-r from-[var(--duo-purple)] to-purple-500 text-white shadow-lg shadow-[var(--duo-purple)]/30"
                      : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--border)]"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Tất cả
                </button>
                {[40, 30, 20, 10].map((scarcity) => (
                  <button
                    key={scarcity}
                    onClick={() => setFilterScarcity(scarcity)}
                    className="flex items-center gap-1.5 py-2 px-4 rounded-full text-xs font-bold whitespace-nowrap transition-all"
                    style={{
                      background:
                        filterScarcity === scarcity
                          ? `linear-gradient(135deg, ${getScarcityColor(
                              scarcity
                            )}, ${getScarcityColor(scarcity)}dd)`
                          : "var(--secondary)",
                      color:
                        filterScarcity === scarcity
                          ? "white"
                          : "var(--muted-foreground)",
                      boxShadow:
                        filterScarcity === scarcity
                          ? `0 4px 12px ${getScarcityColor(scarcity)}40`
                          : "none",
                    }}
                  >
                    <Star
                      className="w-3.5 h-3.5"
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
            <div className="flex-1 overflow-y-auto px-5 pb-8">
              {loadingOwnedCards ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-10 h-10 animate-spin text-[var(--duo-purple)] mb-3" />
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Đang tải thẻ...
                  </p>
                </div>
              ) : ownedCards.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--secondary)] flex items-center justify-center">
                    <Package className="w-10 h-10 text-[var(--muted-foreground)]" />
                  </div>
                  <p className="text-[var(--muted-foreground)] font-medium">
                    Chưa có thẻ nào
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    Hãy quay gacha để sưu tầm thẻ nhé!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
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
                          className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                            isSelected
                              ? "ring-3 ring-[var(--duo-green)] ring-offset-2 ring-offset-[var(--background)] scale-[0.98]"
                              : "hover:scale-[1.02] active:scale-[0.98]"
                          }`}
                          style={{
                            borderColor: getScarcityColor(card.card_scarcity),
                            boxShadow: isSelected
                              ? `0 8px 24px ${getScarcityColor(
                                  card.card_scarcity
                                )}40`
                              : `0 4px 12px ${getScarcityColor(
                                  card.card_scarcity
                                )}20`,
                          }}
                        >
                          <img
                            src={getHQImage(card.card_img, 200)}
                            alt=""
                            className="w-full h-full object-cover object-top"
                            referrerPolicy="no-referrer"
                          />
                          <div
                            className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm"
                            style={{
                              backgroundColor: getScarcityColor(
                                card.card_scarcity
                              ),
                            }}
                          >
                            {getScarcityName(card.card_scarcity)}
                          </div>
                          {isSelected && (
                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--duo-green)]/60 to-[var(--duo-green)]/20 flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                                <Check className="w-6 h-6 text-[var(--duo-green)]" />
                              </div>
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
