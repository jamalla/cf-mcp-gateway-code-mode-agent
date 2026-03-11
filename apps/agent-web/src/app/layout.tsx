import "./globals.css";
import { Providers } from "./providers";
export const metadata = {
  title: "Code Mode Agent Web",
  description: "UI shell for MCP gateway + code mode demo"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
