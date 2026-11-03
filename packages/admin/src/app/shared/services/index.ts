import { PostsService } from "./posts-service";
import { ViewPreferencesService } from "./view-preferences-service";

export interface Services {
  posts: PostsService;
  viewPreferences: ViewPreferencesService;
}

export const services: Services = {
  posts: new PostsService(),
  viewPreferences: new ViewPreferencesService(),
};

export type { ViewPreferences } from "./view-preferences-service";
