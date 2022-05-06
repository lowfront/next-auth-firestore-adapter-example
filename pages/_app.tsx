import type { AppProps } from 'next/app';
import Head from 'next/head';

import 'todomvc-app-css/index.css';
import 'todomvc-common/base.css';

export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return <>
    <Head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Template • TodoMVC</title>
    </Head>
    <Component {...pageProps} />
  </>;
}
