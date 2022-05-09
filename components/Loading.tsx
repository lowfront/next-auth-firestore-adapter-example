import { PropsWithoutRef } from "react";
import styles from 'styles/Loading.module.css'
export default function Loading({ block }: PropsWithoutRef<{block: boolean}>) {
  return block ? <div className={styles.block}>Loading</div> : null;
}