"use client";

import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"survey" | "chat" | "info">("survey");

  const [formData, setFormData] = useState({
    targetJob: "",
    source: "Mạng xã hội",
    searchTime: "Dưới 1 tháng",
    confidence: 5,
    motivations: [] as string[],
  });

  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  // Hook useChat kinh điển: Tự động hứng luồng Stream từ Backend và ghép thành chữ
  // Ép kiểu "as any" để dập tắt mọi cảnh báo ảo của TypeScript
  // const {
  //   messages,
  //   input,
  //   handleInputChange,
  //   handleSubmit,
  //   isLoading,
  //   setMessages,
  //   append
  // } = useChat({
  //   api: "/api/chat",
  //   body: { formData },
  // }) as any;

  // 1. Tách cấu hình ra biến riêng (bỏ qua kiểm tra tham số đầu vào)
  const chatConfig: any = {
    api: "/api/chat",
    body: { formData },
  };

  // 2. Thêm 'as any' ở CUỐI CÙNG của useChat(chatConfig) (bỏ qua kiểm tra kết quả đầu ra)
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    append
  } = useChat(chatConfig) as any;
  // Tự động cuộn xuống tin nhắn mới nhất
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.targetJob.trim()) {
      alert("Vui lòng nhập ngành nghề bạn muốn tìm hiểu!");
      return;
    }
    setIsFormSubmitted(true);
    setActiveTab("chat");
  };

  const handleReset = () => {
    if (confirm("Bạn có chắc chắn muốn đổi ngành nghề khác? Cuộc trò chuyện hiện tại sẽ bị đặt lại.")) {
      setMessages([]);
      setIsFormSubmitted(false);
      setActiveTab("survey");
    }
  };

  // Hàm mồi câu hỏi đầu tiên để kích hoạt AI bóc tách ngành nghề
  const handleStartAnalysis = () => {
    append({
      role: "user",
      content: `Chào AI, tôi muốn tìm hiểu về nghề ${formData.targetJob}. Hãy phân tích góc khuất và thực tế ngành này cho tôi.`
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
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
                Thấu hiểu ngành nghề • Phá tan Thiên lệch sống sót
              </p>
            </div>
          </div>

          {formData.targetJob && isFormSubmitted && (
            <div className="flex items-center gap-2 bg-indigo-950/50 border border-indigo-800/50 px-3 py-1.5 rounded-full text-xs text-indigo-300">
              <span>Đang phân tích:</span>
              <span className="font-semibold text-white">{formData.targetJob}</span>
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
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
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

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col">
        {activeTab === "survey" && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <HelpCircle className="text-indigo-400" />
                Thu thập thông tin ban đầu (Giai đoạn 1 & 2)
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Giúp AI hiểu rõ động cơ và mức độ sẵn sàng của bạn trước khi đi sâu phản biện.
              </p>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  1. Ngành nghề bạn đang quan tâm hoặc muốn theo đuổi là gì? *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lập trình viên AI, Digital Marketing, Bác sĩ..."
                  value={formData.targetJob}
                  onChange={(e) => setFormData({ ...formData, targetJob: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  2. Bạn biết đến ngành này chủ yếu thông qua đâu?
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="Mạng xã hội">Mạng xã hội (TikTok, Facebook, Youtube...)</option>
                  <option value="Gia đình / Người thân">Gia đình / Người thân tư vấn</option>
                  <option value="Bạn bè / Đồng nghiệp">Bạn bè / Đồng nghiệp</option>
                  <option value="Thần tượng / KOL">Thần tượng / KOLs / Người nổi tiếng</option>
                  <option value="Thầy cô / Trường học">Thầy cô / Định hướng trường học</option>
                  <option value="Tự tìm hiểu báo chí">Tự tìm hiểu qua bài báo / Nghiên cứu</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  3. Bạn đã dành bao nhiêu thời gian để tìm hiểu về ngành này?
                </label>
                <select
                  value={formData.searchTime}
                  onChange={(e) => setFormData({ ...formData, searchTime: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="Mới nghe nói tới">Mới nghe nói tới gần đây</option>
                  <option value="Dưới 1 tháng">Dưới 1 tháng</option>
                  <option value="Từ 1 - 6 tháng">Từ 1 đến 6 tháng</option>
                  <option value="Trên 6 tháng">Trên 6 tháng</option>
                  <option value="Đang học / Đang làm">Đang trực tiếp học/làm việc trong ngành</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  4. Động cơ chính khiến bạn chọn ngành này? (Có thể chọn nhiều)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {motivationOptions.map((option) => {
                    const selected = formData.motivations.includes(option);
                    return (
                      <button
                        type="button"
                        key={option}
                        onClick={() => handleMotivationToggle(option)}
                        className={`p-3 rounded-xl border text-left text-sm flex items-center justify-between transition ${
                          selected
                            ? "bg-indigo-950/60 border-indigo-500 text-indigo-200"
                            : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <span>{option}</span>
                        {selected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-300">
                    5. Mức độ tự tin vào quyết định lựa chọn này của bạn (1 - 10):
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
                    setFormData({ ...formData, confidence: parseInt(e.target.value) })
                  }
                  className="w-full accent-indigo-500 bg-slate-900 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition duration-200 mt-8"
              >
                <span>Bắt đầu Phân tích & Định hướng với AI</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl flex-1 flex flex-col h-[75vh] shadow-xl overflow-hidden">
            {!isFormSubmitted ? (
              <div className="m-auto text-center space-y-4 max-w-md p-6">
                <HelpCircle className="w-12 h-12 text-indigo-400 mx-auto" />
                <h3 className="text-lg font-bold text-white">Chưa có thông tin khảo sát</h3>
                <p className="text-sm text-slate-400">
                  Vui lòng hoàn thiện Form ở mục <strong>"1. Hỏi đáp & Khảo sát"</strong> trước khi trò chuyện cùng AI.
                </p>
                <button
                  onClick={() => setActiveTab("survey")}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
                >
                  Đến Mục Khảo Sát
                </button>
              </div>
            ) : (
              <>
                <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>AI đang sẵn sàng bóc tách ngành: <strong>{formData.targetJob}</strong></span>
                  </div>
                  <span className="text-slate-500 hidden md:inline">
                    Giai đoạn 3 & 4: Bóc tách thực tế & Phản biện
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-12 space-y-3">
                      <Bot className="w-12 h-12 text-indigo-400 mx-auto animate-bounce" />
                      <p className="text-slate-300 font-medium">
                        Chào bạn! AI đã đọc thông tin khảo sát của bạn về ngành <strong>{formData.targetJob}</strong>.
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Hãy gửi một câu chào hoặc bấm nút bên dưới để bắt đầu nhận phân tích bóc tách 2 mặt của ngành!
                      </p>
                      <button
                        onClick={handleStartAnalysis}
                        className="text-xs bg-indigo-950 border border-indigo-800 text-indigo-300 hover:text-white px-4 py-2 rounded-full transition"
                      >
                        🚀 Bắt đầu Phân tích Ngành
                      </button>
                    </div>
                  )}

                  {/* KHU VỰC HIỂN THỊ TIN NHẮN (GIAO DIỆN) */}
                  {messages.map((m: any) => (
                    <div
                      key={m.id}
                      className={`flex gap-3 ${
                        m.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {m.role !== "user" && (
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-1">
                          <Bot className="w-5 h-5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                          m.role === "user"
                            ? "bg-indigo-600 text-white rounded-tr-none"
                            : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                        }`}
                      >
                        {m.content}
                      </div>

                      {m.role === "user" && (
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3 justify-start items-center text-slate-400 text-xs py-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        <span>AI đang bóc tách số liệu...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="p-3 md:p-4 bg-slate-900/80 border-t border-slate-800 flex items-center gap-2"
                >
                  <input
                    value={input}
                    onChange={handleInputChange}
                    placeholder={`Hỏi thêm hoặc chia sẻ suy nghĩ về ngành ${formData.targetJob}...`}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-3 rounded-xl transition"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {activeTab === "info" && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Newspaper className="text-indigo-400" />
              Mục Thông Tin & Báo Chí Uy Tín
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Cung cấp góc nhìn khách quan từ báo chí và đề xuất từ khóa tìm kiếm góc khuất ngành.
            </p>

            <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-500">
              ⏳ Chúng ta sẽ xây dựng Hub bài báo và Search Queries ở Bước 5!
            </div>
          </div>
        )}
      </main>
    </div>
  );
}