import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Trash2Treasure | Turn Trash into Rewards & Save the Planet";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
          color: "#ffffff",
          padding: "80px",
          position: "relative",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Background decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "-150px",
            left: "-150px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "rgba(16, 185, 129, 0.15)",
            filter: "blur(60px)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-200px",
            right: "-200px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "rgba(5, 150, 105, 0.2)",
            filter: "blur(80px)",
            display: "flex",
          }}
        />

        {/* Brand Tag / Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(255, 255, 255, 0.1)",
            padding: "10px 24px",
            borderRadius: "50px",
            fontSize: "20px",
            fontWeight: "600",
            color: "#34d399",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            marginBottom: "30px",
          }}
        >
          ♻️ Telangana&apos;s Green Revolution
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "76px",
            fontWeight: "900",
            textAlign: "center",
            margin: "0 0 20px 0",
            lineHeight: "1.1",
            letterSpacing: "-0.03em",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span>Turn Your Trash Into</span>
          <span style={{ color: "#10b981", marginTop: "5px" }}>Treasure</span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "28px",
            fontWeight: "500",
            color: "#94a3b8",
            textAlign: "center",
            margin: "0 0 40px 0",
            maxWidth: "800px",
            lineHeight: "1.5",
          }}
        >
          Gamified waste management platform that rewards you for responsible recycling.
        </p>

        {/* Footer info / URL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            fontSize: "24px",
            fontWeight: "700",
            color: "#ffffff",
          }}
        >
          <span>trash2treasure.co.in</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
