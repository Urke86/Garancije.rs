import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';
import { fontStackWeb } from '@/lib/typography';

const THEME_BOOTSTRAP = `
(function () {
  try {
    var stored = localStorage.getItem('garancije-theme:guest');
    var mode = stored === 'dark' || stored === 'light'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var root = document.documentElement;
    root.setAttribute('data-theme', mode);
    root.style.colorScheme = mode;
    var bg = mode === 'dark' ? '#0B1220' : '#F7FAFC';
    var fg = mode === 'dark' ? '#F1F5F9' : '#062B5F';
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    document.body.style.color = fg;
  } catch (e) {}
})();
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="sr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root { height: 100%; }
              body {
                font-family: ${fontStackWeb};
                background-color: #F7FAFC;
                color: #062B5F;
              }
              html[data-theme="dark"] body {
                background-color: #0B1220;
                color: #F1F5F9;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
