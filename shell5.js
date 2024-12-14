const { Client, LocalAuth } = require("whatsapp-web.js");
const fetch = require("node-fetch");
const qrcode = require("qrcode");
const express = require("express");
const fs = require("fs");
const path = require("path");
const open = require("open");

// Configuration
const API_URL = "https://api.voids.top/v1/chat/completions";
const PORT = 3005;
const chatDir = "./chats";
const rulesFilePath = path.join(__dirname, "rules.txt");

// Ensure the chats directory exists
if (!fs.existsSync(chatDir)) fs.mkdirSync(chatDir);

// Initialize rules from file or default value
let rules = fs.existsSync(rulesFilePath)
  ? fs.readFileSync(rulesFilePath, "utf8").trim()
  : `
    you are an ai assiest answer any question
`.trim();

// Express server setup
const app = express();
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// WhatsApp Client Setup
const client = new Client({
    puppeteer: {
      executablePath: './node_modules/puppeteer-core/.local-chromium/win64-1045629/chrome-win/chrome.exe'
    }
  });

let qrCodeString = null;
let isOpen = false;

// Function to load chat data for a specific user
function loadChat(chatId) {
  const filePath = path.join(chatDir, `${chatId}.json`);
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error loading chat:", err);
  }
  return [];
}

// Function to save chat messages
function saveChat(chatId, role, content) {
  const chat = loadChat(chatId);
  chat.push({ role, content });
  const filePath = path.join(chatDir, `${chatId}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(chat, null, 2));
    console.log(`Chat saved for ${chatId}`);
  } catch (err) {
    console.error("Error saving chat:", err);
  }
}







const modelTimeout = 15000; // Timeout for each model request in ms

const models = [
    'gpt-4o-mini-free',
    'gpt-4o-mini',
    'gpt-4o-free',
    'gpt-4-turbo-2024-04-09',
    'gpt-4o-2024-08-06',
    'grok-2',
    'grok-2-mini',
    'claude-3-opus-20240229',
    'claude-3-opus-20240229-gcp',
    'claude-3-sonnet-20240229',
    'claude-3-5-sonnet-20240620',
    'claude-3-haiku-20240307',
    'claude-2.1',
    'gemini-1.5-flash-exp-0827',
    'gemini-1.5-pro-exp-0827'
];







// Generate AI response
async function generateWithAI(messages) {
    const historyLimit = 5;
    const recentMessages = messages.slice(-Math.min(historyLimit, messages.length));
  
  

    const predefinedRules = `
You are an AI assistant. Your job is to respond accurately and concisely to user messages.
${rules}

### Instructions:
- Focus on responding directly to the user's message.


- **Response Format**:  
our response must strictly adhere to the following JSON format. Do not include any markdown symbols, , or unnecessary line breaks. Your response must start with:
  {
    "response": "Your concise reply based on the guidelines above."
  }
Any deviation from this format is unacceptable."

- **Output Requirements**:  
  - Start the response with {"response": "..."}  
  - Do **not** include any additional text before or after the JSON.  
  - Avoid redundancy and keep the response clear and concise.

Please respond directly to the user's message
  
  `.trim();

  
  
    const messagesPayload = [
      { role: "system", content: `${predefinedRules}` },
      ...recentMessages.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: `${msg.content}`,
      })),
    ];
  
    try {
      for (let model of models) {
        try {
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model, messages: messagesPayload }),
            timeout: modelTimeout, // Set timeout
          });
  
          if (response.ok) {
            const data = await response.json();
            if (data.choices && data.choices.length > 0) {
              console.log("main: ",JSON.parse(data.choices[0].message.content).response)
              return JSON.parse(data.choices[0].message.content).response;
            }
          }
        } catch (error) {
          console.error(`Error with model ${model}:`, error.message);
        }
      }
  
      throw new Error('All models failed or timed out.');
    } catch (error) {
      console.error('Error in generateWithAI:', error);
      throw error;
    }
}

// Webpage to display and update rules
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
      
        <title>Edit Rules</title>
        <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;700&display=swap" rel="stylesheet">
      
        <style>
        *{
        padding: 0;
        margin: 0;
        box-sizing: border-box;
        }
        .saveRulesBtn{
            padding: 5px 15px;
            font-weight: bold;
            margin: 10px auto 20px;
            font-size: 16px;
            background: green;
            color: #fff;
            font-family: cairo;
            border: none;
            border-radius: 15px;
            cursor: pointer;
            background-image: linear-gradient(135deg, #3F51B5 0%, #3e99d4 100%);
        }
        
        </style>
    </head>
    <body style="text-align: center; font-family: Cairo;">


        <h3>QR Code for WhatsApp</h3>
        <img id="qrCode" src="" alt="QR Code" />

        <br>
        <div>

            <h2>Edit Rules</h2>

            <form method="POST" action="/update-rules">
                <textarea  dir="auto" style="font-size: 20px;max-height: 400px; font-family: cairo; padding: 10px;margin: 10px;width: 95%;max-width: 800px;border-radius: 10px;" name="rules" rows="20" cols="100">${rules}</textarea><br>
                <button class="saveRulesBtn" type="submit">Save Rules</button>
            </form>
        
        </div>


        <script>
          const eventSource = new EventSource('/events');
          eventSource.onmessage = (event) => {
            const qrImage = event.data;
            document.getElementById('qrCode').src = qrImage;
          };
        </script>
      </body>
    </html>
  `);
});

// Endpoint to update rules
app.post("/update-rules", (req, res) => {
  const updatedRules = req.body.rules;
  if (updatedRules) {
    rules = updatedRules.trim();
    fs.writeFileSync(rulesFilePath, rules, "utf8");
    console.log("Rules updated successfully!");
    res.redirect("/");
  } else {
    res.status(400).send("Rules cannot be empty.");
  }
});

// Serve real-time QR code updates
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const interval = setInterval(() => {
    if (qrCodeString) {
      qrcode.toDataURL(qrCodeString)
        .then((qrImage) => res.write(`data: ${qrImage}\n\n`))
        .catch((err) => console.error("Error generating QR code:", err));
    }
  }, 1000);

  req.on("close", () => clearInterval(interval));
});

// Handle WhatsApp QR Code
client.on("qr", (qr) => {
  qrCodeString = qr;
  if (!isOpen) {
    open(`http://localhost:${PORT}`);
    isOpen = true;
  }
});

// WhatsApp Ready Event
client.on("ready", () => console.log("Client is ready!"));

// Handle incoming messages
client.on("message", async (message) => {
  const userMessage = message.body;
  console.log(userMessage);
  const chatId = `chat-${message.from}`;
  const chatData = loadChat(chatId);

  try {
    const aiResponse = await generateWithAI([...chatData, { role: "user", content: userMessage }]);
    if (aiResponse.trim()) {
      await message.reply(aiResponse);
      saveChat(chatId, "user", userMessage);
      saveChat(chatId, "assistant", aiResponse);
    }
  } catch (error) {
    console.error("Error handling message:", error);
  }
});

// Start the web server
app.listen(PORT, () => {
  console.log(`Web server running at: http://localhost:${PORT}`);
  console.log("Please Wait To Scan QR Code...");
});

// Initialize WhatsApp client
client.initialize().catch((err) => console.error("Error initializing WhatsApp client:", err));
