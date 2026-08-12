import { createGoogleGenerativeAI } from "@ai-sdk/google";

import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";

// =========================================================
// GOOGLE GEMINI PROVIDER
// =========================================================

const google = createGoogleGenerativeAI({
  apiKey:
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
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
// POST /api/chat
// =========================================================

export async function POST(req: Request) {
  try {
    // -----------------------------------------------------
    // 1. RECEIVE DATA FROM FRONTEND
    // -----------------------------------------------------

    const body =
      (await req.json()) as ChatRequestBody;

    const {
      messages = [],
      formData,
    } = body;

    // -----------------------------------------------------
    // 2. CONVERT useChat UI MESSAGES
    //    -> MODEL MESSAGES FOR streamText()
    // -----------------------------------------------------

    const coreMessages =
      await convertToModelMessages(messages);

    // -----------------------------------------------------
    // 3. DETECT FIRST MESSAGE
    // -----------------------------------------------------

    const isFirstMessage =
      coreMessages.length <= 1;

    const taskInstruction = isFirstMessage
      ? `- Nhiệm vụ ngay lúc này: Nhận chào người dùng bằng tên ngành họ đã chọn (${formData?.targetJob}), xác nhận lại động cơ của họ, và bắt đầu bước vào GIAI ĐOẠN 3.`
      : `- Nhiệm vụ ngay lúc này: Trả lời trực tiếp câu hỏi của người dùng, duy trì phản biện và TUYỆT ĐỐI KHÔNG lặp lại câu chào.`;

    // -----------------------------------------------------
    // 4. SYSTEM PROMPT
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
    // 5. CALL GEMINI
    // -----------------------------------------------------

    const result = streamText({
      model: google("gemini-3.5-flash"),

      system: systemPrompt,

      messages: coreMessages,

      onFinish: (event) => {
        console.log(
          "\n=================================================="
        );

        console.log(
          "🤖 GEMINI ĐÃ TRẢ LỜI THÀNH CÔNG:"
        );

        console.log(event.text);

        console.log(
          "==================================================\n"
        );
      },
    });

    // -----------------------------------------------------
    // 6. RETURN STANDARD AI SDK UI STREAM
    // -----------------------------------------------------

    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    // -----------------------------------------------------
    // ERROR HANDLING
    // -----------------------------------------------------

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    console.error(
      "❌ LỖI KẾT NỐI API:",
      message
    );

    return new Response(
      "Có lỗi xảy ra khi kết nối AI.",
      {
        status: 500,
      }
    );
  }
}