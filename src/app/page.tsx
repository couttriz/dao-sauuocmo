"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Compass,
  ExternalLink,
  GraduationCap,
  Loader2,
  Newspaper,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Square,
  Sparkles,
  Target,
  User,
} from "lucide-react";

type ActiveTab = "survey" | "chat" | "info";

const decisionOptions = [
  "Tôi đã quyết định và gần như chắc chắn",
  "Tôi khá nghiêng về lựa chọn này nhưng vẫn có thể thay đổi",
  "Tôi đang cân nhắc giữa một vài ngành/nghề",
  "Tôi chỉ đang tìm hiểu thử",
];

const understoodAspectOptions = [
  "Công việc thực tế hằng ngày",
  "Các chuyên ngành/vị trí khác nhau",
  "Con đường học tập",
  "Bằng cấp/chứng chỉ cần thiết",
  "Kỹ năng cần có",
  "Mức thu nhập",
  "Cơ hội việc làm",
  "Môi trường làm việc",
  "Khả năng thăng tiến",
  "Khó khăn và áp lực",
  "Tỷ lệ cạnh tranh",
  "Khả năng bị công nghệ/AI thay thế",
  "Cơ hội làm việc trong và ngoài nước",
  "Tôi chưa hiểu rõ những điều trên",
];

const sourceOptions = [
  "Mạng xã hội (TikTok, Facebook, YouTube...)",
  "Gia đình / Người thân",
  "Bạn bè / Người quen",
  "Thầy cô / Nhà trường",
  "Người đang làm trong ngành",
  "KOL / Influencer / Người nổi tiếng",
  "Báo chí / Website / Báo cáo nghề nghiệp",
  "Tự tìm hiểu qua Google / Internet",
  "Khác",
];

const tabItems: {
  id: ActiveTab;
  label: string;
  shortLabel: string;
  icon: typeof CircleHelp;
  step: string;
}[] = [
  {
    id: "survey",
    label: "Hỏi đáp & Khảo sát",
    shortLabel: "Khảo sát",
    icon: CircleHelp,
    step: "01",
  },
  {
    id: "chat",
    label: "AI Định hướng",
    shortLabel: "AI tư vấn",
    icon: Sparkles,
    step: "02",
  },
  {
    id: "info",
    label: "Thông tin thực tế",
    shortLabel: "Kiểm chứng",
    icon: Newspaper,
    step: "03",
  },
];

const MAX_MESSAGE_CHARS = 3000;

