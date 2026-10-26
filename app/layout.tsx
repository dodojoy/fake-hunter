import type { Metadata, Viewport } from "next";
import { Nunito, Lilita_One } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const titulo = Lilita_One({
  variable: "--font-titulo",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fake Hunter",
  description:
    "Jogo educativo: seja o checador de fatos de Vale Verde e aprenda a identificar desinformação.",
  icons: { icon: "/img/ui/icone_app.png", apple: "/icons/icon-192.png" },
  appleWebApp: { capable: true, title: "Fake Hunter", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#1b2a41",
  width: "device-width",
  initialScale: 1,
};

// Aplica as preferências salvas (fonte, contraste, movimento) antes da primeira pintura,
// para a página não "piscar" no visual padrão. Espelha aplicarNoDocumento em lib/preferencias.ts.
const aplicarPreferencias = `try{var p=JSON.parse(localStorage.getItem("fakehunter:preferencias")||"{}"),h=document.documentElement;h.dataset.fonte=String(p.fonte||0);h.dataset.contraste=p.contraste?"alto":"normal";h.dataset.movimento=p.reduzirMovimento?"reduzido":"normal"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${nunito.variable} ${titulo.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: aplicarPreferencias }} />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
