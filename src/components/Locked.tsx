interface Props {
  eyebrow: string;
  title: string;
  text: string;
}

/** Placeholder shown for a section that needs a calculation first. */
export default function Locked({ eyebrow, title, text }: Props) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-sage-200 bg-cream-50/70 px-6 py-10 text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold text-sage-900 sm:text-3xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sage-700">{text}</p>
    </div>
  );
}
