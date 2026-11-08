import { memo } from 'react';

interface Props {
  text: string;
  className?: string;
}

/**
 * Wraps each word in a clipping mask so it can slide in from below.
 * The full text stays available to assistive tech via the parent element.
 */
function SplitWordsBase({ text, className }: Props) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className={`split-word ${className ?? ''}`} aria-hidden="true">
          <span>{word}</span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
      <span className="sr-only">{text}</span>
    </>
  );
}

export const SplitWords = memo(SplitWordsBase);
