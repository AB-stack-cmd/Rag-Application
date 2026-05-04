// lib/mockData.ts
export const conversations = [
  {
    _id: "1",
    title: "HTML Basics",
    jobId: "job1",
    messages: [
      { role: "user", content: "What is HTML?" },
      { role: "assistant", content: "HTML is the structure of web pages." },
    ],
  },
  {
    _id: "2",
    title: "CSS Notes",
    jobId: "job2",
    messages: [
      { role: "user", content: "What is CSS?" },
      { role: "assistant", content: "CSS styles the UI." },
    ],
  },
];