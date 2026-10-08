// Supabase/PostgREST caps every select at 1000 rows. Any query that can grow past that
// (fee_payments especially) must page through with .range() or the newest rows get
// silently dropped — which made freshly-paid members show as overdue / due soon.
// `build` must apply a stable .order() so pages don't overlap or skip rows.
const PAGE = 1000

export async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const all: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1)
    if (error) throw error
    const rows = data || []
    all.push(...rows)
    if (rows.length < PAGE) return all
  }
}
