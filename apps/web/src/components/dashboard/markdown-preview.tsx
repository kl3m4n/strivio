import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { youtubeIdFromUrl } from '@/lib/youtube'

const FULL_CLASSES =
  'prose prose-sm max-w-none prose-pre:bg-muted prose-headings:font-semibold prose-pre:text-foreground'

/**
 * Variante densifiée pour les cartes du calendrier : texte plus petit, marges
 * resserrées, mais même rendu interprété (titres, listes, tables, embeds).
 */
const COMPACT_CLASSES =
  'prose prose-sm max-w-none text-[12px] leading-snug text-muted-foreground ' +
  'prose-headings:text-foreground prose-headings:font-semibold prose-strong:text-foreground prose-code:text-foreground ' +
  'prose-p:my-1 prose-headings:my-1.5 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 ' +
  'prose-pre:my-1.5 prose-pre:bg-muted prose-pre:text-foreground ' +
  '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0'

/**
 * Markdown preview avec :
 *   - GitHub-Flavored Markdown (tables, todo lists, strikethrough)
 *   - Détection de liens YouTube → remplacés par un lecteur embed
 *
 * `compact` densifie le rendu pour les cartes du calendrier tout en gardant le
 * même rendu interprété que le détail de la carte.
 *
 * La détection YouTube se fait sur un paragraphe qui ne contient QUE le lien
 * (cas markdown auto-linké) → on rend l'iframe à la place du <p>.
 */
export function MarkdownPreview({ source, compact = false }: { source: string; compact?: boolean }) {
  return (
    <div className={compact ? COMPACT_CLASSES : FULL_CLASSES}>
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
                  return <YouTubeEmbed videoId={ytId} compact={compact} />
                }
              }
            }
            return <p {...props}>{children}</p>
          },
          a({ href, children, ...props }) {
            // stopPropagation : dans une carte cliquable, suivre le lien ne doit
            // pas aussi ouvrir l'éditeur du bloc.
            return (
              <a href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} {...props}>
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

function YouTubeEmbed({ videoId, compact = false }: { videoId: string; compact?: boolean }) {
  // En carte (compact) : vidéo jouable mais sans l'habillage YouTube (titre,
  // chaîne, bouton partage, barre de contrôles). Technique du crop : l'iframe
  // déborde de 60px en haut et en bas du cadre `overflow-hidden`. YouTube
  // letterbox la vidéo 16:9 pour qu'elle remplisse pile le cadre visible, et
  // l'habillage (dessiné sur les bords du lecteur) tombe dans la zone rognée.
  // `controls=0` retire la barre de lecture du bas ; un clic lance/met en pause.
  if (compact) {
    return (
      <div className="relative my-1.5 aspect-video w-full overflow-hidden rounded-md border bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?controls=0&modestbranding=1&rel=0&playsinline=1`}
          title="YouTube video"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute -top-[60px] left-0 h-[calc(100%_+_120px)] w-full"
        />
      </div>
    )
  }
  return (
    <div className="my-3 aspect-video w-full overflow-hidden rounded-md border">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  )
}
