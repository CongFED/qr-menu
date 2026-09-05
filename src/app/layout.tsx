import type { Metadata, Viewport } from "next";
import "./globals.css";
import MuiThemeRegistry from "@/components/providers/MuiThemeRegistry";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Suối Đá Hòn Giao - QR Menu",
  description: "Đặt món trực tuyến tại nhà hàng Suối Đá Hòn Giao. Thưởng thức ẩm thực núi rừng giữa thiên nhiên hoang sơ.",
  keywords: ["Suối Đá Hòn Giao", "QR Menu", "nhà hàng", "đặt món", "Khánh Hòa"],
  openGraph: {
    title: "Suối Đá Hòn Giao - QR Menu",
    description: "Đặt món trực tuyến tại nhà hàng Suối Đá Hòn Giao",
    type: "website",
    locale: "vi_VN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 1. Intercept extension and third-party script runtime errors
              window.addEventListener('error', function(e) {
                if (e && e.message && (e.message.indexOf('startTime') !== -1 || e.message.indexOf('reportAllChanges') !== -1)) {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                }
              }, true);

              // 2. Strip extension-injected attributes (bis_skin_checked from Urban VPN/Bitdefender)
              (function() {
                try {
                  var clean = function(node) {
                    if (node && node.nodeType === 1) {
                      if (node.hasAttribute('bis_skin_checked')) node.removeAttribute('bis_skin_checked');
                      if (node.hasAttribute('bis_register')) node.removeAttribute('bis_register');
                      for (var i = 0; i < node.children.length; i++) clean(node.children[i]);
                    }
                  };
                  var obs = new MutationObserver(function(muts) {
                    for (var i = 0; i < muts.length; i++) {
                      var m = muts[i];
                      if (m.type === 'attributes' && (m.attributeName === 'bis_skin_checked' || m.attributeName === 'bis_register')) {
                        m.target.removeAttribute(m.attributeName);
                      }
                      if (m.type === 'childList') {
                        for (var j = 0; j < m.addedNodes.length; j++) clean(m.addedNodes[j]);
                      }
                    }
                  });
                  obs.observe(document.documentElement, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                    attributeFilter: ['bis_skin_checked', 'bis_register']
                  });
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <MuiThemeRegistry>
          {children}
        </MuiThemeRegistry>
      </body>
    </html>
  );
}
