"use client";

interface InsightCardExportProps {
  title: string;
  body: string;
  pollQuestion: string;
}

/**
 * InsightCardExport - Simplified card optimized for image capture
 * Uses inline styles instead of Tailwind classes for reliable html-to-image rendering
 */
export function InsightCardExport({ title, body, pollQuestion }: InsightCardExportProps) {
  // Extract emoji from title (format: "🌟 Title Text")
  const emojiMatch = title.match(/^([\p{Emoji}\u{FE0F}\u{200D}]+)\s*(.+)$/u);
  const emoji = emojiMatch ? emojiMatch[1] : "✨";
  const titleText = emojiMatch ? emojiMatch[2] : title;

  return (
    <div
      style={{
        width: '500px',
        height: '750px',
        margin: '0',
        padding: '50px',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* The actual card */}
      <div
        style={{
          width: '400px',
          height: '600px',
          position: 'relative',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, #ddd6fe 0%, #e0e7ff 50%, #dbeafe 100%)',
          border: '8px solid rgba(255, 255, 255, 0.2)',
        }}
      >
      {/* Card content */}
      <div
        style={{
          position: 'relative',
          padding: '32px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1,
        }}
      >
        {/* Top Section - Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {/* Hero Emoji */}
          <div style={{ fontSize: '60px', marginBottom: '12px' }}>
            {emoji}
          </div>

          {/* "Personal Insight" Badge */}
          <div style={{ marginBottom: '12px' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 16px',
                backgroundColor: '#e0e7ff',
                color: '#4338ca',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderRadius: '9999px',
                border: '1px solid #c7d2fe',
              }}
            >
              תובנה אישית
            </span>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '12px', padding: '0 16px' }}>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#111827',
                lineHeight: '1.3',
                direction: 'rtl',
              }}
            >
              {titleText}
            </h2>
          </div>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'rgba(129, 140, 248, 0.5)',
              }}
            />
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'rgba(129, 140, 248, 0.5)',
              }}
            />
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'rgba(129, 140, 248, 0.5)',
              }}
            />
          </div>

          {/* Body */}
          <div
            style={{
              flex: 1,
              padding: '0 24px',
              maxHeight: '280px',
              overflow: 'hidden',
            }}
          >
            <p
              style={{
                fontSize: '15px',
                color: '#1f2937',
                lineHeight: '1.6',
                whiteSpace: 'pre-line',
                textAlign: 'justify',
                direction: 'rtl',
              }}
            >
              {body}
            </p>
          </div>
        </div>

        {/* Bottom Section - Metadata */}
        <div
          style={{
            width: '100%',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(199, 210, 254, 0.5)',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              color: '#6b7280',
              textAlign: 'center',
              marginBottom: '8px',
              padding: '0 16px',
              lineHeight: '1.4',
              direction: 'rtl',
            }}
          >
            {pollQuestion}
          </p>
          <p
            style={{
              fontSize: '11px',
              color: '#9ca3af',
              textAlign: 'center',
            }}
          >
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Subtle pattern overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
          pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      </div>
    </div>
  );
}
