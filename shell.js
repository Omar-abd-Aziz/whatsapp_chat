const { Client, LocalAuth } = require("whatsapp-web.js");
const fetch = require("node-fetch");
const qrcode = require("qrcode"); // QR code for the webpage
const express = require("express");
const fs = require("fs");
const path = require("path");

const mainHost = "https://aiiiiiiiii.onrender.com";
const API_URL = `${mainHost}/generate`; // API endpoint

// Base directory to store chat files
const chatDir = "./chats";

// Ensure the chats directory exists
if (!fs.existsSync(chatDir)) fs.mkdirSync(chatDir);

// Express server setup
const app = express();
const PORT = 3000;

let qrCodeString = null; // Variable to store the latest QR code string

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
  return []; // Return an empty array if the file doesn't exist
}

// Function to save a new message to the user's chat
function saveChat(chatId, role, content) {
  const chat = loadChat(chatId); // Load existing chat data
  chat.push({ role, content }); // Add new message
  const filePath = path.join(chatDir, `${chatId}.json`);

  try {
    fs.writeFileSync(filePath, JSON.stringify(chat, null, 2));
    console.log(`Chat saved for ${chatId}`);
  } catch (err) {
    console.error("Error saving chat:", err);
  }
}

// Initialize WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth(),
});

// Function to generate AI response
const generateWithAi = async (userMessage, chatData) => {
  let historyLimit = 5;
  let recentMessages = chatData.slice(-Math.min(historyLimit, chatData.length));

    // Construct the message for AI
let historyMessagesToSend = `

You are an AI assistant for a PUBG Mobile store. Your job is to respond accurately and concisely to user messages.

### Guidelines for Responses:

1. **Greeting**:  
2. **Pricing Inquiry**:  
  لو حد سال علي العروض او قالك عاوز اشحن ابعتلو الاسعار  
   If the user asks about prices, requests a recharge, or asks about offers, send the price list:  
   **Important**: If the user asks for a custom price not on the list, suggest the closest available option.
   If a user sends any message, greet them with:  
  
   "اهلا بيك في متجر الحلواني لشحن شدات ببجي موبايل حضرتك محتاج اي\\n
  دي اسعار شدات ببجي بال ID:  
   60 شدة بـ 70 جنيه  \\n
   120 شدة بـ 135 جنيه  \\n
   180 شدة بـ 200 جنيه  \\n
   325 شدة بـ 280 جنيه 🔥  \\n
   385 شدة بـ 340 جنيه 🔥  \\n
   660 شدة بـ 560 جنيه  \\n
   720 شدة بـ 620 جنيه  \\n
   985 شدة بـ 840 جنيه  \\n
   1015 شدة بـ 875 جنيه  \\n
   1800 شدة بـ 1500 جنيه  \\n
   2125 شدة بـ 1780 جنيه  \\n
   3850 شدة بـ 2700 جنيه  \\n
   4000 شدة بـ 2800 جنيه 🔥  \\n
   8100 شدة بـ 5300 جنيه 🔥  \\n

   شوف لو احتجت تشحن ابعت الـ ID وحوّل الفلوس فودافون كاش على الرقم دا:  
   01011960187  
  "  


3. **Payment Method**:  
   If the user asks about payment, respond with:  
   "ابعت الـ ID وحوّل الفلوس فودافون كاش على الرقم دا:  
   01011960187"

4. **Guarantee (ضمان)**:  
   If the user asks for guarantees, respond with:  
   "ممكن تسأل علينا أي حد اتعامل معانا، + أكيد حضرتك شفت صفحة الفيسبوك اللي عليها 10,000 متابع.  
   جربنا في مبلغ قليل الأول عشان تتأكد إننا مضمونين.  
   وفي الأول والآخر احنا تحت أمرك في أي وقت 💙"  

   If they ask again, reply:  
   "لما تيجي تشحن جرب اللي قصادك في مبلغ صغير الأول، مثلا اشحن 60 شدة بـ 70 جنيه وشوف هيوصلك ولا لا.  
   لو وصلك يبقى الراجل مضمون، لو موصلكش يبقى خسرت مبلغ صغير أحسن ما تخسر مبلغ كبير.  
   الطريقة دي تجربها معايا أو مع غيري."

5. **Location Inquiry**:  
   If the user asks for your address or physical location, reply with:  
   "المكان الشرقية الزقازيق، بس التعامل كله هنا على الواتس وتحويل الفلوس بيتم عن طريق فودافون كاش."


6. لو الزبون سالك علي سعر معين وهوا مش موجود في قايمة الاسعار رشحلو يشحن اقرب حاجه للسعر او عدد الشدات الي هوا طلبه الي موجوده في قايمة الاسعار
  يعني لو قالك عاوز اشحن 2000 شدة قوله مفيش 2000 شدة بس في 2125 شدة بي 1780 جنية او في 1800 شدة بي 1500 جنية وكن ذكيا في ردودك لاقناع الزبون


7. لو حد طلب يكلم عمر قوله كلمه واتس علي رقمه دا 01111881968


If the user says "عاوز اشحن" without specifying the quantity, reply:  
"حضرتك محتاج تشحن كام شدة؟ دي قائمة الأسعار عندنا: "  
and send price list



  لو سالك اي سوال تاني مش موجود هنا اعتمد علي الموجود انك تقنعه يشحن منا ويبعت الفلوس 
---

### Instructions:
- Focus on responding directly to the user's message.

 And this is Last messages of the Conversation: ${JSON.stringify(recentMessages)}

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

Please respond directly to the user's message: "${userMessage}"
`.trim(); 

  try {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: historyMessagesToSend }),
    };

    const response = await fetch(API_URL, options);
    // console.log(response)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    if (data && data.response) {
      try {
        const parsedResponse = JSON.parse(data.response);
        if (parsedResponse && parsedResponse.response) {
          return parsedResponse.response;
        }
      } catch (e) {
        console.error("Error parsing AI response:", e);
      }
    }
    return "ممكن توضح حضرتك محتاج اي !";
  } catch (error) {
    console.error("Error fetching AI response:", error);
    return "";
  }
};

