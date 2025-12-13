import { Page } from "zmp-ui";
import { Calendar, Clock, Gift, Sparkles } from "lucide-react";

function EventsPage() {
  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 pt-12 pb-4 px-4 bg-gradient-to-r from-[#ff6b6b] to-[#ffc800]">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-white" />
          <h1 className="font-bold text-xl text-white">Sự kiện</h1>
        </div>
        <p className="text-white/80 text-sm mt-1">Các sự kiện đặc biệt</p>
      </div>

      {/* Content */}
      <div className="px-4 pt-32 pb-28">
        {/* Coming Soon Card */}
        <div className="card-3d p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--duo-purple)]/20 to-[var(--duo-pink)]/20 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-[var(--duo-purple)]" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Sắp ra mắt!
          </h2>
          <p className="text-[var(--muted-foreground)] mb-6">
            Các sự kiện hấp dẫn đang được chuẩn bị. Hãy quay lại sau nhé!
          </p>

          {/* Preview Features */}
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--secondary)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--duo-green)]/20 flex items-center justify-center">
                <Gift className="w-5 h-5 text-[var(--duo-green)]" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">
                  Sự kiện đặc biệt
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Nhận thưởng giới hạn
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--secondary)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--duo-orange)]/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[var(--duo-orange)]" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">
                  Thử thách thời gian
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Hoàn thành trong thời hạn
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--secondary)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--duo-blue)]/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[var(--duo-blue)]" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">
                  Sự kiện theo mùa
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Lễ hội, ngày đặc biệt
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

export default EventsPage;
