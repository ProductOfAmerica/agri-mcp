import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'FieldMCP - Agricultural API Platform';
export const size = { width: 1200, height: 675 };
export const contentType = 'image/png';

export default function TwitterImage() {
  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#22c55e',
        backgroundImage: 'linear-gradient(to bottom, #22c55e, #16a34a)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            width: 40,
            height: 60,
            backgroundColor: 'white',
            borderRadius: 8,
          }}
        />
        <div
          style={{
            width: 40,
            height: 100,
            backgroundColor: 'white',
            borderRadius: 8,
          }}
        />
        <div
          style={{
            width: 40,
            height: 160,
            backgroundColor: 'white',
            borderRadius: 8,
          }}
        />
      </div>
      <div
        style={{
          fontSize: 72,
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '16px',
        }}
      >
        FIELD MCP
      </div>
      <div
        style={{
          fontSize: 32,
          color: 'white',
          opacity: 0.9,
        }}
      >
        Connect your AI to farm data in minutes
      </div>
    </div>,
    { ...size },
  );
}
