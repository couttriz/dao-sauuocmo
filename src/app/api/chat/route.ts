import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, formData } = body;

    const coreMessages = (messages || []).map((m: any) => ({
      role: m.role,
      content: String(m.content || ""), 
    }));

    // Giữ nguyên logic chữa bệnh "mất trí nhớ" của AI
    const isFirstMessage = coreMessages.length <= 1;
    const taskInstruction = isFirstMessage
      ? `- Nhiệm vụ ngay lúc này: Nhận chào người dùng bằng tên ngành họ đã chọn (${formData?.targetJob}), xác nhận lại động cơ của họ, và bắt đầu bước vào GIAI ĐOẠN 3.`
      : `- Nhiệm vụ ngay lúc này: Trả lời trực tiếp câu hỏi của người dùng, duy trì phản biện và TUYỆT ĐỐI KHÔNG lặp lại câu chào.`;

    const systemPrompt = `
Bạn là Chuyên gia Tư vấn Hướng nghiệp của hệ thống "Đào Sâu Ước Mơ".
Mục tiêu duy nhất: Hỗ trợ người dùng có góc nhìn thực tế nhất về ngành nghề, BÓC TÁCH HOÀN TOÀN THIÊN LỆCH SỐNG SÓT (Survivorship Bias).

THÔNG TIN KHẢO SÁT BAN ĐẦU:
- Ngành nghề quan tâm: ${formData?.targetJob || "Chưa xác định"}
- Nguồn biết đến: ${formData?.source || "Chưa rõ"}
- Thời gian tìm hiểu: ${formData?.searchTime || "Mới tìm hiểu"}
- Động cơ lựa chọn: ${formData?.motivations?.join(", ") || "Chưa chia sẻ"}
- Mức độ tự tin: ${formData?.confidence || 5}/10

QUY TRÌNH HƯỚNG NGHIỆP:
- Giai đoạn 3 (Bóc tách toàn diện ngành nghề): Chủ động phân tích 2 mặt: Bề nổi (Lộ trình, cơ hội) VÀ Góc khuất (Áp lực, tỷ lệ đào thải, sự cạnh tranh, những rào cản ít ai nói).
- Giai đoạn 4 (Phản biện Socratic): Đặt các câu hỏi xoáy sâu để phản biện lại các suy nghĩ màu hồng của người dùng.

YÊU CẦU NGUYÊN TẮC:
- Luôn cân bằng giữa mặt TÍCH CỰC và HẠN CHẾ của ngành.
- DẪN DẮT BẰNG CÂU HỎI GỢI MỞ ở cuối mỗi câu trả lời.
${taskInstruction}
`;

    const result = streamText({
      model: google("gemini-3.5-flash"), 
      system: systemPrompt,
      messages: coreMessages,
      // Đã thêm lại hàm in Log để bạn theo dõi trong Terminal
      onFinish: (event) => {
        console.log("\n==================================================");
        console.log("🤖 GEMINI ĐÃ TRẢ LỜI THÀNH CÔNG:");
        console.log(event.text);
        console.log("==================================================\n");
      }
    });

    // BÍ QUYẾT CHỐNG LỖI TỐI THƯỢNG: Tự bọc luồng dữ liệu chuẩn Vercel AI Protocol
    // Không dùng hàm toXStreamResponse nào nữa để tránh xung đột phiên bản!
    const stream = new ReadableStream({
      async start(controller) {
        const reader = result.textStream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // Mã hóa dữ liệu theo đúng chuẩn (0:"nội dung") mà Frontend useChat yêu cầu
            const formattedChunk = `0:${JSON.stringify(value)}\n`;
            controller.enqueue(new TextEncoder().encode(formattedChunk));
          }
        } finally {
          reader.releaseLock();
          controller.close();
        }
      }
    });

    // Ép Next.js gửi từng chữ ngay lập tức, không được "ngâm" dữ liệu (nosniff)
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error: any) {
    console.error("❌ LỖI KẾT NỐI API:", error?.message || error);
    return new Response("Có lỗi xảy ra khi kết nối AI.", { status: 500 });
  }
}