import { useEffect, useRef } from 'react'
interface Props { open: boolean; title?: string; description?: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }
export function ConfirmDialog({ open, onConfirm, onCancel, title = 'Restore the starter code?', description = 'This replaces the code in this exercise. Your completed lessons and learning progress will stay saved.', confirmLabel = 'Restore starter code' }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (open && dialog && !dialog.open) { dialog.showModal(); cancelRef.current?.focus() }
    if (!open && dialog?.open) dialog.close()
  }, [open])
  return <dialog ref={dialogRef} className="confirm-dialog" aria-labelledby="reset-title" aria-describedby="reset-description" onCancel={onCancel}><h2 id="reset-title">{title}</h2><p id="reset-description">{description}</p><div className="dialog-actions"><button className="button button-secondary" ref={cancelRef} type="button" onClick={onCancel}>Keep my code</button><button className="button button-primary" type="button" onClick={onConfirm}>{confirmLabel}</button></div></dialog>
}
