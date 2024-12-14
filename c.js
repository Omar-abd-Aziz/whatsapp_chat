const API_URL = "https://api.voids.top/v1/chat/completions"; // New API endpoint
let message = "hi"

const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages: message }),
    timeout: 15000, // Set timeout
});

if (response.ok) {
    const data = await response.json();
    console.log( { model, response: data.choices[0].message.content });
}