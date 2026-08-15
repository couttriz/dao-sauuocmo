import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";

// =========================================================
// DEMO / COMPETITION SAFETY SETTINGS
// Mục tiêu: BGK trải nghiệm thoải mái, rate limit chỉ là "safety net"
// =========================================================

const MAX_MESSAGE_LENGTH = 3_000;
const MAX_CONTEXT_MESSAGES = 30;
const MAX_CONTEXT_TEXT_LENGTH = 48_000;
const MAX_REQUEST_BYTES = 256 * 1024;

// Rộng hơn để nhiều BGK có thể dùng chung Wi-Fi / public IP
const IP_RATE_LIMIT = 100;
const IP_RATE_WINDOW = "10 m";

// Circuit breaker toàn app, chỉ nhằm chặn spam / loop bất thường
const GLOBAL_RATE_LIMIT = 2_000;
const GLOBAL_RATE_WINDOW = "1 h";

// Cho phép AI trả lời đủ sâu trong lúc demo
const MAX_OUTPUT_TOKENS = 3_000;

// =========================================================
// GOOGLE GEMINI PROVIDER
// =========================================================

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// =========================================================
// TYPES
// =========================================================

type SurveyData = {
  targetJob?: string;
  source?: string;
  searchTime?: string;
  motivations?: string[];
  confidence?: number;
};

type ChatRequestBody = {
  messages?: UIMessage[];
  formData?: SurveyData;
};

// =========================================================
// REDIS / RATE LIMIT
// Hỗ trợ cả biến môi trường chuẩn Upstash và một số tên KV cũ
// =========================================================

function createRedisClient() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL;

  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Redis({
    url,
    token,
  });
}

const redis = createRedisClient();

const ipRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        IP_RATE_LIMIT,
        IP_RATE_WINDOW
      ),
      prefix: "dao-sau-uoc-mo:demo:ip",
      analytics: false,
    })
  : null;

const globalRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        GLOBAL_RATE_LIMIT,
        GLOBAL_RATE_WINDOW
      ),
      prefix: "dao-sau-uoc-mo:demo:global",
      analytics: false,
    })
  : null;

// =========================================================
// HELPERS
// =========================================================

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function getMessagesTextLength(messages: UIMessage[]) {
  return messages.reduce(
    (total, message) => total + getMessageText(message).length,
    0
  );
}

function trimMessagesForModel(messages: UIMessage[]) {
  let trimmed = messages.slice(-MAX_CONTEXT_MESSAGES);

  while (
    trimmed.length > 1 &&
    getMessagesTextLength(trimmed) > MAX_CONTEXT_TEXT_LENGTH
  ) {
    trimmed = trimmed.slice(1);
  }

  return trimmed;
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  extraHeaders?: HeadersInit
) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

function getRetryAfterSeconds(reset: number) {
  return Math.max(
    1,
    Math.ceil((reset - Date.now()) / 1000)
  );
}

// =========================================================
// RATE LIMIT CHECK
// DEMO MODE = FAIL OPEN
//
// Nếu Upstash chưa cấu hình hoặc tạm thời lỗi:
// -> ghi log cảnh báo
// -> vẫn cho request đi tiếp
//
// Lý do: trong cuộc thi, không để Redis trở thành single point of failure.
// Validation và giới hạn token/context vẫn hoạt động bình thường.
// =========================================================

async function checkRateLimit(req: Request) {
  if (!ipRatelimit || !globalRatelimit) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "⚠️ RATE LIMIT BYPASSED: chưa tìm thấy Upstash Redis environment variables."
      );
    }

    return null;
  }

  const ip = getClientIp(req);

  try {
    const ipResult = await ipRatelimit.limit(ip);

    if (!ipResult.success) {
      const retryAfter =
        getRetryAfterSeconds(ipResult.reset);

      return jsonResponse(
        {
          error: "RATE_LIMITED",
          message:
            "Bạn đang gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau một chút.",
          retryAfter,
        },
        429,
        {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(ipResult.limit),
          "X-RateLimit-Remaining": String(
            ipResult.remaining
          ),
          "X-RateLimit-Reset": String(ipResult.reset),
        }
      );
    }

    const globalResult =
      await globalRatelimit.limit("all-users");

    if (!globalResult.success) {
      const retryAfter =
        getRetryAfterSeconds(globalResult.reset);

      return jsonResponse(
        {
          error: "GLOBAL_RATE_LIMITED",
          message:
            "Hệ thống đang có lượng truy cập bất thường. Vui lòng thử lại sau.",
          retryAfter,
        },
        429,
        {
          "Retry-After": String(retryAfter),
        }
      );
    }

    return null;
  } catch (error) {
    // DEMO-FIRST:
    // Redis lỗi không được làm trang demo của BGK chết.
    console.warn(
      "⚠️ Không kiểm tra được Upstash rate limit. Cho request tiếp tục để bảo đảm trải nghiệm demo.",
      error
    );

    return null;
  }
}

// =========================================================
// POST /api/chat
// =========================================================

