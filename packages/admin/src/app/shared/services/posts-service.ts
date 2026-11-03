import { from, type Observable } from "rxjs";
import { map } from "rxjs/operators";

import { parsePostsJson, type Post } from "../models/post";
import { getJson } from "./requests";

export class PostsService {
  /** Argo CD list APIs return Observables merged with watch streams; here a single GET is enough. */
  list(): Observable<Post[]> {
    return from(getJson<unknown>("/data/posts.json")).pipe(
      map((data) => parsePostsJson(data)),
    );
  }
}
