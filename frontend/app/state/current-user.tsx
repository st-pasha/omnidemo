import { makeAutoObservable } from "mobx";
import { hydrateStore, isHydrated, makePersistable } from "mobx-persist-store";

class CurrentUser {
  username: string | null = null;
  uid: number;
  authKey: string | null = null;

  constructor() {
    this.uid = 0;
    makeAutoObservable(this);
    // makePersistable(this, {
    //   name: "current-user",
    //   properties: ["username", "uid", "authKey"],
    //   storage: window.localStorage,
    // });
  }

  logIn(username: string, uid: number, token: string) {
    this.username = username;
    this.uid = uid;
    this.authKey = token;
  }

  logOut() {
    this.username = null;
    this.authKey = null;
  }

  get isLoaded() {
    return true;
    // return isHydrated(this);
  }

  get isLoggedIn() {
    return this.username !== null && this.authKey !== null;
  }

  load(): Promise<void> {
    return hydrateStore(this);
  }
}

let currentUser: CurrentUser | null = null;

export function useCurrentUser(): CurrentUser {
  if (!currentUser) {
    currentUser = new CurrentUser();
  }
  return currentUser;
}

export async function useCurrentUserA(): Promise<CurrentUser> {
  if (!currentUser) {
    currentUser = new CurrentUser();
    await currentUser.load();
  }
  return currentUser;
}
