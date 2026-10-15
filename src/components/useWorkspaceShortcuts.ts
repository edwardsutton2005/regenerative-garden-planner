import { useEffect, useRef } from 'react'

type ShortcutHandlers = {
  onUndo: () => void
  onRedo: () => void
  onEscape: () => void
  onDelete: () => void
  /** False while something else owns the keyboard (e.g. the catalog). */
  enabled: boolean
}

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

/**
 * The workspace's global keyboard shortcuts, in one place:
 * Cmd/Ctrl+Z undo; Shift+Cmd/Ctrl+Z or Ctrl+Y redo; Escape steps back;
 * Delete/Backspace removes the selection. Ignored while typing in a field,
 * where the browser's own text editing applies. Elements that handle a key
 * themselves (a focused plant marker or bed tab) stop it from reaching here.
 */
export function useWorkspaceShortcuts(handlers: ShortcutHandlers) {
  // Always call the latest handlers without re-registering the listener.
  const handlersRef = useRef(handlers)
  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const h = handlersRef.current
      if (!h.enabled || isTyping(e.target)) return
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()

      if (mod && key === 'z' && !e.altKey) {
        e.preventDefault()
        if (e.shiftKey) h.onRedo()
        else h.onUndo()
      } else if (e.ctrlKey && !e.metaKey && key === 'y') {
        e.preventDefault()
        h.onRedo()
      } else if (e.key === 'Escape') {
        h.onEscape()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        h.onDelete()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
