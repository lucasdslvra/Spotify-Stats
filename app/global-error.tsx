"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          background: "#050505",
          color: "#e5e5e5",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 32, fontWeight: 300, color: "#fff", margin: 0 }}>
          Erreur inattendue
        </h1>
        <p style={{ maxWidth: 420, fontSize: 14, color: "#737373", margin: 0 }}>
          L&apos;application n&apos;a pas pu démarrer. Rechargez la page pour réessayer.
        </p>
        {error.digest && (
          <p style={{ fontSize: 12, color: "#404040", margin: 0 }}>Référence : {error.digest}</p>
        )}
        <button
          onClick={reset}
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent",
            color: "#fff",
            borderRadius: 999,
            padding: "12px 32px",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