// Express route to display QR code on a webpage
app.get("/", async (req, res) => {
  if (!qrCodeString) {
    res.send("<h2>QR Code is not ready yet. Please wait...</h2>");
    return;
  }

  try {
    const qrImage = await qrcode.toDataURL(qrCodeString);
    res.send(`
      <html>
        <head>
          <title>WhatsApp QR Code</title>
        </head>
        <body style="text-align: center; font-family: Arial, sans-serif;">
          <h2>Scan this QR Code with your WhatsApp</h2>
          <img src="${qrImage}" alt="QR Code" />
        </body>
      </html>
    `);
  } catch (err) {
    console.error("Error generating QR code:", err);
    res.send("<h2>Error generating QR code. Please try again.</h2>");
  }
});

// Handle incoming WhatsApp messages
client.on("message", async (message) => {
  const userMessage = message.body;
  console.log("recive message: ", userMessage)
  const chatId = `chat-${message.from}`;
  const chatData = loadChat(chatId);

  try {
    const aiResponse = await generateWithAi(userMessage, chatData);
    await message.reply(aiResponse);

    // Save the conversation
    saveChat(chatId, "user", userMessage);
    saveChat(chatId, "assistant", aiResponse);
  } catch (error) {
    console.error("Error handling message:", error);
    await message.reply("An error occurred while generating a response.");
  }
});

// QR Code Event for WhatsApp authentication
client.on("qr", (qr) => {
  qrCodeString = qr; // Store QR code string for the web page
  console.log("QR code updated. Open http://localhost:3000 to scan.");
});

// Ready Event - indicates the bot is connected and ready
client.on("ready", () => {
  console.log("Client is ready!");
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Web server running at: http://localhost:${PORT}`);
});

// Initialize WhatsApp client
client.initialize();
