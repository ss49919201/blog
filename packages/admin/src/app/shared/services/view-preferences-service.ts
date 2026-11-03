import { BehaviorSubject, type Observable } from "rxjs";

export type ViewPreferences = {
  hideSidebar: boolean;
};

const STORAGE_KEY = "admin.viewPreferences";

const defaultPreferences: ViewPreferences = {
  hideSidebar: false,
};

function readStored(): ViewPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultPreferences;
    }
    const parsed = JSON.parse(raw) as Partial<ViewPreferences>;
    return {
      hideSidebar: parsed.hideSidebar ?? defaultPreferences.hideSidebar,
    };
  } catch {
    return defaultPreferences;
  }
}

export class ViewPreferencesService {
  private readonly subject = new BehaviorSubject<ViewPreferences>(readStored());

  init(): void {
    this.subject.next(readStored());
  }

  getPreferences(): Observable<ViewPreferences> {
    return this.subject.asObservable();
  }

  updatePreferences(next: ViewPreferences): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    this.subject.next(next);
  }
}
