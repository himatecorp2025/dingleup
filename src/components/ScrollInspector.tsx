import { useState, useEffect } from 'react';
import { useScrollInspector } from '@/hooks/useScrollInspector';

export const ScrollInspector = () => {
  const [visible, setVisible] = useState(false);
  const metrics = useScrollInspector(visible);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+Alt+S
      if (e.ctrlKey && e.altKey && e.key === 's') {
        setVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [visible]);

  if (!visible) return null;

  const timeSinceLastScroll = Date.now() - metrics.lastScrollToBottomTime;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '16px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#0f0',
        padding: '12px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '11px',
        zIndex: 99999,
        border: '2px solid #0f0',
        maxWidth: '300px',
        lineHeight: '1.5'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#0ff' }}>
        📊 SCROLL INSPECTOR (Ctrl+Alt+S)
      </div>
      <div>scrollTop: {Math.round(metrics.scrollTop)}px</div>
      <div>clientHeight: {metrics.clientHeight}px</div>
      <div>scrollHeight: {metrics.scrollHeight}px</div>
      <div style={{ color: metrics.atBottom ? '#0f0' : '#f00', fontWeight: 'bold' }}>
        atBottom: {metrics.atBottom ? 'TRUE ✓' : 'FALSE ✗'}
      </div>
      <div style={{ marginTop: '8px', borderTop: '1px solid #0f0', paddingTop: '8px' }}>
        Last scrollToBottom():
        <div style={{ color: '#ff0' }}>• {metrics.lastScrollToBottomSource}</div>
        <div style={{ color: '#888' }}>• {timeSinceLastScroll}ms ago</div>
      </div>
      <div style={{ marginTop: '8px', color: '#0ff' }}>
        Root: {metrics.activeScrollRoot}
      </div>
    </div>
  );
};
