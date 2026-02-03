"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const r = useRouter();

  return (
    <main className="landing">
      <div className="bg-grid" />
      <div className="glow-orb" />
      
      <section className="hero">
        <div className="badge">AI-Powered Precision</div>
        <h1 className="title">
          Groom<span>AI</span>
        </h1>
        <p className="tagline">
          Your skin's digital twin. <br /> 
          <span>Real-time analysis. Personalized protocols.</span>
        </p>
        <button className="cta" onClick={() => r.push("/chat")}>
          Launch Analysis
        </button>
      </section>

      <section className="bento-grid">
        <div className="bento-item">
          <h3>Computer Vision</h3>
          <p>Scan pores, texture, and tone with clinical accuracy.</p>
        </div>
        <div className="bento-item">
          <h3>Agentic Intelligence</h3>
          <p>Multi-agent systems tailored to your specific skin type.</p>
        </div>
        <div className="bento-item">
          <h3>Regimen Tracking</h3>
          <p>Watch your progress evolve with data-driven insights.</p>
        </div>
      </section>
    </main>
  );
}