import { Page, useNavigate } from "zmp-ui";
import { ArrowLeft, Mail, CheckCircle, Inbox } from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import confetti from "canvas-confetti";
import { RewardModal } from "@/components/ui/reward-modal";

interface MailItem {
  id: string;
  title: string;
  content: string;
  reward: number;
  createdAt: string;
}

function MailboxPage() {
  const navigate = useNavigate();
  const { user, addGems, claimMail } = useUserStore();
  const [mails, setMails] = useState<MailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [currentReward, setCurrentReward] = useState<{
    title: string;
    gems: number;
  } | null>(null);

  // Get claimed mails from Firebase user data
  const claimedMails = user?.claimedMails || [];

  // Load mails from Firebase
  useEffect(() => {
    const loadMails = async () => {
      try {
        const mailRef = collection(db, "mails");
        const q = query(mailRef, where("active", "==", true));
        const snapshot = await getDocs(q);

        const mailList: MailItem[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as MailItem[];

        // Sort by date
        mailList.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setMails(mailList);
      } catch (error) {
        console.error("Error loading mails:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMails();
  }, []);

  const handleClaimReward = async (mail: MailItem) => {
    if (claimedMails.includes(mail.id)) return;

    await addGems(mail.reward);

    // Sync to Firebase
    await claimMail(mail.id);

    setCurrentReward({ title: mail.title, gems: mail.reward });
    setShowRewardModal(true);

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#58cc02", "#ffc800", "#1cb0f6"],
    });
  };

  const unclaimedCount = mails.filter(
    (m) => !claimedMails.includes(m.id)
  ).length;

  return (
    <Page className="bg-background min-h-screen">
      {/* Reward Modal */}
      <RewardModal
        isOpen={showRewardModal && !!currentReward}
        onClose={() => setShowRewardModal(false)}
        title="Nhận quà thành công!"
        subtitle={currentReward?.title}
        rewards={
          currentReward ? [{ type: "gems", amount: currentReward.gems }] : []
        }
        gradientFrom="var(--duo-orange)"
        gradientTo="var(--duo-yellow)"
      />

      {/* Header - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-40 pt-12 pb-4 px-4 bg-gradient-to-r from-[var(--duo-orange)] to-[var(--duo-yellow)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/settings")}
            className="btn-back-3d w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="font-bold text-xl text-white">Hòm thư</h1>
            <p className="text-white/80 text-xs">
              {unclaimedCount > 0
                ? `${unclaimedCount} thư chưa nhận`
                : "Không có thư mới"}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-30 pb-28">
        {loading ? (
          <div className="text-center py-10">
            <p className="text-[var(--muted-foreground)]">Đang tải...</p>
          </div>
        ) : mails.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--secondary)] flex items-center justify-center">
              <Inbox className="w-10 h-10 text-[var(--muted-foreground)]" />
            </div>
            <p className="text-[var(--muted-foreground)]">Hòm thư trống</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Quà từ hệ thống sẽ xuất hiện ở đây
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {mails.map((mail) => {
              const claimed = claimedMails.includes(mail.id);
              return (
                <div
                  key={mail.id}
                  className={`card-3d p-4 ${
                    !claimed ? "border-[var(--duo-orange)] border-2" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        claimed
                          ? "bg-[var(--secondary)]"
                          : "bg-[var(--duo-orange)]/20"
                      }`}
                    >
                      <Mail
                        className={`w-6 h-6 ${
                          claimed
                            ? "text-[var(--muted-foreground)]"
                            : "text-[var(--duo-orange)]"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground">
                        {mail.title}
                      </h3>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">
                        {mail.content}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <img
                          src="/AppAssets/BlueDiamond.png"
                          alt="gem"
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-bold text-[var(--duo-blue)]">
                          {mail.reward} Gems
                        </span>
                      </div>
                    </div>
                    {claimed ? (
                      <CheckCircle className="w-6 h-6 text-[var(--duo-green)] shrink-0" />
                    ) : (
                      <button
                        onClick={() => handleClaimReward(mail)}
                        className="btn-3d btn-3d-green px-3 py-2 text-xs shrink-0"
                      >
                        Nhận
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Page>
  );
}

export default MailboxPage;
