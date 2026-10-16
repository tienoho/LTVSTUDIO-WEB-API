import React, { useState } from 'react';
import { 
  BookOpen, 
  Play, 
  Layers, 
  Download, 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink, 
  HelpCircle, 
  Phone, 
  Mail, 
  Laptop, 
  Cpu, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  Search, 
  Video,
  ChevronRight,
  Shield,
  MonitorCheck
} from 'lucide-react';

type GuideTab = 'intro' | 'workflow' | 'installation' | 'license' | 'video';

export const DocsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GuideTab>('intro');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: { id: GuideTab; label: string; group: string; icon: any }[] = [
    { id: 'intro', label: 'Giới thiệu về PodStudio Transform', group: 'Bắt đầu nhanh', icon: BookOpen },
    { id: 'workflow', label: 'Quy trình lồng tiếng 4 bước Wizard', group: 'Quy trình cốt lõi', icon: Layers },
    { id: 'installation', label: 'Cài đặt trên macOS & Windows', group: 'Bắt đầu nhanh', icon: Download },
    { id: 'license', label: 'Mua bản quyền & Kích hoạt Pro Key', group: 'Bắt đầu nhanh', icon: Key },
    { id: 'video', label: 'Video Hướng Dẫn & Hỗ Trợ', group: 'Tài nguyên', icon: Video },
  ];

  const filteredTabs = tabs.filter(t => 
    t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="guides-portal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tài Liệu Hướng Dẫn Chính Thức</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Hướng Dẫn Sử Dụng PodStudio Transform
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Cẩm nang chi tiết từ A - Z giúp bạn làm chủ phần mềm AI lồng tiếng và dịch thuật video tiếng Trung sang tiếng Việt chuyên nghiệp.
          </p>
        </div>

        {/* Video Quick Link Button */}
        <a 
          href="https://www.youtube.com/watch?v=OQGIJeR3QNg" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all self-center sm:self-auto shrink-0"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Xem Video Hướng Dẫn (YouTube)</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </a>
      </div>

      {/* Main Grid: Sidebar & Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* ── Left Sidebar: Navigation & Search ── */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm hướng dẫn..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* YouTube Highlights Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-red-950/40 via-slate-900/60 to-slate-950/80 border border-red-900/40 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-red-600/30">
                <Play className="w-3.5 h-3.5 fill-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-white">Video Hướng Dẫn Thực Tế</h4>
                <p className="text-[10px] text-slate-400">Độ phân giải 1080p sắc nét</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Xem trực tiếp các thao tác bóc tách giọng, dịch AI và lồng tiếng hoàn thiện từ video gốc Douyin.
            </p>
            <a
              href="https://www.youtube.com/watch?v=OQGIJeR3QNg"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Xem trên YouTube</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>
          </div>

          {/* Navigation Links Grouped */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Chuyên Mục Tài Liệu
            </div>
            <nav className="space-y-1.5">
              {filteredTabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-semibold shadow-sm shadow-cyan-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span className="truncate">{tab.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Direct Support Mini Card */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>Cần Trợ Giúp Kỹ Thuật?</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Đội ngũ hỗ trợ luôn sẵn sàng qua Hotline / Zalo:
            </p>
            <a 
              href="https://zalo.me/0967975971" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:underline"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Zalo: 0967.975.971</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </aside>

        {/* ── Right Content Area ── */}
        <main className="lg:col-span-3 space-y-6">
          {/* TAB 1: GIỚI THIỆU */}
          {activeTab === 'intro' && (
            <div className="space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
                    Bắt đầu nhanh
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Giới thiệu về PodStudio Transform
                  </h2>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Chào mừng bạn đến với tài liệu hướng dẫn sử dụng <strong>PodStudio Transform</strong> – phần mềm AI chuyên dụng để chuyển đổi, dịch thuật và lồng tiếng video tiếng Trung sang tiếng Việt tự động và chuyên nghiệp nhất.
                  </p>
                </div>

                {/* Embedded YouTube Video Container */}
                <div className="space-y-2">
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-black">
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src="https://www.youtube-nocookie.com/embed/OQGIJeR3QNg?rel=0"
                      title="Video hướng dẫn chi tiết sử dụng PodStudio Transform"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      <span>Video quay trực tiếp thao tác thực tế trong phần mềm</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <a 
                        href="https://www.youtube.com/channel/UCwZd5vvtbs7Z1AhF8RCwhbA" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:text-cyan-400 inline-flex items-center gap-1 transition-colors"
                      >
                        Kênh YouTube chính thức <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                  <p>
                    Trước đây, việc chuyển ngữ một video phim ngắn, clip Douyin hay video review từ tiếng Trung sang tiếng Việt đòi hỏi nhiều giờ tách nhạc, dịch thủ công từng câu, thu âm lồng tiếng và căn chỉnh timeline. <strong>PodStudio Transform</strong> giải quyết triệt để vấn đề này với quy trình AI khép kín chạy ngay trên máy tính của bạn.
                  </p>
                </div>

                {/* 5 Core Pillars */}
                <div className="space-y-4 pt-4 border-t border-slate-800/80">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <span>Sức Mạnh Công Nghệ Cốt Lõi</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-xs">Demucs v4</span>
                        <span>Tách Âm Thanh Thông Minh</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Tách sạch 100% giọng nói gốc tiếng Trung khỏi nhạc nền (BGM) và hiệu ứng âm thanh (SFX), giúp video sau khi lồng tiếng vẫn giữ trọn vẹn cảm xúc âm nhạc.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-xs">SenseVoice</span>
                        <span>Nhận Diện Giọng Nói STT</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Nhận diện tiếng Trung chuẩn xác từng mili-giây, phân tách danh tính người nói (Speaker Diarization) để gán đúng giọng từng nhân vật trong phim.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                      <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-xs">Qwen LLM</span>
                        <span>Dịch Thuật Kịch Bản AI</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Dịch thuật theo ngữ cảnh phim ảnh, tự động nhận biết quan hệ nhân vật (sư đồ, tình nhân, đồng nghiệp) để xưng hô chuẩn văn hóa người Việt.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs">VieNeu & Kokoro</span>
                        <span>Lồng Tiếng AI Giàu Cảm Xúc</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Giọng đọc tiếng Việt tự nhiên, truyền cảm, phân biệt rõ giọng Nam/Nữ Bắc - Nam và hỗ trợ công nghệ clone giọng nhân vật.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2 md:col-span-2">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-xs">Time-Stretching</span>
                        <span>Đồng Bộ Thời Lượng Khớp Khuôn Miệng</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Tự động co giãn tốc độ nói (Speed sync) khớp chuẩn xác với thời lượng từng phân đoạn câu thoại trong video gốc mà không làm méo chất giọng.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Privacy Guarantee Box */}
                <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-800/30 flex items-start gap-3.5">
                  <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-emerald-300">Cam Kết Quyền Riêng Tư & Bảo Mật 100%</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Toàn bộ quy trình từ giải mã video, nhận diện STT, dịch thuật và tổng hợp âm thanh có thể chạy <strong>100% ngoại tuyến (offline)</strong> trên máy tính của bạn qua hệ thống Plugin Store. Không yêu cầu đăng ký tài khoản, không bao giờ tải video của bạn lên bất kỳ máy chủ nào.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUY TRÌNH 4 BƯỚC WIZARD */}
          {activeTab === 'workflow' && (
            <div className="space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
                    Quy trình cốt lõi
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Quy Trình Lồng Tiếng 4 Bước Wizard (Từ A Đến Z)
                  </h2>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Phần mềm được thiết kế với thanh điều hướng <strong>Wizard Stepper</strong> thông minh, giúp bạn dễ dàng hoàn thành video chỉ qua 4 thao tác tuần tự:
                  </p>
                </div>

                {/* 4 Interactive Step Cards */}
                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-colors space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-extrabold text-sm flex items-center justify-center shrink-0">
                        1
                      </div>
                      <h3 className="text-base font-bold text-white">
                        Bước 1: Nạp Video, Tách Âm Thanh & Nhận Diện STT
                      </h3>
                    </div>
                    <div className="pl-11 space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                      <p>
                        Kéo thả tệp video tiếng Trung (<code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">.mp4</code>, <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">.mov</code>, <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">.mkv</code>) vào giao diện phần mềm.
                      </p>
                      <p className="text-slate-400">
                        • Hệ thống AI <strong>Demucs</strong> tự động phân tách âm thanh thành 2 đường tiếng riêng biệt: đường giọng thoại (vocal) và đường nhạc nền + âm hiệu ứng (BGM/SFX).<br />
                        • Mô hình <strong>SenseVoice</strong> bóc tách chính xác từng câu thoại tiếng Trung kèm mốc thời gian <code className="text-cyan-400">[Start - End]</code> và phân định danh tính người nói (<code className="text-purple-400">SPEAKER_00</code>, <code className="text-purple-400">SPEAKER_01</code>...).
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-colors space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-extrabold text-sm flex items-center justify-center shrink-0">
                        2
                      </div>
                      <h3 className="text-base font-bold text-white">
                        Bước 2: Dịch Thuật Kịch Bản AI (LLM Script Translation)
                      </h3>
                    </div>
                    <div className="pl-11 space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                      <p>
                        Lựa chọn mô hình dịch thuật AI (mô hình ngoại tuyến <strong>Qwen 2.5</strong> hoặc kết nối <strong>ChatGPT API / Gemini</strong>).
                      </p>
                      <p className="text-slate-400">
                        • Nhấn nút <strong>[Dịch kịch bản]</strong>. Bản dịch tiếng Việt sẽ tự động xuất hiện trong bảng chỉnh sửa tương tác.<br />
                        • Bạn có thể nhấp trực tiếp vào bất kỳ câu thoại nào để chỉnh sửa lại từ ngữ, xưng hô hoặc sắc thái theo đúng ý đồ của mình trước khi tiến hành lồng tiếng.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-colors space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-sm flex items-center justify-center shrink-0">
                        3
                      </div>
                      <h3 className="text-base font-bold text-white">
                        Bước 3: Chọn Giọng & Lồng Tiếng AI (TTS Synthesis)
                      </h3>
                    </div>
                    <div className="pl-11 space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                      <p>
                        Gán giọng đọc cho từng nhân vật tương ứng (ví dụ: Giọng Nam trầm ấm cho <code className="text-purple-400">SPEAKER_00</code>, Giọng Nữ nhẹ nhàng cho <code className="text-purple-400">SPEAKER_01</code>).
                      </p>
                      <p className="text-slate-400">
                        • Bạn có thể nhấn nút <strong>[Nghe thử giọng]</strong> để kiểm tra chất giọng trước khi bấm <strong>[Tổng hợp âm thanh lồng tiếng]</strong>.<br />
                        • Công nghệ Time-Stretching sẽ tự động cân bằng tốc độ để giọng đọc tiếng Việt khớp 100% thời gian mở miệng của nhân vật gốc.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-colors space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-sm flex items-center justify-center shrink-0">
                        4
                      </div>
                      <h3 className="text-base font-bold text-white">
                        Bước 4: Chỉnh Sửa Timeline, Vietsub & Xuất Bản Video
                      </h3>
                    </div>
                    <div className="pl-11 space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                      <p>
                        Cân chỉnh hòa âm và xuất bản video thành phẩm:
                      </p>
                      <p className="text-slate-400">
                        • Tùy chỉnh độ lớn nhạc nền (Audio Ducking - đề xuất mức 15-20% khi nhân vật đang nói chuyện để giọng đọc rõ ràng nhất).<br />
                        • Bật/tắt hiển thị phụ đề tiếng Việt hoặc song ngữ Trung - Việt theo nhu cầu.<br />
                        • Xem trước video trong trình phát tích hợp và bấm <strong>[Lưu video về máy (Export MP4)]</strong> với chất lượng 1080p hoặc 4K.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CÀI ĐẶT MACOS & WINDOWS */}
          {activeTab === 'installation' && (
            <div className="space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
                    Bắt đầu nhanh
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Cài Đặt Ứng Dụng Trên macOS & Windows
                  </h2>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Phần mềm hỗ trợ hoạt động tối ưu trên cả hai hệ điều hành phổ biến: <strong>macOS</strong> (Apple Silicon & Intel) và <strong>Windows 10/11 (64-bit)</strong>.
                  </p>
                </div>

                {/* macOS Guide */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2.5 text-white font-bold text-base">
                    <Laptop className="w-5 h-5 text-cyan-400" />
                    <span>1. Hướng Dẫn Cài Đặt Trên macOS</span>
                  </div>
                  <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-slate-300">
                    <li>Tải tệp cài đặt định dạng <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">.dmg</code> từ trang chủ.</li>
                    <li>Mở tệp <code className="text-cyan-400">.dmg</code> vừa tải về, sau đó kéo biểu tượng ứng dụng vào thư mục <strong>Applications (Ứng dụng)</strong>.</li>
                    <li>Mở Finder &gt; Applications và nhấp đúp để khởi động ứng dụng.</li>
                    <li className="text-amber-300">
                      <strong>Lưu ý Gatekeeper:</strong> Nếu macOS hiển thị thông báo <em>"App can't be opened because Apple cannot check it for malicious software"</em>, bạn chỉ cần vào <strong>Cài đặt hệ thống (System Settings) &gt; Quyền riêng tư & Bảo mật (Privacy & Security)</strong>, cuộn xuống và nhấn <strong>Vẫn mở (Open Anyway)</strong>.
                    </li>
                  </ol>
                </div>

                {/* Windows Guide */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2.5 text-white font-bold text-base">
                    <MonitorCheck className="w-5 h-5 text-emerald-400" />
                    <span>2. Hướng Dẫn Cài Đặt Trên Windows</span>
                  </div>
                  <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-slate-300">
                    <li>Tải tệp cài đặt <code className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">.exe</code> hoặc <code className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">.zip</code> từ trang chủ.</li>
                    <li>Mở tệp cài đặt để tiến hành cài đặt tự động (chỉ mất khoảng 30 giây).</li>
                    <li>Sau khi hoàn tất, biểu tượng ứng dụng sẽ xuất hiện trên màn hình Desktop và Start Menu.</li>
                  </ol>
                </div>

                {/* Hardware Spec Table */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-purple-400" />
                    <span>Cấu Hình Phần Cứng Khuyến Nghị</span>
                  </h3>
                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-900/80 text-slate-300 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="p-3.5">Hệ thống</th>
                          <th className="p-3.5">Cấu hình tối thiểu</th>
                          <th className="p-3.5 text-cyan-400">Cấu hình khuyến nghị</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 text-slate-400">
                        <tr className="hover:bg-slate-900/40">
                          <td className="p-3.5 font-bold text-white">macOS</td>
                          <td className="p-3.5">Mac M1/M2 hoặc Intel Core i5, 8GB RAM</td>
                          <td className="p-3.5 text-slate-200">Apple Silicon M1/M2/M3/M4 Pro/Max, 16GB RAM (tăng tốc GPU Metal)</td>
                        </tr>
                        <tr className="hover:bg-slate-900/40">
                          <td className="p-3.5 font-bold text-white">Windows</td>
                          <td className="p-3.5">Intel Core i5 Gen 8 / AMD Ryzen 5, 8GB RAM</td>
                          <td className="p-3.5 text-slate-200">Intel i7 / Ryzen 7, 16GB+ RAM, GPU NVIDIA RTX 3060 trở lên (tăng tốc CUDA)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MUA BẢN QUYỀN & KÍCH HOẠT PRO KEY */}
          {activeTab === 'license' && (
            <div className="space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
                    Bắt đầu nhanh
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Mua Bản Quyền & Kích Hoạt Pro License Key
                  </h2>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Khi mua bản quyền <strong>Pro License (500.000đ Trọn Đời)</strong>, bạn sẽ nhận được một mã bản quyền (License Key) để mở khóa toàn bộ tính năng và quyền xuất video 1080p/4K không giới hạn.
                  </p>
                </div>

                {/* 6 Steps to Activate */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-cyan-400" />
                    <span>6 Bước Kích Hoạt Trong Ứng Dụng:</span>
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      { step: 1, text: 'Mở phần mềm PodStudio Transform trên máy tính của bạn.' },
                      { step: 2, text: 'Nhấn vào biểu tượng Cài đặt (Settings ⚙️) ở góc trên bên phải màn hình.' },
                      { step: 3, text: 'Tìm đến mục Bản quyền & Giấy phép (License & Activation).' },
                      { step: 4, text: 'Dán mã License Key bạn đã nhận được vào ô nhập liệu.' },
                      { step: 5, text: 'Nhấn nút [Kích hoạt bản quyền (Activate)].' },
                      { step: 6, text: 'Màn hình sẽ hiển thị thông báo thành công và chuyển trạng thái tài khoản sang Pro License (Đã kích hoạt ✓).' },
                    ].map((item) => (
                      <div key={item.step} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs sm:text-sm text-slate-300">
                        <span className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-xs">
                          {item.step}
                        </span>
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Online Lookup Card Callout */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/30 to-blue-950/30 border border-cyan-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Search className="w-4 h-4 text-cyan-400" />
                      <span>Kiểm Tra Tình Trạng Key Trực Tuyến</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Bạn có thể tra cứu hạn sử dụng, thiết bị gán và trạng thái kích hoạt trên Cổng tra cứu của hệ thống.
                    </p>
                  </div>
                  <a
                    href="/lookup"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shrink-0 transition-colors"
                  >
                    <span>Tra Cứu Key Ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: VIDEO & HỖ TRỢ */}
          {activeTab === 'video' && (
            <div className="space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400 mb-2">
                    Tài nguyên trực quan
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Video Hướng Dẫn & Kênh Hỗ Trợ
                  </h2>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Theo dõi video thao tác trực tiếp và kết nối với đội ngũ phát triển khi cần trợ giúp.
                  </p>
                </div>

                {/* Big YouTube Player */}
                <div className="space-y-3">
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-black">
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src="https://www.youtube-nocookie.com/embed/OQGIJeR3QNg?rel=0"
                      title="Video Hướng Dẫn PodStudio Transform"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
                    <span>Hướng dẫn đầy đủ từ lúc cài đặt đến khi render video hoàn tất</span>
                    <a
                      href="https://www.youtube.com/watch?v=OQGIJeR3QNg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 font-bold"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Mở trên YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Contact Channels */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                      <Phone className="w-4 h-4" />
                      <span>Hotline & Zalo Kỹ Thuật</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Hỗ trợ cài đặt, kích hoạt key và giải đáp thắc mắc 24/7 qua Zalo:
                    </p>
                    <a
                      href="https://zalo.me/0967975971"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm font-extrabold text-cyan-400 hover:underline"
                    >
                      0967.975.971
                    </a>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <Mail className="w-4 h-4" />
                      <span>Email Hỗ Trợ Khách Hàng</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Gửi phản hồi, yêu cầu nâng cấp hoặc báo lỗi qua email:
                    </p>
                    <a
                      href="mailto:support@podstudio.tech"
                      className="inline-block text-sm font-extrabold text-emerald-400 hover:underline"
                    >
                      support@podstudio.tech
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Common Contact Callout */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-xs sm:text-sm space-y-1">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>Bạn cần trợ giúp thêm?</span>
              </h4>
              <p className="text-slate-400">
                Nếu tài liệu chưa giải đáp hết thắc mắc của bạn, hãy liên hệ Hotline / Zalo: <strong className="text-cyan-400 font-mono">0967.975.971</strong> hoặc gửi email để được hỗ trợ tức thì.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href="tel:0967975971"
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
              >
                Gọi 0967975971
              </a>
              <a
                href="https://zalo.me/0967975971"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Chat Zalo
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocsPage;
