import { useState, useEffect } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number; // default 38ms
  startDelay?: number; // default 600ms
}

export function useTypewriter({
  text,
  speed = 38,
  startDelay = 600,
}: UseTypewriterOptions) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let timeoutId: number;
    let intervalId: number;
    let currentIndex = 0;

    // Reset when text changes
    setDisplayedText('');
    setIsComplete(false);

    timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(intervalId);
          setIsComplete(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [text, speed, startDelay]);

  return { displayedText, isComplete };
}
