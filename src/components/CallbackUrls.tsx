import { useEffect, useState } from 'react';
import { Code } from '@chakra-ui/react';

export default function CallbackUrls() {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    setUrls([
      'http://localhost:3000/api/auth/callback/google',
      `${window.location.origin}/api/auth/callback/google`,
    ]);
  }, []);

  return (
    <Code mt={2} p={2} display="block">
      {urls.map((url, index) => (
        <div key={url}>{url}</div>
      ))}
    </Code>
  );
}
