const OpenAI = require("openai");
const fs = require("fs/promises");

const client = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
});

// roles:
    // system -> initial behavior/identity/instructions for the assistant
    // user	-> user prompts
    // assistant -> model's response

async function getSummary(transcript) {
    console.log(process.env.OPENAI_API_KEY)
    try {
        const data = await fs.readFile(transcript, "utf-8");
    
        const prompt = `
        This is a transcript of a conversation. Each line begins with the speaker's username, followed by a colon, then what they said.
        
        Transcript:
        ${data}
        
        Please summarize the overall conversation, including all key talking/discussion points, in bullet points. Do it such that there is a main heading for each of the main talking points and then a couple jot notes for the key points of each main point.
        `;
    
        const response = await client.chat.completions.create({
          model: "gpt-4.1-mini",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt },
          ],
        });
    
        console.log(response.choices[0].message.content);
        return response.choices[0].message.content;
    } catch (err) {
        console.error("Error reading file or calling API:", err);
    }
}

module.exports.getSummary = getSummary;