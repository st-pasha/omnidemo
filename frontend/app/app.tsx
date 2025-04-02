import { observer } from "mobx-react-lite";
import { Outlet } from "react-router";

import { AppSidebar } from "~/components/app-sidebar";
import { SidebarProvider } from "~/components/ui/sidebar";
import { useCurrentUser } from "~/state/current-user";
import { LoginPage } from "~/routes/login";

export const App = observer(() => {
  const user = useCurrentUser();
  if (!user.isLoaded) {
    return <div>No user</div>;
  }
  if (!user.isLoggedIn) {
    return <LoginPage />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full px-6 py-4">
        <Outlet />
      </main>
    </SidebarProvider>
  );
});
