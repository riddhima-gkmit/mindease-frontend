import { Button } from '../ui/button';

interface InfoDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  actionLabel?: string;
}

export default function InfoDialog({
  open,
  onClose,
  title,
  description,
  actionLabel = 'Okay',
}: InfoDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-white rounded-3xl shadow-lg p-6">
        <h3 className="mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="flex justify-end">
          <Button onClick={onClose} className="rounded-2xl">
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}


