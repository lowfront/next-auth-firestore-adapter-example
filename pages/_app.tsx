import type { AppProps } from 'next/app';
import Head from 'next/head';

export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return <>
    <Head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Template • TodoMVC</title>
      <link rel="stylesheet" href="/todomvc-common.css" />
      <link rel="stylesheet" href="/todomvc-app-css.css" />
    </Head>
    <Component {...pageProps} />
  </>;
}
