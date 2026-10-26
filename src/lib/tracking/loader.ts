// Lazy script loading for third-party tags: they never compete with the first paint or hydration.

const INTERACTIONS = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const

let ready = false
const waiting: (() => void)[] = []

function flush() {
  if (ready) return
  ready = true
  for (const type of INTERACTIONS) window.removeEventListener(type, flush)
  waiting.splice(0).forEach((fn) => fn())
}

function onLoad() {
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(flush, { timeout: 4000 })
  else window.setTimeout(flush, 2000)
}

/** Runs `fn` on the first user interaction or when the browser is idle after `load`, whichever comes first. */
export function whenIdle(fn: () => void) {
  if (ready) return fn()
  waiting.push(fn)
  if (waiting.length > 1) return
  for (const type of INTERACTIONS) window.addEventListener(type, flush, { once: true, passive: true })
  if (document.readyState === 'complete') onLoad()
  else window.addEventListener('load', onLoad, { once: true })
}

export function loadScript(src: string) {
  const script = document.createElement('script')
  script.async = true
  script.src = src
  document.head.appendChild(script)
}
