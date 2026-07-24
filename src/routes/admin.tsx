import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  adminCheckSession,
  adminListArticles,
  adminLogin,
  adminLogout,
  adminSetStatus,
  adminDeleteArticle,
  type AdminArticleRow,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  loader: async () => {
    const { authed } = await adminCheckSession();
    if (!authed) return { authed: false as const, articles: [] as AdminArticleRow[] };
    const articles = await adminListArticles({ data: { status: "all" } });
    return { authed: true as const, articles };
  },
  head: () => ({
    meta: [
      { title: "Admin — Hjemmeteknik.dk" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { authed, articles } = Route.useLoaderData();
  if (!authed) return <LoginForm />;
  return <ArticlesTable initial={articles} />;
}

function LoginForm() {
  const router = useRouter();
  const login = useServerFn(adminLogin);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { ok } = await login({ data: { password } });
      if (!ok) {
        setError("Forkert adgangskode");
        setLoading(false);
        return;
      }
      await router.invalidate();
    } catch {
      setError("Noget gik galt. Prøv igen.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
      >
        <h1 className="font-serif text-2xl mb-1">Admin</h1>
        <p className="text-sm text-slate-500 mb-5">Log ind for at administrere artikler.</p>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="pw">
          Adgangskode
        </label>
        <input
          id="pw"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
          required
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="mt-4 w-full rounded-md bg-blue-900 text-white py-2 font-medium hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? "Logger ind…" : "Log ind"}
        </button>
      </form>
    </div>
  );
}

function ArticlesTable({ initial }: { initial: AdminArticleRow[] }) {
  const router = useRouter();
  const setStatus = useServerFn(adminSetStatus);
  const delFn = useServerFn(adminDeleteArticle);
  const logout = useServerFn(adminLogout);
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = initial.filter((a) => filter === "all" || a.status === filter);
  const draftCount = initial.filter((a) => a.status === "draft").length;
  const pubCount = initial.filter((a) => a.status === "published").length;

  async function handlePublish(id: string, next: "draft" | "published") {
    setBusyId(id);
    await setStatus({ data: { id, status: next } });
    await router.invalidate();
    setBusyId(null);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Slet "${title}"? Dette kan ikke fortrydes.`)) return;
    setBusyId(id);
    await delFn({ data: { id } });
    await router.invalidate();
    setBusyId(null);
  }

  async function handleLogout() {
    await logout();
    await router.invalidate();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl">Admin</h1>
          <p className="text-sm text-slate-500">
            {initial.length} artikler · {draftCount} kladder · {pubCount} publicerede
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-slate-600 hover:text-slate-900 underline underline-offset-4"
        >
          Log ud
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {(["all", "draft", "published"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
              filter === k
                ? "bg-blue-900 text-white border-blue-900"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {k === "all" ? "Alle" : k === "draft" ? "Kladder" : "Publicerede"}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-3 font-medium">Titel</th>
              <th className="text-left p-3 font-medium">Kategori</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Opdateret</th>
              <th className="text-right p-3 font-medium">Handlinger</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  Ingen artikler.
                </td>
              </tr>
            )}
            {filtered.map((a) => {
              const url = a.category ? `/${a.category.slug}/${a.slug}` : `#`;
              return (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="p-3">
                    <div className="font-medium text-slate-900">{a.title}</div>
                    <div className="text-xs text-slate-500 truncate max-w-md">{a.excerpt}</div>
                  </td>
                  <td className="p-3 text-slate-600">{a.category?.name ?? "—"}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        a.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {a.status === "published" ? "Publiceret" : "Kladde"}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 whitespace-nowrap">
                    {new Date(a.updated_at).toLocaleDateString("da-DK")}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    {a.status === "published" ? (
                      <Link
                        to={url}
                        className="text-blue-700 hover:underline mr-3"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Se
                      </Link>
                    ) : null}
                    {a.status === "draft" ? (
                      <button
                        onClick={() => handlePublish(a.id, "published")}
                        disabled={busyId === a.id}
                        className="text-green-700 hover:underline mr-3 disabled:opacity-50"
                      >
                        Publicér
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublish(a.id, "draft")}
                        disabled={busyId === a.id}
                        className="text-amber-700 hover:underline mr-3 disabled:opacity-50"
                      >
                        Afpublicér
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(a.id, a.title)}
                      disabled={busyId === a.id}
                      className="text-red-700 hover:underline disabled:opacity-50"
                    >
                      Slet
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
