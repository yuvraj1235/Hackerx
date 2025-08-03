"use client";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [uploadStatus, setUploadStatus] = useState("");
  const [chunks, setChunks] = useState<number | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
 

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadStatus("Uploading...");

    try {
      const res = await fetch("http://localhost:8000/upload/", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setUploadStatus("Upload complete");
      setChunks(data.chunks);
    } catch (err) {
      console.error(err);
      setUploadStatus("Upload failed");
    }
  };
  const handleQuery = async () => {
    if (!question.trim()) return;

    try {
      const res = await fetch("http://localhost:8000/query/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      setAnswer(data.answer);
    } catch (err) {
      console.error(err);
      setAnswer("Failed to get answer.");
    }
  };

  return (
    <div className="font-sans min-h-screen p-8 flex flex-col items-center gap-8">
      <h1 className="text-xl font-bold">Upload Policy Document</h1>

      <input
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        className="p-2 border"
      />
      <div className="mt-8 w-full max-w-md">
        <input
          type="text"
          placeholder="Ask a question about the document"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <button
          onClick={handleQuery}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Ask
        </button>
        {answer && (
          <p className="mt-4 p-2 bg-gray-100 rounded shadow">
            <strong>Answer:</strong> {answer}
          </p>
        )}
      </div>

      {uploadStatus && <p>{uploadStatus}</p>}
      {chunks !== null && <p>Document split into {chunks} chunks.</p>}
    </div>
  );
}
