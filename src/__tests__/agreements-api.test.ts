import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: (table: string) => {
      mockFrom(table);
      return {
        select: (cols: string) => {
          mockSelect(cols);
          return {
            order: (col: string, opts: Record<string, boolean>) => {
              mockOrder(col, opts);
              return { data: [{ id: '1', document_type: 'billOfSale', status: 'pending' }], error: null };
            },
            single: () => {
              mockSingle();
              return { data: { id: '1', document_type: 'billOfSale' }, error: null };
            },
          };
        },
        insert: (data: Record<string, unknown>) => {
          mockInsert(data);
          return {
            select: () => ({
              single: () => {
                mockSingle();
                return { data: { id: '1', ...data }, error: null };
              },
            }),
          };
        },
        update: (data: Record<string, unknown>) => {
          mockUpdate(data);
          return {
            eq: (col: string, val: string) => {
              mockEq(col, val);
              return {
                select: () => ({
                  single: () => {
                    mockSingle();
                    return { data: { id: val, ...data }, error: null };
                  },
                }),
              };
            },
          };
        },
      };
    },
  }),
}));

// Mock crypto.subtle for admin token verification
const ADMIN_SECRET = 'dev-secret-triple-j';

async function createTestToken(): Promise<string> {
  const timestamp = Date.now().toString();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ADMIN_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(timestamp));
  const signature = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${timestamp}.${signature}`;
}

function makeRequest(method: string, body?: Record<string, unknown>, token?: string): Request & { cookies: { get: (name: string) => { value: string } | undefined } } {
  const req = new Request('http://localhost/api/documents/agreements', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });

  // Add cookies mock
  (req as unknown as Record<string, unknown>).cookies = {
    get: (name: string) => {
      if (name === 'admin-session' && token) return { value: token };
      return undefined;
    },
  };

  return req as Request & { cookies: { get: (name: string) => { value: string } | undefined } };
}

// Import route handlers after mocks are set up
const { GET, POST, PATCH } = await import('@/app/api/documents/agreements/route');

describe('GET /api/documents/agreements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without admin token', async () => {
    const req = makeRequest('GET');
    const res = await GET(req as unknown as Parameters<typeof GET>[0]);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 with invalid token', async () => {
    const req = makeRequest('GET', undefined, 'invalid.token');
    const res = await GET(req as unknown as Parameters<typeof GET>[0]);
    expect(res.status).toBe(401);
  });

  it('returns agreements with valid admin token', async () => {
    const token = await createTestToken();
    const req = makeRequest('GET', undefined, token);
    const res = await GET(req as unknown as Parameters<typeof GET>[0]);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('uses explicit column list (not select *)', async () => {
    const token = await createTestToken();
    const req = makeRequest('GET', undefined, token);
    await GET(req as unknown as Parameters<typeof GET>[0]);
    expect(mockSelect).toHaveBeenCalledWith(expect.not.stringContaining('*'));
    expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('id'));
    expect(mockSelect).toHaveBeenCalledWith(expect.not.stringContaining('completed_link'));
  });
});

describe('POST /api/documents/agreements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates agreement without admin auth (public endpoint)', async () => {
    const req = makeRequest('POST', {
      document_type: 'billOfSale',
      buyer_name: 'John Doe',
      status: 'completed',
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        document_type: 'billOfSale',
        buyer_name: 'John Doe',
        status: 'completed',
      }),
    );
  });

  it('returns 400 without document_type', async () => {
    const req = makeRequest('POST', { buyer_name: 'John' });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Missing document_type');
  });

  it('sets completed_at when status is completed', async () => {
    const req = makeRequest('POST', {
      document_type: 'billOfSale',
      status: 'completed',
    });
    await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        completed_at: expect.any(String),
      }),
    );
  });

  it('sets completed_at to null when status is pending', async () => {
    const req = makeRequest('POST', {
      document_type: 'billOfSale',
      status: 'pending',
    });
    await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        completed_at: null,
      }),
    );
  });
});

describe('PATCH /api/documents/agreements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without admin token', async () => {
    const req = makeRequest('PATCH', { id: '123', status: 'completed' });
    const res = await PATCH(req as unknown as Parameters<typeof PATCH>[0]);
    expect(res.status).toBe(401);
  });

  it('returns 400 without id', async () => {
    const token = await createTestToken();
    const req = makeRequest('PATCH', { status: 'completed' }, token);
    const res = await PATCH(req as unknown as Parameters<typeof PATCH>[0]);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Missing agreement id');
  });

  it('returns 400 with no fields to update', async () => {
    const token = await createTestToken();
    const req = makeRequest('PATCH', { id: '123' }, token);
    const res = await PATCH(req as unknown as Parameters<typeof PATCH>[0]);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('No fields to update');
  });

  it('updates has_dealer_signature (was previously missing)', async () => {
    const token = await createTestToken();
    const req = makeRequest('PATCH', { id: '123', has_dealer_signature: true }, token);
    const res = await PATCH(req as unknown as Parameters<typeof PATCH>[0]);
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ has_dealer_signature: true }),
    );
  });

  it('allows setting buyer_name to empty string (uses !== undefined, not falsy)', async () => {
    const token = await createTestToken();
    const req = makeRequest('PATCH', { id: '123', buyer_name: '' }, token);
    const res = await PATCH(req as unknown as Parameters<typeof PATCH>[0]);
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ buyer_name: '' }),
    );
  });
});
