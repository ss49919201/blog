import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import { services, type ViewPreferences } from "../../services";

import "./sidebar.scss";

export type NavItem = {
  path: string;
  title: string;
};

type SidebarProps = {
  navItems: NavItem[];
  pref: ViewPreferences;
};

/** Pattern from ui/src/app/sidebar/sidebar.tsx (nav list + collapse preference). */
export function Sidebar(props: SidebarProps) {
  const collapsed = props.pref.hideSidebar;

  return (
    <aside
      className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}
      aria-label="メインナビゲーション"
    >
      <div className="sidebar__brand">
        <button
          type="button"
          className="sidebar__collapse"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"}
          onClick={() =>
            services.viewPreferences.updatePreferences({
              ...props.pref,
              hideSidebar: !props.pref.hideSidebar,
            })
          }
        >
          {collapsed ? "»" : "«"}
        </button>
        {!collapsed && <span className="sidebar__title">Blog Admin</span>}
      </div>
      <nav aria-label="機能">
        <ul className="sidebar__nav">
          {props.navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
                }
                end
              >
                {item.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export function Layout(props: {
  navItems: NavItem[];
  pref: ViewPreferences;
  children?: ReactNode;
}) {
  const contentClass = props.pref.hideSidebar
    ? "cd-layout__content cd-layout__content--collapsed"
    : "cd-layout__content cd-layout__content--expanded";

  return (
    <div className="cd-layout">
      <Sidebar navItems={props.navItems} pref={props.pref} />
      <div className={contentClass}>{props.children}</div>
    </div>
  );
}
