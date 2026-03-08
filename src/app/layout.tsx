import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ControlFinance — Dashboard Financeiro OFX",
  description: "Dashboard completo para análise de extratos bancários OFX. Visualize transações, categorias, gráficos e dados raw de contas correntes e cartões de crédito.",
  keywords: ["finanças", "OFX", "dashboard", "extrato", "banco", "nubank", "transações"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
