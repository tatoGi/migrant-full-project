import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "ემიგრანტ.GE — პროფესიონალები მთელ მსოფლიოში",
  description: "დააკავშირეთ ემიგრანტები სანდო პროფესიონალებთან მთელ მსოფლიოში",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
