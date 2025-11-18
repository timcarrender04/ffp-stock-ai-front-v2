import { ImageResponse } from "next/og";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Icon generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "6px",
        }}
      >
        <svg
          fill="none"
          height="28"
          viewBox="0 0 28 28"
          width="28"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Moon */}
          <circle cx="20" cy="8" fill="#FDB813" opacity="0.9" r="4" />
          <circle cx="21" cy="7" fill="#667eea" opacity="0.3" r="3" />

          {/* Rocket body */}
          <path d="M14 4 L16 4 L17 12 L13 12 Z" fill="#FFFFFF" />

          {/* Rocket nose cone */}
          <path d="M15 2 L17 4 L13 4 Z" fill="#E0E7FF" />

          {/* Rocket window */}
          <circle cx="15" cy="7" fill="#667eea" r="1.5" />

          {/* Rocket fins */}
          <path d="M13 10 L11 14 L13 12 Z" fill="#FDB813" />
          <path d="M17 10 L19 14 L17 12 Z" fill="#FDB813" />

          {/* Rocket flames */}
          <ellipse
            cx="14"
            cy="13.5"
            fill="#FF6B6B"
            opacity="0.8"
            rx="0.8"
            ry="2"
          />
          <ellipse
            cx="15"
            cy="14"
            fill="#FFA500"
            opacity="0.9"
            rx="1"
            ry="2.5"
          />
          <ellipse
            cx="16"
            cy="13.5"
            fill="#FFFF00"
            opacity="0.7"
            rx="0.8"
            ry="2"
          />

          {/* Stars */}
          <circle cx="8" cy="6" fill="#FFFFFF" opacity="0.8" r="0.5" />
          <circle cx="10" cy="10" fill="#FFFFFF" opacity="0.6" r="0.5" />
          <circle cx="22" cy="14" fill="#FFFFFF" opacity="0.7" r="0.5" />
          <circle cx="6" cy="12" fill="#FFFFFF" opacity="0.5" r="0.5" />
        </svg>
      </div>
    ),
    {
      ...size,
    },
  );
}
