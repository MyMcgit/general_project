import { useState } from "react";

export default function App() {
  const [question, setQuestion] = useState("");
  const [data, setData] = useState("");
  const [resonData, setResonData] = useState("");

  const api = "https://api.deepseek.com/chat/completions";

  // 请求大模型api，实时渲染数据
  const fetchData = () => {
    const body = {
      model: "deepseek-v4-pro",
      messages: [
        { role: "system", content: "你是一个AI助手" }, //AI角色设定
        { role: "user", content: question }, //用户的问题
      ],
      thinking: { type: "enabled" },
      reasoning_effort: "high",
      stream: true,
    };

    fetch(api, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${"sk-46fd4b9f7ddc4e7b805410776474fcfc"}`, //API密钥
      },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        let currentData = "";
        let currentResonData = "";
        let buffer = ""; //用来拼接不完整的数据块
        const stream = res.body?.pipeThrough(new TextDecoderStream());
        // 循环读取
        for await (const chunk of stream ?? []) {
          buffer += chunk;
          const lines = buffer.split("\n");
          // 保留最后不完整的一行(SEE协议最后一行可能不完整)
          buffer = lines.pop() || "";
          // 处理每行数据
          for (const line of lines) {
            // 解析SSE行，解析data开头的内容
            if (line.startsWith("data: ")) {
              const content = line.slice(6); //去除data后面的字符串
              // 特殊标记，遇到DONE，退出
              if (content === "[DONE]") return;
              // 拿到数据，先打印一下
              console.log(JSON.parse(content).choices[0].delta);
              // 页面数据拼接
              currentData += JSON.parse(content).choices[0].delta.content ?? "";
              currentResonData +=
                JSON.parse(content).choices[0].delta.reasoning_content ?? "";
              // 更新页面数据
              setData(currentData);
              setResonData(currentResonData);
            }
          }
        }
      })
      .catch((e) => {
        console.error(e);
      });
  };

  return (
    <div style={{ padding: "20px", textAlign: "center", width: "80vw" }}>
      <input type="text" onChange={(e) => setQuestion(e.target.value)} />
      <button onClick={fetchData}>发送</button>
      <p
        key={1}
        style={{ minHeight: "100px", textAlign: "left", border: "1px solid blue" }}
      >
        思考：{resonData}
      </p>
      <p key={2} style={{ minHeight: "100px", textAlign: "left" }}>
        结论：{data}
      </p>
    </div>
  );
}
