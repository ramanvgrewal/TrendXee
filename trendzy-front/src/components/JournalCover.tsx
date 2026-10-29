import type { JournalArticle } from "@/content/journal";

/** Decorative garment studies, rather than retailer imagery with changing stock. */
export function JournalCover({ article, large = false }: { article: JournalArticle; large?: boolean }) {
  return (
    <div aria-hidden="true" className={`relative isolate flex h-full min-h-64 flex-col justify-between overflow-hidden rounded-[22px] bg-[#e5dbc7] p-6 text-[#302218] sm:p-8 ${large ? "lg:min-h-[440px]" : ""}`}>
      <div className="relative z-10 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.16em]">
        <span>TrendXee / Journal</span><span>Field study</span>
      </div>
      <svg viewBox="0 0 440 360" className="absolute inset-0 m-auto h-[90%] w-[90%] max-w-lg" fill="none">
        <circle cx="220" cy="180" r="138" stroke="#302218" strokeOpacity=".12" />
        <path d="M18 180h404M220 18v324" stroke="#302218" strokeOpacity=".08" />
        {article.cover === "denim" ? (
          <g transform="rotate(9 220 180)">
            <path d="M148 64h144l22 233-76 12-18-150-18 150-76-12 22-233Z" fill="#657b83" stroke="#302218" strokeWidth="2" />
            <path d="M148 86h144M220 65v94M160 87q0 39 40 39M280 87q0 39-40 39M135 276l64 9M242 285l64-9" stroke="#e5dbc7" strokeWidth="2" />
            <path d="M219 89v47h-10" stroke="#302218" strokeWidth="2" />
          </g>
        ) : (
          <>
            {article.cover === "layers" && <path d="m139 71 47-19h68l47 19 39 80-49 21-13-25 9 165H153l9-165-13 25-49-21 39-80Z" fill="#899273" stroke="#302218" strokeWidth="2" transform="rotate(-8 220 180)" />}
            <g transform={`rotate(${article.cover === "layers" ? 7 : -8} 220 180)`}>
              <path d="m150 91 40-18q30 25 60 0l40 18 48 66-51 32-16-23 9 125H160l9-125-16 23-51-32 48-66Z" fill={article.cover === "layers" ? "#f5f0e5" : "#b96947"} stroke="#302218" strokeWidth="2" />
              <path d="M190 73q30 46 60 0M163 275h114M125 145l35 21M280 166l35-21" stroke="#302218" strokeOpacity=".5" strokeWidth="2" />
              {article.cover === "discovery" && <path d="m207 150 26 40m0-40-26 40" stroke="#f5f0e5" strokeWidth="9" />}
            </g>
          </>
        )}
      </svg>
      <p className="relative z-10 mt-48 max-w-[12ch] font-display text-3xl italic leading-[1.05] sm:text-4xl">{article.coverLine}</p>
    </div>
  );
}
