import { FolderTree, NotebookPen, TrendingUpDown } from "lucide-react";
import { Link } from "react-router";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";

const navigation_data = [
  { label: "Insights", route: "/insights", icon: NotebookPen },
  { label: "Inputs", route: "/inputs", icon: FolderTree },
  { label: "Forecasts", route: "/forecasts", icon: TrendingUpDown },
];

const AppSidebar = () => {
  const { open } = useSidebar();

  return (
    <Sidebar side="left" collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <div className="text-xl font-bold -m-2 mb-2 px-4 py-1 bg-stone-300 
            border-b border-stone-500">CPG</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation_data.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    isActive={location.pathname.startsWith(item.route)}
                  >
                    <Link to={item.route} className="flex w-full items-center">
                      <item.icon className="mr-2 h-5 w-5" />
                      {open && <span>{item.label}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
};
AppSidebar.displayName = "AppSidebar";

export { AppSidebar };
