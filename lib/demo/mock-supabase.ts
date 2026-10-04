import {
  DEMO_OCR_IMAGE_PATH,
  DEMO_USER,
  createDemoDatabase,
  createDemoPendingOcr,
  type DemoDatabase,
} from '@/lib/demo/demo-data';
import { buildDemoReceiptDataUri } from '@/lib/demo/demo-receipt-image';

type Row = Record<string, unknown>;
type Result = { data: unknown; error: null; count: number | null; status: number };

const db: DemoDatabase = createDemoDatabase();

/** Foreign-key relations used by the app's embedded selects. */
const RELATIONS: Record<string, Record<string, { table: keyof DemoDatabase; kind: 'many' | 'one'; key: string }>> = {
  receipts: { receipt_items: { table: 'receipt_items', kind: 'many', key: 'receipt_id' } },
  receipt_items: { receipts: { table: 'receipts', kind: 'one', key: 'receipt_id' } },
  reminders: { receipt_items: { table: 'receipt_items', kind: 'one', key: 'receipt_item_id' } },
};

type SelectNode = { relations: Record<string, SelectNode> };

function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of input) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function parseSelect(columns: string): SelectNode {
  const node: SelectNode = { relations: {} };
  for (const token of splitTopLevel(columns.replace(/\s+/g, ' '))) {
    const open = token.indexOf('(');
    if (open === -1) continue;
    const name = token.slice(0, open).split(':').pop()!.trim();
    node.relations[name] = parseSelect(token.slice(open + 1, token.lastIndexOf(')')));
  }
  return node;
}

function tableRows(table: string): Row[] {
  return ((db as unknown as Record<string, Row[]>)[table] ??= []);
}

function embed(table: string, row: Row, node: SelectNode): Row {
  const out: Row = { ...row };
  for (const [relName, child] of Object.entries(node.relations)) {
    const rel = RELATIONS[table]?.[relName];
    if (!rel) continue;
    const target = tableRows(rel.table);
    if (rel.kind === 'many') {
      out[relName] = target
        .filter((r) => r[rel.key] === row.id)
        .map((r) => embed(rel.table, r, child));
    } else {
      const match = target.find((r) => r.id === row[rel.key]);
      out[relName] = match ? embed(rel.table, match, child) : null;
    }
  }
  return out;
}

type Filter = (row: Row) => boolean;

let idCounter = 1;

class DemoQuery implements PromiseLike<Result> {
  private filters: Filter[] = [];
  private orderBy: { column: string; ascending: boolean }[] = [];
  private limitCount: number | null = null;
  private selectNode: SelectNode | null = null;
  private countOnly = false;
  private singleMode: 'single' | 'maybe' | null = null;
  private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private payload: Row[] = [];
  private patch: Row = {};
  private conflictKeys: string[] = ['id'];

  constructor(private readonly table: string) {}

  select(columns = '*', options?: { count?: string; head?: boolean }) {
    this.selectNode = parseSelect(columns);
    if (options?.head) this.countOnly = true;
    return this;
  }

  insert(values: Row | Row[]) {
    this.action = 'insert';
    this.payload = Array.isArray(values) ? values : [values];
    return this;
  }

  upsert(values: Row | Row[], options?: { onConflict?: string }) {
    this.action = 'upsert';
    this.payload = Array.isArray(values) ? values : [values];
    if (options?.onConflict) this.conflictKeys = options.onConflict.split(',').map((k) => k.trim());
    return this;
  }

  update(values: Row) {
    this.action = 'update';
    this.patch = values;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((r) => r[column] === value);
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push((r) => r[column] !== value);
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push((r) => values.includes(r[column]));
    return this;
  }

  is(column: string, value: unknown) {
    this.filters.push((r) => (r[column] ?? null) === value);
    return this;
  }

  not(column: string, operator: string, value: unknown) {
    if (operator === 'is') this.filters.push((r) => (r[column] ?? null) !== value);
    else if (operator === 'eq') this.filters.push((r) => r[column] !== value);
    return this;
  }

  gt(column: string, value: string | number) {
    this.filters.push((r) => (r[column] as string | number) > value);
    return this;
  }

  gte(column: string, value: string | number) {
    this.filters.push((r) => (r[column] as string | number) >= value);
    return this;
  }

  lt(column: string, value: string | number) {
    this.filters.push((r) => (r[column] as string | number) < value);
    return this;
  }

  lte(column: string, value: string | number) {
    this.filters.push((r) => (r[column] as string | number) <= value);
    return this;
  }

  ilike(column: string, pattern: string) {
    const needle = pattern.replace(/%/g, '').toLowerCase();
    this.filters.push((r) => String(r[column] ?? '').toLowerCase().includes(needle));
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleMode = 'single';
    return this;
  }

