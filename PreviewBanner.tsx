import React from "react";

const PreviewBanner: React.FC<{ message?: string }> = ({ message }) => (
  <div className="mb-4 rounded-xl border border-white/20 bg-white/10 p-3 text-sm text-white">
    {message ?? "You’re viewing a preview. Log in to unlock full features."}{" "}
  </div>
);

export default PreviewBanner;
