import { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import { PropsWithoutRef, SyntheticEvent } from "react";

export default function User({session}: PropsWithoutRef<{session: Session}>) {

  function signOutHandler(ev: SyntheticEvent) {
    ev.preventDefault();
    signOut();
  }

  function signInHandler(ev: SyntheticEvent) {
    ev.preventDefault();
    signIn('google');
  }

  return session ?
    <div>
      <span>
        <small>Signed in as</small>
        <br />
        <strong>{session?.user?.email ?? ''}</strong>
      </span>
      {' '}
      <a href={`/api/auth/signout`} onClick={signOutHandler}>Sign out</a>
    </div> :
    <div>
      <span>
        You are not signed in
      </span>
      {' '}
      <a href={`/api/auth/signin`} onClick={signInHandler}>Sign in</a>
    </div>;
}