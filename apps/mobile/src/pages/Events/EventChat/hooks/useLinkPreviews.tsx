// useLinkPreviews.ts
import { useCallback, useRef, useState } from 'react';
import type { ChatMsg, LinkPreview } from '../components/ChatMessagesList';

export function useLinkPreviews() {
  const [linkPreviews, setLinkPreviews] = useState<Record<string, LinkPreview>>(
    {}
  );
  const fetchedPreviewsRef = useRef<Set<string>>(new Set());

  const extractLinks = useCallback((text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  }, []);

  const fetchLinkPreview = useCallback(
    async (url: string): Promise<LinkPreview | null> => {
      try {
        const response = await fetch(url);
        const html = await response.text();

        const titleMatch = html.match(
          /<meta property="og:title" content="([^"]+)"/
        );
        const descMatch = html.match(
          /<meta property="og:description" content="([^"]+)"/
        );
        const imageMatch = html.match(
          /<meta property="og:image" content="([^"]+)"/
        );

        return {
          title: titleMatch?.[1] || new URL(url).hostname,
          description: descMatch?.[1],
          image: imageMatch?.[1],
          url,
        };
      } catch (e) {
        console.warn('[link preview error]', e);
        return {
          title: new URL(url).hostname,
          url,
        };
      }
    },
    []
  );

  const fetchPreviewForMessage = useCallback(
    async (message: ChatMsg) => {
      if (fetchedPreviewsRef.current.has(message.id)) return;

      const links = extractLinks(message.body);
      if (links.length === 0) return;

      fetchedPreviewsRef.current.add(message.id);

      try {
        const preview = await fetchLinkPreview(links[0]);
        if (preview) {
          setLinkPreviews((prev) => ({ ...prev, [message.id]: preview }));
        }
      } catch (error) {
        console.error('[link preview fetch error]', error);
      }
    },
    [extractLinks, fetchLinkPreview]
  );

  return {
    linkPreviews,
    fetchPreviewForMessage,
  };
}
