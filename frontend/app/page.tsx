"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const r = useRouter();

  return (
    <main className="landing">
      <div className="bg-grid" />
      <div className="glow-orb" />
      
      {/* HERO */}
      <section className="hero">
        <div className="badge">AI-Powered Skincare Advisor</div>

        <h1 className="title">
          Groom<span>AI</span>
        </h1>

        <p className="tagline">
          Personalized skincare that remembers you. <br />
          <span>Smart analysis. Practical routines. Zero confusion.</span>
        </p>

        <button className="cta" onClick={() => r.push("/chat")}>
          Start Skin Analysis
        </button>
      </section>

      {/* FEATURES */}
      <section className="bento-grid">
        <div className="bento-item">
          <h3>Vision-Based Skin Analysis</h3>
          <p>
            Upload a photo to get a basic skin assessment and visible concern
            detection—helpful even if you don’t know your skin type.
          </p>
        </div>

        <div className="bento-item">
          <h3>Inventory Awareness</h3>
          <p>
            GroomAI tracks the products you already own and builds routines
            around them instead of recommending duplicates.
          </p>
        </div>

        <div className="bento-item">
          <h3>Short & Long-Term Context Memory</h3>
          <p>
            Remembers recent conversations for flow and long-term preferences
            for consistency—no repeating yourself every time.
          </p>
        </div>

        <div className="bento-item">
          <h3>India-Focused Guidance</h3>
          <p>
            Advice tailored for Indian skin concerns, climate, and availability—
            not generic global recommendations.
          </p>
        </div>

        <div className="bento-item">
          <h3>Budget-Aware Recommendations</h3>
          <p>
            Product suggestions respect your budget, with prices shown in ₹ and
            clear reasoning behind every recommendation.
          </p>
        </div>

        <div className="bento-item">
          <h3>Fast, Engaging Advisor Bot</h3>
          <p>
            A responsive, judgment-free assistant that gives clear, practical
            skincare advice—without overwhelming or lecturing.
          </p>
        </div>
      </section>
    </main>
  );
}