  maybeSingle() {
    this.singleMode = 'maybe';
    return this;
  }

  private matches(row: Row) {
    return this.filters.every((f) => f(row));
  }

  private execute(): Result {
    const rows = tableRows(this.table);
    let affected: Row[] = [];

    if (this.action === 'insert' || this.action === 'upsert') {
      for (const value of this.payload) {
        const existing =
          this.action === 'upsert'
            ? rows.find((r) => this.conflictKeys.every((k) => r[k] === value[k]))
            : undefined;
        if (existing) {
          Object.assign(existing, value);
          affected.push(existing);
        } else {
          const row = { id: `demo-${this.table}-${idCounter++}`, created_at: new Date().toISOString(), ...value };
          rows.push(row);
          affected.push(row);
        }
      }
    } else if (this.action === 'update') {
      affected = rows.filter((r) => this.matches(r));
      affected.forEach((r) => Object.assign(r, this.patch));
    } else if (this.action === 'delete') {
      affected = rows.filter((r) => this.matches(r));
      const remaining = rows.filter((r) => !affected.includes(r));
      rows.splice(0, rows.length, ...remaining);
    } else {
      affected = rows.filter((r) => this.matches(r));
    }

    if (this.action === 'select' && this.countOnly) {
      return { data: null, error: null, count: affected.length, status: 200 };
    }

    if (this.action !== 'select' && !this.selectNode) {
      return { data: null, error: null, count: null, status: 200 };
    }

    let result = [...affected];
    for (const { column, ascending } of [...this.orderBy].reverse()) {
      result.sort((a, b) => {
        const av = a[column] as string | number;
        const bv = b[column] as string | number;
        if (av === bv) return 0;
        return (av > bv ? 1 : -1) * (ascending ? 1 : -1);
      });
    }
    if (this.limitCount != null) result = result.slice(0, this.limitCount);

    const node = this.selectNode ?? { relations: {} };
    const shaped = result.map((r) => embed(this.table, r, node));

    if (this.singleMode) {
      return { data: shaped[0] ?? null, error: null, count: null, status: 200 };
    }
    return { data: shaped, error: null, count: shaped.length, status: 200 };
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve()
      .then(() => this.execute())
      .then(onfulfilled, onrejected);
  }
}

export function resolveDemoImage(path: string): string | null {
  const receipt = db.receipts.find((r) => r.image_url === path);
  if (receipt) {
    return buildDemoReceiptDataUri({
      storeName: receipt.store_name,
      pib: receipt.pib,
      receiptNumber: receipt.receipt_number,
      purchaseDate: receipt.purchase_date,
      items: db.receipt_items
        .filter((i) => i.receipt_id === receipt.id)
        .map((i) => ({ name: i.receipt_label, price: i.price })),
    });
  }
  if (path === DEMO_OCR_IMAGE_PATH) {
    const { result } = createDemoPendingOcr();
    return buildDemoReceiptDataUri({
      storeName: result.store_name,
      pib: result.pib,
      receiptNumber: result.receipt_number,
      purchaseDate: result.purchase_date,
      items: result.items.map((i) => ({ name: i.name, price: i.price })),
    });
  }
  return null;
}

export function createDemoSupabase() {
  const session = {
    access_token: 'demo-access-token',
    refresh_token: 'demo-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
    user: DEMO_USER,
  };
  const ok = async () => ({ data: { session, user: DEMO_USER }, error: null });

  return {
    from: (table: string) => new DemoQuery(table),
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      getUser: async () => ({ data: { user: DEMO_USER }, error: null }),
      onAuthStateChange: (callback: (event: string, s: typeof session) => void) => {
        const timer = setTimeout(() => callback('INITIAL_SESSION', session), 0);
        return { data: { subscription: { unsubscribe: () => clearTimeout(timer) } } };
      },
      startAutoRefresh: async () => undefined,
      stopAutoRefresh: async () => undefined,
      signInWithPassword: ok,
      signUp: ok,
      signInWithOAuth: async () => ({ data: { url: null, provider: 'google' }, error: null }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ data: {}, error: null }),
      updateUser: ok,
      exchangeCodeForSession: ok,
      setSession: ok,
      verifyOtp: ok,
    },
    storage: {
      from: () => ({
        createSignedUrl: async (path: string) => {
          const signedUrl = resolveDemoImage(path);
          return signedUrl
            ? { data: { signedUrl }, error: null }
            : { data: null, error: { message: 'Demo image not found' } };
        },
        upload: async (path: string) => ({ data: { path }, error: null }),
        remove: async () => ({ data: [], error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: resolveDemoImage(path) ?? '' } }),
      }),
    },
    functions: {
      invoke: async () => ({ data: { ok: true }, error: null }),
    },
  };
}
