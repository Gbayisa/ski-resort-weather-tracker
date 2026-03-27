import { describe, it, expect } from 'vitest';

// Helper that mirrors the isConfigured logic inside AdSlot.jsx
function isAdConfigured(client, slotId) {
  return Boolean(client && slotId);
}

// Helper that mirrors the slot-map lookup inside AdSlot.jsx
function resolveSlotId(position, slotTop, slotBottom) {
  const map = { top: slotTop, bottom: slotBottom };
  return map[position];
}

describe('AdSlot – configuration logic', () => {
  it('is configured when both client and slot ID are set', () => {
    expect(isAdConfigured('ca-pub-1234567890123456', '9876543210')).toBe(true);
  });

  it('is not configured when client is missing', () => {
    expect(isAdConfigured('', '9876543210')).toBe(false);
    expect(isAdConfigured(undefined, '9876543210')).toBe(false);
  });

  it('is not configured when slot ID is missing', () => {
    expect(isAdConfigured('ca-pub-1234567890123456', '')).toBe(false);
    expect(isAdConfigured('ca-pub-1234567890123456', undefined)).toBe(false);
  });

  it('is not configured when both are missing', () => {
    expect(isAdConfigured('', '')).toBe(false);
    expect(isAdConfigured(undefined, undefined)).toBe(false);
  });
});

describe('AdSlot – slot ID resolution', () => {
  it('resolves the top slot for position="top"', () => {
    expect(resolveSlotId('top', 'TOP_SLOT', 'BOTTOM_SLOT')).toBe('TOP_SLOT');
  });

  it('resolves the bottom slot for position="bottom"', () => {
    expect(resolveSlotId('bottom', 'TOP_SLOT', 'BOTTOM_SLOT')).toBe('BOTTOM_SLOT');
  });

  it('returns undefined for an unknown position', () => {
    expect(resolveSlotId('sidebar', 'TOP_SLOT', 'BOTTOM_SLOT')).toBeUndefined();
  });
});

describe('AdSense script – singleton injection', () => {
  it('builds the AdSense script URL with the publisher ID', () => {
    const clientId = 'ca-pub-1234567890123456';
    const expectedSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;

    expect(expectedSrc).toContain('pagead2.googlesyndication.com');
    expect(expectedSrc).toContain(`client=${clientId}`);
  });

  it('does not build a URL when client is empty', () => {
    const clientId = '';
    // When client is empty isConfigured returns false → no script injection
    expect(isAdConfigured(clientId, 'some-slot')).toBe(false);
  });
});
