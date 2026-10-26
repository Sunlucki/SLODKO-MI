const WIDTH = 1000

// Approximate Anton advance widths in em (measured from the font). `textLength` corrects the rest,
// so any wordmark from site.json spans exactly the full width without JS.
const advance = (c: string) => (c === ' ' ? 0.24 : c === 'I' ? 0.23 : c === 'M' || c === 'W' ? 0.73 : 0.47)

/** Giant display wordmark that always fills its container's width (scales like an image, never overflows). */
export function Wordmark({ text }: { text: string }) {
  const upper = text.toLocaleUpperCase('pl-PL')
  const fontSize = WIDTH / [...upper].reduce((sum, c) => sum + advance(c), 0)
  const capHeight = fontSize * 0.86
  return (
    <svg viewBox={`0 0 ${WIDTH} ${capHeight.toFixed(1)}`} aria-hidden focusable={false} className="block h-auto w-full overflow-visible">
      <text
        x="0"
        y={capHeight.toFixed(1)}
        fontSize={fontSize.toFixed(1)}
        textLength={WIDTH}
        lengthAdjust="spacing"
        className="fill-brand-deep font-display"
      >
        {upper}
      </text>
    </svg>
  )
}
