import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './routes'
import './styles/globals.css'

// In production this bundle is requested only after the first paint (see deferAppScript in
// scripts/postbuild.ts), so hydration never delays the LCP.
export const createRoot = ViteReactSSG({ routes, basename: import.meta.env.BASE_URL })