function getFriendlyChatError(error: Error) {
  const message = error.message?.trim() || "";

  if (/quá nhanh|too many requests|429|rate limit/i.test(message)) {
    return message.includes("quá nhanh")
      ? message
      : "Bạn đang gửi tin nhắn quá nhanh. Chờ một chút rồi thử lại nhé.";
  }

  if (/failed to fetch|network|fetch failed/i.test(message)) {
    return "Mất kết nối tới máy chủ. Kiểm tra mạng rồi bấm Thử lại.";
  }

  if (/ai_service_error|an error occurred/i.test(message)) {
    return "AI tạm thời không tạo được câu trả lời. Bạn có thể thử lại ngay.";
  }

  if (message && message.length <= 240) {
    return message;
  }

  return "Có lỗi xảy ra khi kết nối AI. Vui lòng thử lại.";
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("survey");
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    grade: "",
    targetJob: "",
    targetPosition: "",
    decisionStage: "",
    searchTime: "Dưới 1 tháng",
    knowledgeScore: 5,
    understoodAspects: [] as string[],
    interestReason: "",
    source: sourceOptions[0],
    fitReason: "",
    concerns: "",
    wantToKnowMost: "",
  });
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [input, setInput] = useState("");

  const {
    messages,
    sendMessage,
    status,
    setMessages,
    error,
    regenerate,
    stop,
  } = useChat();

  const isLoading = status === "submitted" || status === "streaming";
  const friendlyError = error ? getFriendlyChatError(error) : null;
  const careerDisplay = formData.targetPosition.trim()
    ? `${formData.targetPosition} · ${formData.targetJob}`
    : formData.targetJob;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (activeTab === "chat" && isFormSubmitted) {
      window.setTimeout(() => chatInputRef.current?.focus(), 180);
    }
  }, [activeTab, isFormSubmitted]);

  const handleAspectToggle = (option: string) => {
    setFormData((prev) => {
      const noneOption = "Tôi chưa hiểu rõ những điều trên";

      if (option === noneOption) {
        return {
          ...prev,
          understoodAspects: prev.understoodAspects.includes(noneOption)
            ? []
            : [noneOption],
        };
      }

      const withoutNone = prev.understoodAspects.filter(
        (item) => item !== noneOption
      );
      const exists = withoutNone.includes(option);

      return {
        ...prev,
        understoodAspects: exists
          ? withoutNone.filter((item) => item !== option)
          : [...withoutNone, option],
      };
    });
  };

  const handleSubmitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      alert("Vui lòng nhập tên của bạn!");
      return;
    }

    if (!formData.age.trim() || !formData.grade.trim()) {
      alert("Vui lòng cho biết tuổi và lớp hiện tại!");
      return;
    }

    if (!formData.targetJob.trim()) {
      alert("Vui lòng nhập ngành/nghề bạn muốn tìm hiểu!");
      return;
    }

    if (!formData.decisionStage) {
      alert("Vui lòng chọn mức độ chắc chắn với lựa chọn hiện tại!");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      name: prev.name.trim(),
      age: prev.age.trim(),
      grade: prev.grade.trim(),
      targetJob: prev.targetJob.trim(),
      targetPosition: prev.targetPosition.trim(),
      interestReason: prev.interestReason.trim(),
      fitReason: prev.fitReason.trim(),
      concerns: prev.concerns.trim(),
      wantToKnowMost: prev.wantToKnowMost.trim(),
    }));
    setIsFormSubmitted(true);
    setActiveTab("chat");
  };

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

  const sendCurrentMessage = () => {
    const text = input.trim();

    if (!text || isLoading) return;

    if (text.length > MAX_MESSAGE_CHARS) {
      return;
    }

    void sendMessage(
      { text },
      {
        body: { formData },
      }
    );

    setInput("");
  };

  const handleRetry = () => {
    if (isLoading) return;

    void regenerate({
      body: { formData },
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendCurrentMessage();
  };

  const handleChatKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendCurrentMessage();
    }
  };

  const handleStartAnalysis = () => {
    if (isLoading) return;

    void sendMessage(
      {
        text: `Tôi đã hoàn thành khảo sát. Hãy bắt đầu phân tích lựa chọn nghề nghiệp ${careerDisplay} dựa trên hồ sơ của tôi, chỉ ra cả cơ hội, góc khuất và những điểm tôi có thể đang nhìn chưa đủ.`,
      },
      {
        body: { formData },
      }
    );
  };

  const goToTab = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  return (
    <div className="app-shell min-h-screen text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="ambient-orb ambient-orb-one" />
        <div className="ambient-orb ambient-orb-two" />
        <div className="soft-grid absolute inset-0 opacity-40" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#060a17]/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setActiveTab("survey")}
            className="group flex min-w-0 items-center gap-3 text-left"
          >
            <div className="brand-mark">
              <Compass className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-[15px] font-extrabold tracking-[0.08em] text-white sm:text-lg">
                  ĐÀO SÂU ƯỚC MƠ
                </h1>
                <span className="hidden rounded-full border border-indigo-400/20 bg-indigo-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-300 sm:inline">
                  AI Career Lab
                </span>
              </div>
              <p className="mt-0.5 hidden text-xs text-slate-400 sm:block">
                Hiểu nghề sâu hơn trước khi chọn đường dài hơn.
              </p>
            </div>
          </button>

          {isFormSubmitted && formData.targetJob && (
            <div className="flex max-w-[46%] items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-2 sm:max-w-sm sm:px-3">
              <Target className="h-4 w-4 shrink-0 text-indigo-300" />
              <div className="min-w-0 text-xs">
                <span className="hidden text-slate-500 sm:inline">Đang phân tích · </span>
                <span className="block truncate font-semibold text-slate-100 sm:inline">
                  {formData.targetJob}
                </span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-300"
                aria-label="Đổi ngành nghề"
                title="Đổi ngành nghề"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="relative z-30 hidden border-b border-white/[0.06] bg-[#070c1a]/75 backdrop-blur-lg md:block">
        <nav className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-2.5" aria-label="Quy trình định hướng">
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            const completed =
              (tab.id === "survey" && isFormSubmitted) ||
              (tab.id === "chat" && messages.length > 0);

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => goToTab(tab.id)}
                className={`group flex min-w-0 flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                  active
                    ? "border-indigo-400/25 bg-indigo-500/10 shadow-[0_10px_35px_rgba(79,70,229,0.08)]"
                    : "border-transparent hover:border-white/[0.06] hover:bg-white/[0.03]"
                }`}
                aria-current={active ? "step" : undefined}
              >
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold transition ${
                    active
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                      : completed
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-white/[0.04] text-slate-500"
                  }`}
                >
                  {completed && !active ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>

                <div className="min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${active ? "text-indigo-300" : "text-slate-600"}`}>
                    Bước {tab.step}
                  </p>
                  <p className={`truncate text-sm font-semibold ${active ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`}>
                    {tab.label}
                  </p>
                </div>

                {active && <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-indigo-300" />}
              </button>
            );
          })}
        </nav>
      </div>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:px-6 sm:pt-7 md:pb-10 lg:pt-9">
        {activeTab === "survey" && (
          <section className="glass-panel overflow-hidden rounded-[28px]">
            <div className="border-b border-white/[0.06] px-5 py-5 sm:px-7 sm:py-6 lg:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/15 bg-indigo-400/[0.08] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-300">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Khảo sát định hướng
                  </div>
                  <h2 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-[28px]">
                    Cho AI hiểu bạn và cách bạn đang nhìn về nghề.
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-[15px]">
                    Bộ câu hỏi này giúp AI biết bạn đang ở giai đoạn nào, đã hiểu nghề tới đâu và những điểm nào cần được đào sâu hoặc phản biện.
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2 self-start rounded-2xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 text-xs text-slate-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  <span>Khoảng 4 phút</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-8 px-5 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
              {/* 01 - ABOUT YOU */}
              <div className="space-y-5">
                <div className="flex items-start gap-3 border-b border-white/[0.06] pb-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-xs font-bold text-indigo-300">
                    01
                  </span>
                  <div>
                    <h3 className="font-bold text-white">Về bạn</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Một chút bối cảnh để AI điều chỉnh cách tư vấn phù hợp với độ tuổi và giai đoạn học tập.
                    </p>
                  </div>
                </div>

                <fieldset className="space-y-3">
                  <label htmlFor="name" className="field-label">
                    <span className="field-number">1</span>
                    Bạn tên là gì?
                    <span className="text-rose-300">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Ví dụ: Nguyễn Minh Anh"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="form-control"
                  />
                </fieldset>

                <div className="grid gap-5 sm:grid-cols-2">
                  <fieldset className="space-y-3">
                    <label htmlFor="age" className="field-label">
                      <span className="field-number">2</span>
                      Bạn bao nhiêu tuổi?
                      <span className="text-rose-300">*</span>
                    </label>
                    <input
                      id="age"
                      type="number"
                      required
                      min="10"
                      max="100"
                      inputMode="numeric"
                      placeholder="Ví dụ: 17"
                      value={formData.age}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          age: event.target.value,
                        }))
                      }
                      className="form-control"
                    />
                  </fieldset>

                  <fieldset className="space-y-3">
                    <label htmlFor="grade" className="field-label">
                      <span className="field-number">3</span>
                      Hiện tại bạn học lớp mấy?
                      <span className="text-rose-300">*</span>
                    </label>
                    <input
                      id="grade"
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="Ví dụ: Lớp 12"
                      value={formData.grade}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          grade: event.target.value,
                        }))
                      }
                      className="form-control"
                    />
                  </fieldset>
                </div>
              </div>

              {/* 02 - CAREER DIRECTION */}
              <div className="space-y-5">
                <div className="flex items-start gap-3 border-b border-white/[0.06] pb-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-xs font-bold text-indigo-300">
                    02
                  </span>
                  <div>
                    <h3 className="font-bold text-white">Nghề bạn đang hướng tới</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Xác định lĩnh vực, vị trí cụ thể và mức độ chắc chắn hiện tại của bạn.
                    </p>
                  </div>
                </div>

                <fieldset className="space-y-3">
                  <label htmlFor="target-job" className="field-label">
                    <span className="field-number">4</span>
                    Hiện tại bạn đang quan tâm hoặc muốn theo đuổi nghề/ngành nào?
                    <span className="text-rose-300">*</span>
                  </label>
                  <input
                    id="target-job"
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="Ví dụ: Công nghệ thông tin, Marketing, Y khoa..."
                    value={formData.targetJob}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        targetJob: event.target.value,
                      }))
                    }
                    className="form-control"
                  />
                </fieldset>

                <fieldset className="space-y-3">
                  <label htmlFor="target-position" className="field-label">
                    <span className="field-number">5</span>
                    Bạn đang hướng tới vị trí/công việc cụ thể nào trong lĩnh vực đó?
                  </label>
                  <input
                    id="target-position"
                    type="text"
                    autoComplete="off"
                    placeholder="Ví dụ: AI Engineer, Bác sĩ ngoại khoa, Brand Marketing..."
                    value={formData.targetPosition}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        targetPosition: event.target.value,
                      }))
                    }
                    className="form-control"
                  />
                  <p className="text-xs leading-5 text-slate-500">
                    Nếu chưa biết vị trí cụ thể, bạn có thể để trống. AI sẽ giúp bạn bóc tách các hướng bên trong ngành.
                  </p>
                </fieldset>

                <fieldset className="space-y-3">
                  <legend className="field-label">
                    <span className="field-number">6</span>
                    Bạn đã quyết định khá chắc chắn về lựa chọn này chưa?
                    <span className="text-rose-300">*</span>
                  </legend>

                  <div className="grid gap-2.5">
                    {decisionOptions.map((option, index) => {
                      const selected = formData.decisionStage === option;

                      return (
                        <button
                          type="button"
                          key={option}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              decisionStage: option,
                            }))
                          }
                          className={`motivation-card ${selected ? "motivation-card-active" : ""}`}
                          aria-pressed={selected}
                        >
                          <span className="flex min-w-0 items-start gap-3 pr-3">
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-[11px] font-bold text-indigo-300">
                              {index + 1}
                            </span>
                            <span className="text-left">{option}</span>
                          </span>
                          <span
                            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${
                              selected
                                ? "border-indigo-400 bg-indigo-500 text-white"
                                : "border-slate-700 text-transparent"
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>

              {/* 03 - KNOWLEDGE */}
              <div className="space-y-5">
                <div className="flex items-start gap-3 border-b border-white/[0.06] pb-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-xs font-bold text-indigo-300">
                    03
                  </span>
                  <div>
                    <h3 className="font-bold text-white">Bạn đã hiểu nghề tới đâu?</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      AI sẽ dùng phần này để phát hiện khoảng trống kiến thức thay vì giải thích lại những điều bạn đã biết.
                    </p>
                  </div>
                </div>

                <fieldset className="space-y-3">
                  <label htmlFor="search-time" className="field-label">
                    <span className="field-number">7</span>
                    Bạn đã tìm hiểu về ngành/nghề này trong bao lâu?
                  </label>
                  <div className="select-wrap">
                    <select
                      id="search-time"
                      value={formData.searchTime}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          searchTime: event.target.value,
                        }))
                      }
                      className="form-control appearance-none pr-11"
                    >
                      <option value="Mới bắt đầu tìm hiểu">Mới bắt đầu tìm hiểu</option>
                      <option value="Dưới 1 tháng">Dưới 1 tháng</option>
                      <option value="Từ 1 - 3 tháng">Từ 1 đến 3 tháng</option>
                      <option value="Từ 3 - 6 tháng">Từ 3 đến 6 tháng</option>
                      <option value="Từ 6 - 12 tháng">Từ 6 đến 12 tháng</option>
                      <option value="Trên 1 năm">Trên 1 năm</option>
                      <option value="Đang trực tiếp học/làm trong lĩnh vực">Đang trực tiếp học/làm trong lĩnh vực</option>
                    </select>
                  </div>
                </fieldset>

                <fieldset className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 sm:p-5">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <legend className="field-label">
                        <span className="field-number">8</span>
                        Bạn tự đánh giá mức độ hiểu biết của mình về nghề này như thế nào?
                      </legend>
                      <p className="mt-1.5 pl-9 text-xs leading-5 text-slate-500">
                        Chấm trên thang điểm 10. AI sẽ đối chiếu điểm này với những khía cạnh bạn đã tìm hiểu.
                      </p>
                    </div>

                    <div className="confidence-badge">
                      {formData.knowledgeScore}
                      <span>/10</span>
                    </div>
                  </div>

                  <input
                    aria-label="Mức độ hiểu biết về nghề"
                    type="range"
                    min="1"
                    max="10"
                    value={formData.knowledgeScore}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        knowledgeScore: Number.parseInt(event.target.value, 10),
                      }))
                    }
                    className="confidence-range"
                  />

                  <div className="mt-2.5 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                    <span>Biết rất ít</span>
                    <span>Hiểu rất rõ</span>
                  </div>
                </fieldset>

                <fieldset className="space-y-3">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <legend className="field-label">
                      <span className="field-number">9</span>
                      Bạn cảm thấy mình hiểu rõ những khía cạnh nào của nghề này?
                    </legend>
                    <span className="text-xs text-slate-500">Có thể chọn nhiều</span>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {understoodAspectOptions.map((option) => {
                      const selected = formData.understoodAspects.includes(option);

                      return (
                        <button
                          type="button"
                          key={option}
                          onClick={() => handleAspectToggle(option)}
                          className={`motivation-card ${selected ? "motivation-card-active" : ""}`}
                          aria-pressed={selected}
                        >
                          <span className="pr-3 text-left">{option}</span>
                          <span
                            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${
                              selected
                                ? "border-indigo-400 bg-indigo-500 text-white"
                                : "border-slate-700 text-transparent"
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>

              {/* 04 - MOTIVATION & CONCERNS */}
              <div className="space-y-5">
                <div className="flex items-start gap-3 border-b border-white/[0.06] pb-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-xs font-bold text-indigo-300">
                    04
                  </span>
                  <div>
                    <h3 className="font-bold text-white">Điều gì đang ảnh hưởng tới lựa chọn của bạn?</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Đây là phần giúp AI phân biệt giữa sở thích thật, kỳ vọng, ảnh hưởng bên ngoài và những nỗi lo còn chưa được giải đáp.
                    </p>
                  </div>
                </div>

                <fieldset className="space-y-3">
                  <label htmlFor="interest-reason" className="field-label">
                    <span className="field-number">10</span>
                    Điều gì khiến bạn quan tâm đến ngành/nghề này?
                  </label>
                  <textarea
                    id="interest-reason"
                    rows={3}
                    placeholder="Ví dụ: Tôi thích công nghệ, thấy công việc sáng tạo, thu nhập tốt, có người truyền cảm hứng..."
                    value={formData.interestReason}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        interestReason: event.target.value,
                      }))
                    }
                    className="form-control min-h-[110px] resize-y"
                  />
                </fieldset>

                <fieldset className="space-y-3">
                  <label htmlFor="source" className="field-label">
                    <span className="field-number">11</span>
                    Bạn biết đến nghề này chủ yếu thông qua đâu?
                  </label>
                  <div className="select-wrap">
                    <select
                      id="source"
                      value={formData.source}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          source: event.target.value,
                        }))
                      }
                      className="form-control appearance-none pr-11"
                    >
                      {sourceOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </fieldset>

                <fieldset className="space-y-3">
                  <label htmlFor="fit-reason" className="field-label">
                    <span className="field-number">12</span>
                    Điều gì khiến bạn tin rằng nghề này phù hợp với mình?
                  </label>
                  <textarea
                    id="fit-reason"
                    rows={3}
                    placeholder="Ví dụ: Điểm mạnh, sở thích, môn học, tính cách hoặc trải nghiệm khiến bạn nghĩ mình phù hợp..."
                    value={formData.fitReason}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        fitReason: event.target.value,
                      }))
                    }
                    className="form-control min-h-[110px] resize-y"
                  />
                </fieldset>

                <fieldset className="space-y-3">
                  <label htmlFor="concerns" className="field-label">
                    <span className="field-number">13</span>
                    Điều gì khiến bạn lo lắng hoặc còn phân vân về nghề này?
                  </label>
                  <textarea
                    id="concerns"
                    rows={3}
                    placeholder="Ví dụ: Sợ cạnh tranh, khó xin việc, áp lực cao, không chắc mình đủ giỏi..."
                    value={formData.concerns}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        concerns: event.target.value,
                      }))
                    }
                    className="form-control min-h-[110px] resize-y"
                  />
                </fieldset>

                <fieldset className="space-y-3">
                  <label htmlFor="want-to-know" className="field-label">
                    <span className="field-number">14</span>
                    Nếu được biết thêm về nghề này, bạn muốn tìm hiểu điều gì nhất?
                  </label>
                  <textarea
                    id="want-to-know"
                    rows={3}
                    placeholder="Ví dụ: Công việc thực tế, lương, lộ trình học, khả năng bị AI thay thế, cơ hội làm việc..."
                    value={formData.wantToKnowMost}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        wantToKnowMost: event.target.value,
                      }))
                    }
                    className="form-control min-h-[110px] resize-y"
                  />
                </fieldset>
              </div>

              <button type="submit" className="primary-cta group">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
                  <Sparkles className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block font-bold">Hoàn tất khảo sát & bắt đầu phân tích</span>
                  <span className="mt-0.5 block text-xs font-medium text-indigo-100/70">
                    AI sẽ dùng toàn bộ hồ sơ trên để xác định điểm cần đào sâu
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          </section>
        )}

        {activeTab === "chat" && (
          <section className="glass-panel flex h-[calc(100dvh-172px)] min-h-[470px] flex-col overflow-hidden rounded-[24px] sm:h-[calc(100dvh-190px)] sm:min-h-[560px] md:h-[76vh] md:min-h-[620px] md:rounded-[28px]">
            {!isFormSubmitted ? (
              <div className="m-auto max-w-md px-6 py-10 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-indigo-400/15 bg-indigo-500/10 text-indigo-300">
                  <CircleHelp className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-white">Chưa có dữ liệu khảo sát</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Hoàn thành bước 1 trước để AI có đủ bối cảnh và không trả lời theo kiểu chung chung.
                </p>
                <button type="button" onClick={() => setActiveTab("survey")} className="secondary-cta mt-6">
                  Về bước khảo sát
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3.5 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/15">
                      <Bot className="h-5 w-5" />
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0b1120] bg-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">AI Hướng nghiệp</p>
                      <p className="truncate text-xs text-slate-500">
                        Đang phân tích: <span className="text-slate-300">{careerDisplay}</span>
                      </p>
                    </div>
                  </div>

                  <button type="button" onClick={handleReset} className="ghost-button shrink-0" title="Đổi ngành nghề">
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Đổi ngành</span>
                  </button>
                </div>

                <div className="chat-scroll flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
                  {messages.length === 0 && (
                    <div className="mx-auto flex min-h-full max-w-lg flex-col items-center justify-center py-8 text-center">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-2xl" />
                        <div className="relative grid h-20 w-20 place-items-center rounded-3xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
                          <Sparkles className="h-8 w-8" />
                        </div>
                      </div>
                      <span className="mt-5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
                        Sẵn sàng phân tích
                      </span>
                      <h3 className="mt-3 text-xl font-bold text-white sm:text-2xl">
                        Bắt đầu với {careerDisplay}
                      </h3>
                      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                        AI sẽ nhìn cả cơ hội lẫn những phần ít được kể: cạnh tranh, áp lực, rào cản và khả năng phù hợp với chính bạn.
                      </p>
                      <button
                        type="button"
                        onClick={handleStartAnalysis}
                        disabled={isLoading}
                        className="primary-button mt-6"
                      >
                        <Sparkles className="h-4 w-4" />
                        Phân tích ngành ngay
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <div className="space-y-5">
                    {messages.map((message) => {
                      const isUser = message.role === "user";

                      return (
                        <div key={message.id} className={`flex items-end gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
                          {!isUser && (
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/10">
                              <Bot className="h-4 w-4" />
                            </div>
                          )}

                          <div className={`max-w-[88%] sm:max-w-[78%] ${isUser ? "order-first" : ""}`}>
                            <div
                              className={`message-bubble ${
                                isUser
                                  ? "message-user"
                                  : "message-assistant"
                              }`}
                            >
                              {message.parts.map((part, index) => {
                                if (part.type !== "text") return null;

                                if (isUser) {
                                  return (
                                    <p key={`${message.id}-${index}`} className="whitespace-pre-wrap">
                                      {part.text}
                                    </p>
                                  );
                                }

                                return (
                                  <div key={`${message.id}-${index}`} className="ai-markdown">
                                    <ReactMarkdown>{part.text}</ReactMarkdown>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {isUser && (
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {friendlyError && (
                      <div className="flex items-start gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-rose-400/20 bg-rose-400/10 text-rose-300">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div className="max-w-[88%] rounded-2xl border border-rose-400/15 bg-rose-400/[0.06] px-4 py-3 sm:max-w-[78%]">
                          <p className="text-sm font-semibold text-rose-200">
                            Chưa nhận được câu trả lời
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            {friendlyError}
                          </p>
                          <button
                            type="button"
                            onClick={handleRetry}
                            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Thử lại
                          </button>
                        </div>
                      </div>
                    )}

                    {isLoading && (
                      <div className="flex items-end gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-indigo-500 text-white">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="message-bubble message-assistant flex items-center gap-2.5 text-sm text-slate-400">
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-300" />
                          <span>Đang bóc tách dữ liệu và phản biện...</span>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="border-t border-white/[0.06] bg-[#080d1b]/90 p-3 backdrop-blur-xl sm:p-4">
                  <div className="chat-composer">
                    <textarea
                      ref={chatInputRef}
                      rows={1}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleChatKeyDown}
                      maxLength={MAX_MESSAGE_CHARS}
                      placeholder={`Hỏi thêm về ${careerDisplay}...`}
                      className="min-h-[48px] max-h-32 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600"
                    />
                    {isLoading ? (
                      <button
                        type="button"
                        onClick={stop}
                        className="send-button"
                        aria-label="Dừng tạo câu trả lời"
                        title="Dừng tạo câu trả lời"
                      >
                        <Square className="h-4.5 w-4.5 fill-current" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!input.trim()}
                        className="send-button"
                        aria-label="Gửi tin nhắn"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 px-1">
                    <p className="hidden text-[10px] text-slate-600 sm:block">
                      Enter để gửi · Shift + Enter để xuống dòng · AI có thể sai, hãy dùng bước Kiểm chứng khi cần.
                    </p>
                    <p
                      className={`ml-auto text-[10px] ${
                        input.length >= 2800 ? "text-amber-300" : "text-slate-600"
                      }`}
                    >
                      {input.length}/{MAX_MESSAGE_CHARS}
                    </p>
                  </div>
                </form>
              </>
            )}
          </section>
        )}

        {activeTab === "info" && (
          <section className="space-y-5">
            <div className="glass-panel rounded-[28px] p-5 sm:p-7 lg:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-300/[0.07] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200">
                    <Search className="h-3.5 w-3.5" />
                    Reality check
                  </div>
                  <h2 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-[28px]">
                    Đừng chỉ tin AI. Hãy tự kiểm chứng.
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400 sm:text-[15px]">
                    Các từ khóa dưới đây được tạo từ chính ngành bạn chọn để tìm những góc nhìn trái chiều, dữ liệu thị trường và trải nghiệm thật.
                  </p>
                </div>
              </div>
            </div>

            {!isFormSubmitted ? (
              <div className="glass-panel rounded-[24px] p-8 text-center sm:p-10">
                <CircleHelp className="mx-auto h-10 w-10 text-slate-600" />
                <h3 className="mt-4 font-bold text-slate-200">Chưa có ngành để kiểm chứng</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Hoàn thành khảo sát ở bước 1 để hệ thống tạo bộ từ khóa phù hợp.
                </p>
                <button type="button" onClick={() => setActiveTab("survey")} className="secondary-cta mt-5">
                  Đi tới khảo sát
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
                <div className="glass-panel rounded-[24px] p-4 sm:p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-400/10 text-rose-300">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Từ khóa “giải ảo”</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Mở Google để tìm góc khuất, phản biện và dữ liệu trái chiều.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      `${formData.targetJob} bão sa thải layoff`,
                      `Mặt trái của nghề ${formData.targetJob}`,
                      `Tại sao tôi bỏ nghề ${formData.targetJob}`,
                      `Áp lực kiệt sức burnout ngành ${formData.targetJob}`,
                      `Thực trạng lương fresher ${formData.targetJob} hiện nay`,
                    ].map((query) => (
                      <a
                        key={query}
                        href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="query-card group"
                      >
                        <span className="min-w-0 break-words font-mono text-xs leading-5 text-indigo-200 sm:text-sm">
                          {query}
                        </span>
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-slate-500 transition group-hover:border-indigo-400/20 group-hover:text-indigo-300">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </span>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="glass-panel rounded-[24px] p-5">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-400/10 text-indigo-300">
                      <Compass className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Nguồn nên kiểm tra</h3>
                      <p className="mt-1 text-xs text-slate-500">Ưu tiên trải nghiệm thật + dữ liệu thị trường.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        title: "Cộng đồng ẩn danh",
                        text: "Reddit, Voz, Quora — tìm các thread “bỏ nghề”, “kinh nghiệm xương máu”, “burnout”.",
                      },
                      {
                        title: "Báo cáo tuyển dụng",
                        text: "TopCV, ITviec, VietnamWorks — đối chiếu nhu cầu tuyển dụng, mức lương và độ cạnh tranh.",
                      },
                      {
                        title: "Người đang làm thật",
                        text: "Nhắn 1–2 Junior/Mid trên LinkedIn và hỏi điều họ ước mình biết trước khi vào nghề.",
                      },
                    ].map((item, index) => (
                      <div key={item.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                        <div className="flex gap-3">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-xs font-bold text-indigo-300">
                            {index + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-200">{item.title}</h4>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{item.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <nav className="mobile-nav md:hidden" aria-label="Điều hướng chính">
        {tabItems.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => goToTab(tab.id)}
              className={`mobile-nav-item ${active ? "mobile-nav-item-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {tab.id === "chat" && isFormSubmitted && (
                  <span className="absolute -right-1.5 -top-1 h-2 w-2 rounded-full border border-[#0a1020] bg-emerald-400" />
                )}
              </span>
              <span>{tab.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}