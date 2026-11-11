import { Fragment, useEffect, useReducer, type FormEvent } from "react";
import { fetchPost, savePost } from "../api/posts";
import {
  POST_STATUSES,
  POST_STATUS_LABEL,
  type PostContent,
  type PostField,
  type PostId,
} from "../types/post";
import {
  editAlertText,
  editReducer,
  editStatusText,
  initialEditState,
  parsePostForm,
} from "./postEditState";
import styles from "./PostEditPage.module.css";

const FIELD_LABEL = {
  slug: "スラッグ",
  title: "タイトル",
  body: "本文",
  status: "状態",
  updatedAt: "更新日",
} as const satisfies Record<PostField, string>;

const FIELD_ORDER = ["title", "slug", "body", "status", "updatedAt"] as const satisfies readonly PostField[];

const fieldsCovered: [Exclude<PostField, (typeof FIELD_ORDER)[number]>] extends [never] ? true : never =
  true;
void fieldsCovered;

export function PostEditPage(props: { id: PostId }) {
  const [state, dispatch] = useReducer(editReducer, initialEditState);

  useEffect(() => {
    let cancelled = false;
    void fetchPost(props.id).then((result) => {
      if (!cancelled) dispatch({ type: "loadSettled", result });
    });
    return () => {
      cancelled = true;
    };
  }, [props.id]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.kind !== "editing") return;
    const parsed = parsePostForm(new FormData(event.currentTarget));
    if (parsed.isErr()) {
      dispatch({ type: "invalid", message: parsed.error });
      return;
    }
    const content = parsed.value;
    const base = state.post;
    dispatch({ type: "submitted", content });
    void savePost(base, content).then((result) => {
      dispatch({ type: "saveSettled", result });
    });
  }

  const post = state.kind === "editing" || state.kind === "saving" ? state.post : null;
  const rejected =
    state.kind === "editing" && state.notice?.kind === "conflict" ? state.notice.rejected : null;
  const alert = editAlertText(state);

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>記事の編集</h1>
        <a href="#/">記事一覧へ戻る</a>
      </header>
      <main className={styles.pageMain}>
        <p className={styles.status} role="status" aria-live="polite">{editStatusText(state)}</p>
        {alert && (
          <p className={styles.alert} role="alert">
            {alert}
            {state.kind === "missing" ? (
              <>
                {" "}
                <a href="#/">記事一覧へ戻る</a>
              </>
            ) : null}
          </p>
        )}
        {post && (
          <form
            key={`${post.id}:${post.version}`}
            className={styles.form}
            onSubmit={onSubmit}
          >
            <dl className={styles.meta}>
              <dt>ID</dt>
              <dd>
                <code>{post.id}</code>
              </dd>
              <dt>バージョン</dt>
              <dd>{post.version}</dd>
            </dl>
            <fieldset className={styles.fields} disabled={state.kind === "saving"}>
              <legend>記事の内容</legend>
              <label>
                {FIELD_LABEL.title}
                <input name="title" defaultValue={post.content.title} required maxLength={200} />
              </label>
              <label>
                {FIELD_LABEL.slug}
                <input
                  name="slug"
                  defaultValue={post.content.slug}
                  required
                  maxLength={200}
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </label>
              <label>
                {FIELD_LABEL.body}
                <textarea name="body" defaultValue={post.content.body} rows={16} />
              </label>
              <label>
                {FIELD_LABEL.status}
                <select name="status" defaultValue={post.content.status}>
                  {POST_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {POST_STATUS_LABEL[status]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {FIELD_LABEL.updatedAt}
                <input type="date" name="updatedAt" defaultValue={post.content.updatedAt} required />
              </label>
              <button type="submit">{state.kind === "saving" ? "保存中…" : "保存"}</button>
            </fieldset>
          </form>
        )}
        {rejected && (
          <details className={styles.rejected}>
            <summary>保存できなかった変更を表示</summary>
            <dl className={styles.meta}>
              {FIELD_ORDER.map((field) => (
                <Fragment key={field}>
                  <dt>{FIELD_LABEL[field]}</dt>
                  <dd>{displayField(field, rejected)}</dd>
                </Fragment>
              ))}
            </dl>
          </details>
        )}
      </main>
    </>
  );
}

function displayField(field: PostField, content: PostContent): string {
  if (field === "status") return POST_STATUS_LABEL[content.status];
  return content[field];
}