export async function POST(req: Request) {
  try {
    // -----------------------------------------------------
    // 1. BASIC REQUEST SIZE CHECK
    // -----------------------------------------------------

    const contentLength = Number(
      req.headers.get("content-length") || "0"
    );

    if (
      Number.isFinite(contentLength) &&
      contentLength > MAX_REQUEST_BYTES
    ) {
      return jsonResponse(
        {
          error: "REQUEST_TOO_LARGE",
          message: "Yêu cầu quá lớn.",
        },
        413
      );
    }

    // -----------------------------------------------------
    // 2. RATE LIMIT
    // -----------------------------------------------------

    const rateLimitResponse =
      await checkRateLimit(req);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // -----------------------------------------------------
    // 3. RECEIVE + VALIDATE BODY
    // -----------------------------------------------------

    let body: ChatRequestBody;

    try {
      body =
        (await req.json()) as ChatRequestBody;
    } catch {
      return jsonResponse(
        {
          error: "INVALID_JSON",
          message: "Dữ liệu gửi lên không hợp lệ.",
        },
        400
      );
    }

    const serializedSize =
      new TextEncoder().encode(
        JSON.stringify(body)
      ).byteLength;

    if (serializedSize > MAX_REQUEST_BYTES) {
      return jsonResponse(
        {
          error: "REQUEST_TOO_LARGE",
          message: "Yêu cầu quá lớn.",
        },
        413
      );
    }

    const messages = Array.isArray(body.messages)
      ? body.messages
      : [];

    const formData = body.formData;

    if (messages.length === 0) {
      return jsonResponse(
        {
          error: "NO_MESSAGES",
          message: "Chưa có tin nhắn để gửi tới AI.",
        },
        400
      );
    }

    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");

    if (!latestUserMessage) {
      return jsonResponse(
        {
          error: "NO_USER_MESSAGE",
          message: "Không tìm thấy tin nhắn người dùng.",
        },
        400
      );
    }

    const latestText =
      getMessageText(latestUserMessage).trim();

    if (!latestText) {
      return jsonResponse(
        {
          error: "EMPTY_MESSAGE",
          message: "Tin nhắn không được để trống.",
        },
        400
      );
    }

    if (
      latestText.length > MAX_MESSAGE_LENGTH
    ) {
      return jsonResponse(
        {
          error: "MESSAGE_TOO_LONG",
          message: `Tin nhắn tối đa ${MAX_MESSAGE_LENGTH.toLocaleString(
            "vi-VN"
          )} ký tự.`,
          maxLength: MAX_MESSAGE_LENGTH,
        },
        413
      );
    }

    // -----------------------------------------------------
    // 4. LIMIT CONTEXT SENT TO GEMINI
    // UI vẫn có thể giữ lịch sử dài hơn,
    // nhưng model chỉ nhận phần context gần nhất.
    // -----------------------------------------------------

    const modelUiMessages =
      trimMessagesForModel(messages);

    const coreMessages =
      await convertToModelMessages(
        modelUiMessages
      );

    // -----------------------------------------------------
    // 5. DETECT FIRST MESSAGE
    // -----------------------------------------------------

    const isFirstMessage =
      coreMessages.length <= 1;

    const taskInstruction = isFirstMessage
      ? `- Nhiệm vụ ngay lúc này: Nhận chào người dùng bằng tên ngành họ đã chọn (${formData?.targetJob}), xác nhận lại động cơ của họ, và bắt đầu bước vào GIAI ĐOẠN 3.`
      : `- Nhiệm vụ ngay lúc này: Trả lời trực tiếp câu hỏi của người dùng, duy trì phản biện và TUYỆT ĐỐI KHÔNG lặp lại câu chào.`;

    // -----------------------------------------------------
    // 6. SYSTEM PROMPT
    // Giữ nguyên logic hướng nghiệp cốt lõi
    // -----------------------------------------------------

    const systemPrompt = `
Bạn là Chuyên gia Tư vấn Hướng nghiệp của hệ thống "Đào Sâu Ước Mơ".

Mục tiêu duy nhất:
Hỗ trợ người dùng có góc nhìn thực tế nhất về ngành nghề, BÓC TÁCH HOÀN TOÀN THIÊN LỆCH SỐNG SÓT (Survivorship Bias).

THÔNG TIN KHẢO SÁT BAN ĐẦU:
- Ngành nghề quan tâm: ${formData?.targetJob || "Chưa xác định"}
- Nguồn biết đến: ${formData?.source || "Chưa rõ"}
- Thời gian tìm hiểu: ${formData?.searchTime || "Mới tìm hiểu"}
- Động cơ lựa chọn: ${
      formData?.motivations?.join(", ") ||
      "Chưa chia sẻ"
    }
- Mức độ tự tin: ${
      formData?.confidence ?? 5
    }/10

QUY TRÌNH HƯỚNG NGHIỆP:

- Giai đoạn 3 (Bóc tách toàn diện ngành nghề):
Chủ động phân tích 2 mặt:
Bề nổi (Lộ trình, cơ hội)
VÀ
Góc khuất (Áp lực, tỷ lệ đào thải, sự cạnh tranh, những rào cản ít ai nói).

- Giai đoạn 4 (Phản biện Socratic):
Đặt các câu hỏi xoáy sâu để phản biện lại các suy nghĩ màu hồng của người dùng.

YÊU CẦU NGUYÊN TẮC:

- Luôn cân bằng giữa mặt TÍCH CỰC và HẠN CHẾ của ngành.

- DẪN DẮT BẰNG CÂU HỎI GỢI MỞ ở cuối mỗi câu trả lời.

${taskInstruction}
`;

    // -----------------------------------------------------
    // 7. CALL GEMINI
    // -----------------------------------------------------

    const result = streamText({
      model: google("gemini-3.5-flash"),
      system: systemPrompt,
      messages: coreMessages,

      maxOutputTokens: MAX_OUTPUT_TOKENS,

      onFinish: (event) => {
        console.log(
          `✅ Gemini hoàn tất phản hồi (${event.text.length} ký tự).`
        );
      },
    });

    // -----------------------------------------------------
    // 8. RETURN STANDARD AI SDK UI STREAM
    // -----------------------------------------------------

    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    console.error(
      "❌ LỖI KẾT NỐI API:",
      message
    );

    return jsonResponse(
      {
        error: "AI_ERROR",
        message:
          "AI tạm thời không thể phản hồi. Vui lòng thử lại.",
      },
      500
    );
  }
}