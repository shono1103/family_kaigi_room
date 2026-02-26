"use client";

import { useState } from "react";
import { Header } from "./header";
import { OwnTicketPanel } from "./ownTicketPanel";
import { BaseInfoPanel } from "./baseInfoPanel";

const tabs = [{ label: "保有チケット" }, { label: "基本情報" }] as const;

type HomeClientProps = {
  userEmail: string;
  userInfo: {
    name: string;
    role: string;
    symbolPubKey: string | null;
  } | null;
};

export function HomeClient({
  userEmail,
  userInfo,
}: HomeClientProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="min-h-screen bg-[radial-gradient(900px_600px_at_15%_15%,rgba(255,79,163,0.18),transparent_60%),radial-gradient(900px_600px_at_85%_25%,rgba(124,92,255,0.18),transparent_60%),linear-gradient(180deg,#fff4fb,#f2fbff)] bg-fixed bg-cover text-[#1e1e2a]">
      <div className="mx-auto my-10 max-w-[900px] px-4 pb-20">
        <Header tabs={tabs} activeIndex={activeIndex} onTabClick={setActiveIndex} />
        <main className="mt-6 rounded-[28px] bg-white/90 p-6 shadow-[0_18px_55px_rgba(20,15,45,0.18)]">
          <OwnTicketPanel isActive={activeIndex === 0} index={0} />
          <BaseInfoPanel
            isActive={activeIndex === 1}
            index={1}
            userEmail={userEmail}
            userInfo={userInfo}
          />
        </main>
      </div>
    </div>
  );
}
