import type { ReactNode } from "react";

import { DataLoader } from "../data-loader/data-loader";
import { services, type ViewPreferences } from "../../services";
import { Layout, type NavItem } from "./sidebar";

import "./layout.scss";

const loadViewPreferences = () => services.viewPreferences.getPreferences();

/** Pattern from ui/src/app/shared/components/layout/layout.tsx */
export function AppLayout(props: { navItems: NavItem[]; children?: ReactNode }) {
  return (
    <DataLoader load={loadViewPreferences}>
      {(pref) => <Layout navItems={props.navItems} pref={pref} children={props.children} />}
    </DataLoader>
  );
}

export type { NavItem, ViewPreferences };
