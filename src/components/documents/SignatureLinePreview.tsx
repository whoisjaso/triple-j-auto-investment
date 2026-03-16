interface Props {
  label: string;
  dateLabel?: string;
  signatureImage?: string;
  signatureDate?: string;
  printedName?: string;
}

export default function SignatureLinePreview({ label, dateLabel = 'Date', signatureImage, signatureDate, printedName }: Props) {
  return (
    <div>
      <div className="signature-line-container border-b border-black h-14 mb-2 relative flex items-end">
        {signatureImage && (
          <img
            src={signatureImage}
            alt={label}
            className="signature-img h-12 max-w-[200px] object-contain absolute bottom-0 left-2"
          />
        )}
        {signatureDate && (
          <span className="signature-date absolute bottom-1 right-0 text-xs text-black/70 font-medium">
            {new Date(signatureDate + 'T12:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
          </span>
        )}
      </div>
      <div className="flex justify-between text-[10px] uppercase tracking-widest font-semibold">
        <span>{label}</span>
        <span>{dateLabel}</span>
      </div>
      {printedName && <p className="text-[10px] text-black/40 mt-1">{printedName}</p>}
    </div>
  );
}
