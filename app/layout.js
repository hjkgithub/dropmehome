
import "./global.css";

export const metadata = {
  title: "Drop me home",
  description: "Share your journey with others",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

