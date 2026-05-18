import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';
import { fontStackWeb } from '@/lib/typography';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="sr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root { height: 100%; }
              body {
                font-family: ${fontStackWeb};
                background-color: #F7FAFC;
                color: #062B5F;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
