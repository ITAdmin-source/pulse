"use client";

interface InsightShareExportProps {
  emoji: string;
  profile: string;
  description: string;
  pollQuestion: string;
}

/**
 * InsightShareExport - v2.0 card optimized for image capture
 * Uses inline styles instead of Tailwind classes for reliable html-to-image rendering
 * Matches insight-detail-modal styling with white background and poll context
 */
export function InsightShareExport({
  emoji,
  profile,
  description,
  pollQuestion
}: InsightShareExportProps) {
  return (
    <div
      style={{
        width: '600px',
        height: '900px',
        margin: '0',
        padding: '48px',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {/* Poll Context - Above the card */}
      <div style={{
        marginBottom: '24px',
        textAlign: 'right',
        direction: 'rtl',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          justifyContent: 'flex-end',
        }}>
          <span style={{
            fontSize: '14px',
            color: '#9333ea',
            fontWeight: '600',
          }}>
            תובנה אישית מהדיון
          </span>
          <span style={{ fontSize: '16px' }}>💬</span>
        </div>
        <p style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#1f2937',
          lineHeight: '1.4',
          margin: '0',
        }}>
          {pollQuestion}
        </p>
      </div>

      {/* Insight Card - Gradient background */}
      <div
        style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)',
        }}
      >
        {/* Decorative background circles */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            right: '0',
            width: '256px',
            height: '256px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            transform: 'translate(50%, -50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            width: '192px',
            height: '192px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            transform: 'translate(-50%, 50%)',
          }}
        />

        {/* Card content */}
        <div
          style={{
            position: 'relative',
            padding: '40px 32px',
            zIndex: 1,
          }}
        >
          {/* Profile Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}>
            <span style={{ fontSize: '48px', lineHeight: '1' }}>{emoji}</span>
            <div>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '4px',
              }}>
                פרופיל ההשפעה שלך
              </div>
              <h2
                style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#ffffff',
                  lineHeight: '1.2',
                  direction: 'rtl',
                  margin: '0',
                }}
              >
                {profile}
              </h2>
            </div>
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: '15px',
              color: 'rgba(255, 255, 255, 0.95)',
              lineHeight: '1.7',
              whiteSpace: 'pre-line',
              textAlign: 'right',
              direction: 'rtl',
              margin: '0',
            }}
          >
            {description}
          </p>
        </div>
      </div>

      {/* Footer - Date Only */}
      <div style={{
        marginTop: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingTop: '24px',
        borderTop: '2px solid #e5e7eb',
      }}>
        <div style={{
          fontSize: '13px',
          color: '#6b7280',
        }}>
          {new Date().toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </div>
      </div>
    </div>
  );
}
