"use client";

export default function ApiDocsPage() {
    return (
        <iframe
            src="/swagger.html"
            style={{ width: "100%", height: "100vh", border: "none" }}
            title="Aurora Fest API Docs"
        />
    );
}
