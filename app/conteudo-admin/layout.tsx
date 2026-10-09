import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Painel · Pharmdata",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="pd-admin">{children}</div>;
}
