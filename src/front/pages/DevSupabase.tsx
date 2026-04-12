import React, { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../lib/supabaseClient";

/**
 * Fase 2 del plan Supabase: comprobar cliente anon y sesión en el navegador.
 * Solo útil con `npm run dev` y variables `VITE_SUPABASE_*` definidas.
 */
export const DevSupabase: React.FC = () => {
  const [sessionPreview, setSessionPreview] = useState<string>("…");
  const [sessionError, setSessionError] = useState<string>("");
  const [backendStatus, setBackendStatus] = useState<string>("");

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    const apiBase = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "").trim();
    const url = apiBase ? `${apiBase}/api/supabase_status` : "/api/supabase_status";
    fetch(url)
      .then((r) => r.json())
      .then((j) => setBackendStatus(JSON.stringify(j, null, 2)))
      .catch((e) => setBackendStatus(`Error: ${e instanceof Error ? e.message : String(e)}`));

    const client = getSupabaseBrowserClient();
    if (!client) {
      setSessionPreview(
        "(cliente null — define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY y reinicia Vite)"
      );
      return;
    }
    void client.auth.getSession().then(({ data, error }) => {
      if (error) {
        setSessionError(error.message);
        setSessionPreview("—");
      } else {
        setSessionPreview(
          data.session ? JSON.stringify(data.session, null, 2) : "null (sin sesión)"
        );
      }
    });
  }, []);

  if (!import.meta.env.DEV) {
    return (
      <div className="container py-5 text-center">
        <p className="text-muted">Esta ruta solo está disponible en modo desarrollo.</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="h3 mb-4">Dev — Supabase (Fase 2)</h1>
      <p className="text-muted small mb-4">
        Comprueba el dashboard de Supabase: Authentication → URL Configuration (Site URL, redirect
        URLs) debe incluir el origen de este front (p. ej. <code>http://localhost:5173</code>).
      </p>

      <div className="card mb-3">
        <div className="card-header">Front (anon)</div>
        <div className="card-body">
          <p className="mb-1">
            <strong>isSupabaseConfigured:</strong> {String(isSupabaseConfigured())}
          </p>
          {sessionError && <p className="text-danger small mb-2">{sessionError}</p>}
          <pre
            className="bg-light p-2 rounded small text-start"
            style={{ maxHeight: 240, overflow: "auto" }}
          >
            {sessionPreview}
          </pre>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Backend (GET /api/supabase_status)</div>
        <div className="card-body">
          <pre
            className="bg-light p-2 rounded small text-start"
            style={{ maxHeight: 200, overflow: "auto" }}
          >
            {backendStatus || "…"}
          </pre>
        </div>
      </div>
    </div>
  );
};
