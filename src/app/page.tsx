"use client";

import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
} from "react";

import { useChat } from "@ai-sdk/react";

import {
  Compass,
  HelpCircle,
  Newspaper,
  ArrowRight,
  CheckCircle2,
  Send,
  User,
  Bot,
  Loader2,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    "survey" | "chat" | "info"
  >("survey");

  const [formData, setFormData] = useState({
    targetJob: "",
    source: "Mạng xã hội",
    searchTime: "Dưới 1 tháng",
    confidence: 5,
    motivations: [] as string[],
  });

  const [isFormSubmitted, setIsFormSubmitted] =
    useState(false);

  // =========================================================
  // AI CHAT
  // AI SDK 7 / @ai-sdk/react 4
  // =========================================================

  const [input, setInput] = useState("");

  const {
    messages,
    sendMessage,
    status,
    setMessages,
  } = useChat();

  const isLoading =
    status === "submitted" || status === "streaming";

  // =========================================================
  // AUTO SCROLL
  // =========================================================

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // =========================================================
  // FORM
  // =========================================================

  const motivationOptions = [
    "Đam mê cá nhân",
    "Thu nhập hấp dẫn",
    "Danh tiếng & Địa vị",
    "Xu hướng xã hội (Hot trend)",
    "Áp lực từ gia đình",
    "Hình mẫu thành công (Idol/KOL)",
    "Chưa có định hướng rõ ràng",
  ];

  const handleMotivationToggle = (option: string) => {
    setFormData((prev) => {
      const exists = prev.motivations.includes(option);

      return {
        ...prev,
        motivations: exists
          ? prev.motivations.filter((m) => m !== option)
          : [...prev.motivations, option],
      };
    });
  };

  const handleSubmitForm = (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!formData.targetJob.trim()) {
      alert(
        "Vui lòng nhập ngành nghề bạn muốn tìm hiểu!"
      );
      return;
    }

    setIsFormSubmitted(true);
    setActiveTab("chat");
  };

  // =========================================================
  // RESET
  // =========================================================

  const handleReset = () => {
    const confirmed = confirm(
      "Bạn có chắc chắn muốn đổi ngành nghề khác? Cuộc trò chuyện hiện tại sẽ bị đặt lại."
    );

    if (!confirmed) return;

    setMessages([]);
    setInput("");
    setIsFormSubmitted(false);
    setActiveTab("survey");
  };

  // =========================================================
  // SEND NORMAL CHAT MESSAGE
  // =========================================================

  const handleSubmit = (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const text = input.trim();

    if (!text || isLoading) return;

    void sendMessage(
      {
        text,
      },
      {
        body: {
          formData,
        },
      }
    );

    setInput("");
  };

  // =========================================================
  // FIRST ANALYSIS MESSAGE
  // =========================================================

  const handleStartAnalysis = () => {
    if (isLoading) return;

    void sendMessage(
      {
        text: `Chào AI, tôi muốn tìm hiểu về nghề ${formData.targetJob}. Hãy phân tích góc khuất và thực tế ngành này cho tôi.`,
      },
      {
        body: {
          formData,
        },
      }
    );
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* HEADER */}

      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <h1 className="font-bold text-lg text-slate-100 tracking-wide">
                ĐÀO SÂU ƯỚC MƠ
              </h1>

              <p className="text-xs text-slate-400">
                Thấu hiểu ngành nghề • Phá tan Thiên lệch
                sống sót
              </p>
            </div>
          </div>

          {formData.targetJob &&
            isFormSubmitted && (
              <div className="flex items-center gap-2 bg-indigo-950/50 border border-indigo-800/50 px-3 py-1.5 rounded-full text-xs text-indigo-300">
                <span>Đang phân tích:</span>

                <span className="font-semibold text-white">
                  {formData.targetJob}
                </span>

                <button
                  onClick={handleReset}
                  className="ml-2 text-indigo-400 hover:text-rose-400 flex items-center gap-1 transition"
                  title="Đổi ngành nghề"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đổi</span>
                </button>
              </div>
            )}
        </div>
      </header>

      {/* TABS */}

      <div className="bg-slate-950 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 flex justify-center md:justify-start gap-2">
          <button
            onClick={() => setActiveTab("survey")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "survey"
                ? "border-indigo-500 text-indigo-400 bg-slate-900/50"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <HelpCircle className="w-4 h-4" />

            <span>1. Hỏi đáp & Khảo sát</span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "chat"
                ? "border-indigo-500 text-indigo-400 bg-slate-900/50"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Compass className="w-4 h-4" />

            <span>2. AI Định hướng</span>

            {isFormSubmitted && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "info"
                ? "border-indigo-500 text-indigo-400 bg-slate-900/50"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Newspaper className="w-4 h-4" />

            <span>3. Thông tin thực tế</span>
          </button>
        </div>
      </div>

      {/* MAIN */}

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col">
        {/* =====================================================
            TAB 1 - SURVEY
        ===================================================== */}

        {activeTab === "survey" && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <HelpCircle className="text-indigo-400" />

                Thu thập thông tin ban đầu (Giai đoạn 1 &
                2)
              </h2>

              <p className="text-slate-400 text-sm mt-1">
                Giúp AI hiểu rõ động cơ và mức độ sẵn sàng
                của bạn trước khi đi sâu phản biện.
              </p>
            </div>

            <form
              onSubmit={handleSubmitForm}
              className="space-y-6"
            >
              {/* JOB */}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  1. Ngành nghề bạn đang quan tâm hoặc muốn
                  theo đuổi là gì? *
                </label>

                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lập trình viên AI, Digital Marketing, Bác sĩ..."
                  value={formData.targetJob}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetJob: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* SOURCE */}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  2. Bạn biết đến ngành này chủ yếu thông
                  qua đâu?
                </label>

                <select
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      source: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="Mạng xã hội">
                    Mạng xã hội (TikTok, Facebook,
                    Youtube...)
                  </option>

                  <option value="Gia đình / Người thân">
                    Gia đình / Người thân tư vấn
                  </option>

                  <option value="Bạn bè / Đồng nghiệp">
                    Bạn bè / Đồng nghiệp
                  </option>

                  <option value="Thần tượng / KOL">
                    Thần tượng / KOLs / Người nổi tiếng
                  </option>

                  <option value="Thầy cô / Trường học">
                    Thầy cô / Định hướng trường học
                  </option>

                  <option value="Tự tìm hiểu báo chí">
                    Tự tìm hiểu qua bài báo / Nghiên cứu
                  </option>
                </select>
              </div>

              {/* SEARCH TIME */}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  3. Bạn đã dành bao nhiêu thời gian để tìm
                  hiểu về ngành này?
                </label>

                <select
                  value={formData.searchTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      searchTime: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="Mới nghe nói tới">
                    Mới nghe nói tới gần đây
                  </option>

                  <option value="Dưới 1 tháng">
                    Dưới 1 tháng
                  </option>

                  <option value="Từ 1 - 6 tháng">
                    Từ 1 đến 6 tháng
                  </option>

                  <option value="Trên 6 tháng">
                    Trên 6 tháng
                  </option>

                  <option value="Đang học / Đang làm">
                    Đang trực tiếp học/làm việc trong ngành
                  </option>
                </select>
              </div>

              {/* MOTIVATIONS */}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  4. Động cơ chính khiến bạn chọn ngành này?
                  (Có thể chọn nhiều)
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {motivationOptions.map((option) => {
                    const selected =
                      formData.motivations.includes(option);

                    return (
                      <button
                        type="button"
                        key={option}
                        onClick={() =>
                          handleMotivationToggle(option)
                        }
                        className={`p-3 rounded-xl border text-left text-sm flex items-center justify-between transition ${
                          selected
                            ? "bg-indigo-950/60 border-indigo-500 text-indigo-200"
                            : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <span>{option}</span>

                        {selected && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CONFIDENCE */}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-300">
                    5. Mức độ tự tin vào quyết định lựa chọn
                    này của bạn (1 - 10):
                  </label>

                  <span className="text-indigo-400 font-bold text-lg">
                    {formData.confidence} / 10
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.confidence}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confidence: parseInt(
                        e.target.value,
                        10
                      ),
                    })
                  }
                  className="w-full accent-indigo-500 bg-slate-900 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* SUBMIT */}

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition duration-200 mt-8"
              >
                <span>
                  Bắt đầu Phân tích & Định hướng với AI
                </span>

                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {/* =====================================================
            TAB 2 - CHAT
        ===================================================== */}

        {activeTab === "chat" && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl flex-1 flex flex-col h-[75vh] shadow-xl overflow-hidden">
            {!isFormSubmitted ? (
              <div className="m-auto text-center space-y-4 max-w-md p-6">
                <HelpCircle className="w-12 h-12 text-indigo-400 mx-auto" />

                <h3 className="text-lg font-bold text-white">
                  Chưa có thông tin khảo sát
                </h3>

                <p className="text-sm text-slate-400">
                  Vui lòng hoàn thiện Form ở mục{" "}
                  <strong>
                    &quot;1. Hỏi đáp & Khảo sát&quot;
                  </strong>{" "}
                  trước khi trò chuyện cùng AI.
                </p>

                <button
                  onClick={() =>
                    setActiveTab("survey")
                  }
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
                >
                  Đến Mục Khảo Sát
                </button>
              </div>
            ) : (
              <>
                {/* CHAT HEADER */}

                <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

                    <span>
                      AI đang sẵn sàng bóc tách ngành:{" "}
                      <strong>
                        {formData.targetJob}
                      </strong>
                    </span>
                  </div>

                  <span className="text-slate-500 hidden md:inline">
                    Giai đoạn 3 & 4: Bóc tách thực tế &
                    Phản biện
                  </span>
                </div>

                {/* MESSAGES */}

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-12 space-y-3">
                      <Bot className="w-12 h-12 text-indigo-400 mx-auto animate-bounce" />

                      <p className="text-slate-300 font-medium">
                        Chào bạn! AI đã đọc thông tin khảo
                        sát của bạn về ngành{" "}
                        <strong>
                          {formData.targetJob}
                        </strong>
                        .
                      </p>

                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Hãy gửi một câu chào hoặc bấm nút bên
                        dưới để bắt đầu nhận phân tích bóc
                        tách 2 mặt của ngành!
                      </p>

                      <button
                        type="button"
                        onClick={handleStartAnalysis}
                        disabled={isLoading}
                        className="text-xs bg-indigo-950 border border-indigo-800 text-indigo-300 hover:text-white disabled:opacity-50 px-4 py-2 rounded-full transition"
                      >
                        🚀 Bắt đầu Phân tích Ngành
                      </button>
                    </div>
                  )}

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {/* BOT ICON */}

                      {message.role !== "user" && (
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-1">
                          <Bot className="w-5 h-5" />
                        </div>
                      )}

                      {/* MESSAGE BODY */}

                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                          message.role === "user"
                            ? "bg-indigo-600 text-white rounded-tr-none"
                            : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                        }`}
                      >
                        {message.parts.map(
                          (part, index) => {
                            if (
                              part.type === "text"
                            ) {
                              return (
                                <span
                                  key={`${message.id}-${index}`}
                                >
                                  {part.text}
                                </span>
                              );
                            }

                            return null;
                          }
                        )}
                      </div>

                      {/* USER ICON */}

                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* LOADING */}

                  {isLoading && (
                    <div className="flex gap-3 justify-start items-center text-slate-400 text-xs py-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                        <Bot className="w-5 h-5" />
                      </div>

                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />

                        <span>
                          AI đang bóc tách số liệu...
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* INPUT */}

                <form
                  onSubmit={handleSubmit}
                  className="p-3 md:p-4 bg-slate-900/80 border-t border-slate-800 flex items-center gap-2"
                >
                  <input
                    value={input}
                    onChange={(e) =>
                      setInput(e.target.value)
                    }
                    placeholder={`Hỏi thêm hoặc chia sẻ suy nghĩ về ngành ${formData.targetJob}...`}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />

                  <button
                    type="submit"
                    disabled={
                      isLoading || !input.trim()
                    }
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-3 rounded-xl transition"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* =====================================================
            TAB 3 - INFORMATION
        ===================================================== */}

        {activeTab === "info" && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Newspaper className="text-indigo-400" />

                Kiểm Chứng Thông Tin Thực Tế
              </h2>

              <p className="text-slate-400 text-sm">
                Đừng chỉ tin vào truyền thông, cũng đừng chỉ
                tin vào AI. Hãy tự mình kiểm chứng góc khuất
                của ngành nghề qua các từ khóa chiến lược.
              </p>
            </div>

            {!isFormSubmitted ? (
              <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 bg-slate-900/30">
                <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />

                <p>
                  Vui lòng hoàn thành khảo sát ở Tab 1 để hệ
                  thống tạo từ khóa tìm kiếm riêng cho bạn.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* SEARCH QUERIES */}

                <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-5">
                  <h3 className="text-rose-400 font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />

                    Từ khóa tìm kiếm &quot;Giải ảo&quot;
                    (Debunking Queries)
                  </h3>

                  <p className="text-sm text-slate-300 mb-4">
                    Copy các từ khóa này lên Google, YouTube
                    hoặc các hội nhóm Facebook để đọc những
                    tâm sự thật nhất từ người trong cuộc:
                  </p>

                  <div className="grid gap-3">
                    {[
                      `${formData.targetJob} bão sa thải layoff`,
                      `Mặt trái của nghề ${formData.targetJob}`,
                      `Tại sao tôi bỏ nghề ${formData.targetJob}`,
                      `Áp lực kiệt sức (burnout) ngành ${formData.targetJob}`,
                      `Thực trạng lương fresher ${formData.targetJob} hiện nay`,
                    ].map((query, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-900 border border-slate-700 px-4 py-3 rounded-lg hover:border-indigo-500 transition group"
                      >
                        <code className="text-sm text-indigo-300 font-mono">
                          {query}
                        </code>

                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(
                            query
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-indigo-400 flex items-center gap-1 text-xs font-medium transition opacity-0 group-hover:opacity-100"
                        >
                          Tìm Google
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SOURCES */}

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-indigo-400 font-semibold mb-3 flex items-center gap-2">
                    <Compass className="w-5 h-5" />

                    Gợi ý nguồn tìm hiểu thực tế
                  </h3>

                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-0.5">
                        •
                      </span>

                      <span>
                        <strong>
                          Reddit / Quora / Voz:
                        </strong>{" "}
                        Tìm các thread có chữ &quot;kinh
                        nghiệm xương máu&quot;, &quot;tâm sự
                        nghề&quot;. Đây là nơi người ta ẩn
                        danh nên sẽ nói thật nhất.
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-0.5">
                        •
                      </span>

                      <span>
                        <strong>
                          Báo cáo thị trường (Market Report):
                        </strong>{" "}
                        Tìm kiếm báo cáo của TopCV, ITviec,
                        VietnamWorks về tỷ lệ chọi và mức
                        lương trung bình thực tế, thay vì tin
                        vào báo mạng giật tít.
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-0.5">
                        •
                      </span>

                      <span>
                        <strong>
                          Phỏng vấn người đi trước:
                        </strong>{" "}
                        Chủ động nhắn tin cho 1-2 người đang
                        làm ở level Junior/Mid trên LinkedIn
                        để hỏi về những khó khăn lớn nhất của
                        họ trong 1 năm qua.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}