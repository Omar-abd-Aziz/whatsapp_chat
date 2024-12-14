
const API_URL = "https://api.voids.top/v1/chat/completions"; // New API endpoint

try {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'hi' }] }),
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.statusText}`);
  }

  const data = await response.json();
  console.log( data.choices[0].message.content);

} catch (error) {
  console.error('Request failed', error);
}



