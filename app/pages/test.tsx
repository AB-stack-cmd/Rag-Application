"use client"
import { useState } from "react";

export default function App() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runJob = async () => {
    setLoading(true);
    setResult(null);

    const res = await fetch("http://localhost:4000/job");
    const data = await res.text();

    console.log(data)

    setResult(data);
    setLoading(false);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Simple Worker Test</h1>

      <button onClick={runJob}>
        {loading ? "Processing..." : "Run Job"}
      </button>

      {result && (
        <pre>{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}