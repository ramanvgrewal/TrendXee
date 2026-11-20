import { useEffect } from "react";

const AWAY_TITLES = ["👀 Come back!", "We miss you! 💔", "🔥 Don't leave yet..." , "We hope you come back soon " , "We are waiting for you..🥹"];

export function useTabTitle(titles: string[] = AWAY_TITLES, intervalMs = 1000) {
  useEffect(() => {
    let savedTitle = "";
    let i = 0;
    let timer: ReturnType<typeof setInterval> | undefined;

    const onVisibilityChange = () => {
      if (document.hidden) {
        savedTitle = document.title;
        clearInterval(timer);
        i = 0;
        document.title = titles[0];
        timer = setInterval(() => {
          i = (i + 1) % titles.length;
          document.title = titles[i];
        }, intervalMs);
      } else {
        clearInterval(timer);
        document.title = savedTitle;
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearInterval(timer);
      document.title = savedTitle;
    };
  }, [titles, intervalMs]);
}