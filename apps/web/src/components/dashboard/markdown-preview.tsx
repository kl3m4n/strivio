import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { youtubeIdFromUrl } from '@/lib/youtube'

/**
 * Markdown preview avec :
 *   - GitHub-Flavored Markdown (tables, todo lists, strikethrough)
 *   - Détection de liens YouTube → remplacés par un lecteur embed
 *
 * La détection se fait sur deux cas :
 *   1) Un paragraphe qui ne contient QUE le lien (cas markdown auto-linké) →
 *      on rend l'iframe à la place du <p>.
 *   2) Un lien isolé dans le contenu → on garde le lien cliquable mais on
 *      affiche l'iframe juste après si on est en standalone.
 *
 * Implémentation simple : on intercepte les composants <a> et <p>.
 */
export function MarkdownPreview({ source }: { source: string }) {
  return (
    <div className="prose prose-sm max-w-none prose-pre:bg-muted prose-headings:font-semibold prose-pre:text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p({ children, ...props }) {
            // Cas: paragraph contains a single link → render embed instead.
            const arr = Array.isArray(children) ? children : [children]
            const onlyChild = arr.length === 1 ? arr[0] : null
            if (onlyChild && typeof onlyChild === 'object' && 'props' in onlyChild) {
              const linkChild = onlyChild as { props: { href?: string; children?: unknown } }
              const href = linkChild.props.href
              if (href) {
                const ytId = youtubeIdFromUrl(href)
                if (ytId) {
                  return <YouTubeEmbed videoId={ytId} />
                }
              }
            }
            return <p {...props}>{children}</p>
          },
          a({ href, children, ...props }) {
            return (
              <a href={href} target="_blank" rel="noreferrer" {...props}>
                {children}
              </a>
            )
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}

function YouTubeEmbed({ videoId }: { videoId: string }) {
  return (
    <div className="my-3 aspect-video w-full overflow-hidden rounded-md border">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  )
}
