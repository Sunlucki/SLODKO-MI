// The pre-rendered HTML is complete and its links work without JS, so the React bundle is fetched
// only after the page has loaded and painted (or on the first interaction): it then never competes
// with the hero image and fonts for bandwidth on a slow phone connection.
export function deferAppScript(html: string): string {
  const tag = html.match(/<script type="module"[^>]*\ssrc="([^"]+)"[^>]*><\/script>/)
  if (!tag) return html
  // Waits for the "load" event AND the first contentful paint (3 s fallback, e.g. for background tabs)
  const loader =
    `<script>(function(){var done=0,wait=2,ev=['pointerdown','keydown','touchstart','scroll'];function load(){if(done++)return;` +
    `ev.forEach(function(e){removeEventListener(e,load,true)});var s=document.createElement('script');s.type='module';` +
    `s.crossOrigin='';s.src=${JSON.stringify(tag[1])};document.head.appendChild(s)}` +
    `function ready(){if(!--wait)setTimeout(load,0)}` +
    `ev.forEach(function(e){addEventListener(e,load,{capture:true,passive:true,once:true})});setTimeout(load,3000);` +
    `if(document.readyState==='complete')ready();else addEventListener('load',ready,{once:true});` +
    `try{new PerformanceObserver(function(l,o){if(l.getEntriesByName('first-contentful-paint').length){o.disconnect();ready()}})` +
    `.observe({type:'paint',buffered:true})}catch(e){ready()}})()</script>`
  return html.replace(tag[0], loader).replace(/<link rel="modulepreload"[^>]*>/g, '')
}
