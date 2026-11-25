/** A lens over a clothes hanger: searching for clothes, not just searching. */
export function SearchIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden
      className={`shrink-0 origin-[43%_43%] transition-transform duration-300 ease-out group-hover/search:-rotate-12 group-hover/search:scale-105 motion-reduce:transform-none ${className}`}>
      <circle cx="12" cy="12" r="9.25" className="fill-clay/10 transition-colors duration-300 group-hover/search:fill-clay/20" />
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10.6 8.6a1.5 1.5 0 1 1 1.4 2v1L6.9 15q-.3.9.7.9h8.8q1 0 .7-.9L12 11.6" stroke="currentColor" strokeWidth="1.45" />
      <path d="m19.6 19.6 5.2 5.2" className="stroke-clay" strokeWidth="3.2" />
    </svg>
  );
}
