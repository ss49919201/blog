import type { ReactNode } from "react";

import { DataLoader } from "../data-loader/data-loader";
import { services, type ViewPreferences } from "../../services";

import "./page.scss";

const loadViewPreferences = () => services.viewPreferences.getPreferences();

export type PageToolbar = {
  tools?: ReactNode[];
};

type PageProps = {
  title: string;
  toolbar?: PageToolbar;
  children?: ReactNode;
};

/**
 * Argo CD wraps argo-ui `Page` in ui/src/app/shared/components/page/page.tsx
 * (sidebar collapse class + view preferences).
 */
export function Page(props: PageProps) {
  return (
    <DataLoader load={loadViewPreferences}>
      {(pref) => <PageInner {...props} pref={pref} />}
    </DataLoader>
  );
}

function PageInner(props: PageProps & { pref: ViewPreferences }) {
  const sidebarClass = props.pref.hideSidebar
    ? "page-wrapper page-wrapper--sidebar-collapsed"
    : "page-wrapper page-wrapper--sidebar-expanded";

  return (
    <div className={sidebarClass}>
      <header className="argo-page__header">
        <div className="argo-page__title-row">
          <h1 className="argo-page__title">{props.title}</h1>
          {props.toolbar?.tools && props.toolbar.tools.length > 0 && (
            <div className="argo-page__toolbar" role="toolbar" aria-label={`${props.title} の操作`}>
              {props.toolbar.tools.map((tool, index) => (
                <span key={index} className="argo-page__toolbar-item">
                  {tool}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>
      <div className="argo-page__content">{props.children}</div>
    </div>
  );
}
