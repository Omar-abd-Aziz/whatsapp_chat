const { Client, LocalAuth } = require("whatsapp-web.js");
const fetch = require("node-fetch");
const qrcode = require("qrcode-terminal"); // Import qrcode-terminal

const mainHost = "https://aiiiiiiiii.onrender.com";
const API_URL = `${mainHost}/generate`; // API endpoint


const fs = require('fs');
const filePath = 'storage.json';

// Function to load existing data from JSON file
function loadData() {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data); // Parse JSON string into an object
        }
        return {}; // Return an empty object if file doesn't exist
    } catch (err) {
        console.error('Error reading file:', err);
        return {};
    }
}







// Function to get the conversation for a specific chat ID
function getChatById(chatId) {
  const data = loadData(); // Load all existing data

  if (data[chatId]) {
      return data[chatId]; // Return the specific chat array
  } else {
      console.log(`Chat with ID '${chatId}' not found.`);
      return null; // Return null if chat ID does not exist
  }
}

// Function to save/update a chat conversation
function saveMessage(chatId, role, content) {
    const data = loadData(); // Load existing data

    // If chatId doesn't exist, initialize it as an empty array
    if (!data[chatId]) {
        data[chatId] = [];
    }

    // Append the new message as an object to the chat array
    data[chatId].push({ role, content });

    try {
        // Write the updated data back to the file
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Message added to chat ${chatId}`);
    } catch (err) {
        console.error('Error writing file:', err);
    }
}





// Initialize WhatsApp bot
const client = new Client({
  authStrategy: new LocalAuth(),
});

let conversationHistory = [];


// Function to generate AI response based on user input
const generateWithAi = async (userMessage,chatData) => {
 


  // Construct the message for AI
let historyMessagesToSend = `

You are an AI assistant for a PUBG Mobile store. Your job is to respond accurately and concisely to user messages.

### Guidelines for Responses:

1. **Greeting**:  
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

2. **Pricing Inquiry**:  
  لو حد سال علي العروض او قالك عاوز اشحن ابعتلو الاسعار  
   If the user asks about prices, requests a recharge, or asks about offers, send the following price list make each price in line differnt (\n):  
   "  
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

   **Important**: If the user asks for a custom price not on the list, suggest the closest available option.

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


  لو سالك اي سوال تاني مش موجود هنا اعتمد علي الموجود انك تقنعه يشحن منا ويبعت الفلوس 
---

### Instructions:
- Focus on responding directly to the user's message:  
  "${userMessage}"  

 And this is Last 10 messages of the Conversation: ${JSON.stringify(chatData.slice(-10))}

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
`;


  historyMessagesToSend = historyMessagesToSend.trim();
  console.log(historyMessagesToSend); // Debugging the request
  console.log("-------------------------------------------"); // Debugging the request

  try {
    // Making API request to your backend
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: `${historyMessagesToSend}` }),
    };

    const response = await fetch(API_URL, options);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();




    console.log("result: ", data)
    console.log("result: ", JSON.parse(data.response).response)


    // Check if the API response contains a "response" key
    if (data.response) {
      return JSON.parse(data.response).response || "";
    } else {
      console.error("Invalid AI response structure:", data);
      return { response: "I couldn't understand the response from the AI service.", summary: "" };
    }
  } catch (error) {
    console.error("Error fetching AI response:", error);
    return { response: "I'm sorry, something went wrong. Please try again." };
  }
};

// Handle incoming WhatsApp messages
client.on("message", async (message) => {
  const userMessage = message.body;
  console.log(message);
  const chatId = `chat-${message.from}`;
  const chatData = getChatById(chatId);

  try {
    console.log(`Received message: "${userMessage}"`);
    const aiResponse = await generateWithAi(userMessage,chatData);

    const botResponse = aiResponse;




    // Send the AI response to the user
    await message.reply(botResponse);
    console.log(`Replied with: "${botResponse}"`);

    conversationHistory.push({ role: "user", content: userMessage });
    conversationHistory.push({ role: "assistant", content: aiResponse });

    saveMessage(`chat-${message.from}`, 'user', `${userMessage}`);
    saveMessage(`chat-${message.from}`, 'assistant', `${aiResponse}`);

    console.log("********************************");

    console.log(chatData);
    console.log("********************************");



  } catch (error) {
    console.error("Error handling message:", error);
    await message.reply("An error occurred while generating a response.");
  }
});

// QR Code Event for WhatsApp authentication
client.on("qr", (qr) => {
  // Generate the QR code visually in the terminal
  qrcode.generate(qr, { small: true }); // This will show a scannable QR code
  console.log("Scan the QR code with your phone to authenticate.");
});

// Ready Event - indicates the bot is connected and ready
client.on("ready", () => {
  console.log("Client is ready!");
});

// Initialize WhatsApp client
client.initialize();
