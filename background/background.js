// Define your OpenAI API key here (Only for personal use; ensure it's kept secure)
const OPENAI_API_KEY = "Enter Your Api Key";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "explainWithGPT4",
    title: "Explain with GPT-4",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "rewriteWithGPT4",
    title: "Rewrite with GPT-4",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "rewriteProfessional",
    parentId: "rewriteWithGPT4",
    title: "Professional",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "rewriteCasual",
    parentId: "rewriteWithGPT4",
    title: "Casual",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "rewriteAppropriate",
    parentId: "rewriteWithGPT4",
    title: "Appropriate",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "explainWithGPT4") {
    handleExplain(info, tab);
  } else if (
    info.menuItemId === "rewriteProfessional" ||
    info.menuItemId === "rewriteCasual" ||
    info.menuItemId === "rewriteAppropriate"
  ) {
    handleRewrite(info, tab);
  }
});

async function handleExplain(info, tab) {
  const selectedText = info.selectionText.trim();

  if (!selectedText) {
    sendMessageToContentScript(tab.id, "No text selected. Please select some text to explain.", true);
    return;
  }

  const apiKey = OPENAI_API_KEY;
  if (!apiKey) {
    sendMessageToContentScript(tab.id, "API key not set. Please configure it in the extension options.", true);
    return;
  }

  try {
    sendMessageToContentScript(tab.id, "Fetching explanation...");

    const explanation = await getExplain(selectedText, apiKey);

    sendMessageToContentScript(tab.id, explanation);
  } catch (error) {
    console.error(error);
    sendMessageToContentScript(tab.id, error.message || "Failed to get explanation. Please try again.", true);
  }
}

async function handleRewrite(info, tab) {
  const selectedText = info.selectionText.trim();

  if (!selectedText) {
    sendMessageToContentScript(tab.id, "No text selected. Please select some text to rewrite.", true);
    return;
  }

  const apiKey = OPENAI_API_KEY;
  if (!apiKey) {
    sendMessageToContentScript(tab.id, "API key not set. Please configure it in the extension options.", true);
    return;
  }

  let tone = "appropriate";
  if (info.menuItemId === "rewriteProfessional") {
    tone = "professional";
  } else if (info.menuItemId === "rewriteCasual") {
    tone = "casual";
  }

  try {
    sendMessageToContentScript(tab.id, `Rewriting text in a ${tone} tone...`);

    const rewrittenText = await getRewrite(selectedText, tone, apiKey);

    sendMessageToContentScript(tab.id, rewrittenText);
  } catch (error) {
    console.error(error);
    sendMessageToContentScript(tab.id, error.message || "Failed to rewrite text. Please try again.", true);
  }
}

function getExplain(text, apiKey) {
  return new Promise((resolve, reject) => {
    const endpoint = "https://api.openai.com/v1/chat/completions";

    const requestBody = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an assistant that provides clear, concise, and easily understandable explanations in middle school English. Avoid using markdown, numbered lists, or any special formatting."
        },
        {
          role: "user",
          content: `Please explain the following text in simple, easy-to-understand terms suitable for a middle school student:\n\n"${text}"`
        }
      ],
      temperature: 0.5,
      max_tokens: 16000,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0
    };

    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })
      .then(async response => {
        if (!response.ok) {
          let errorMessage = `API Error: ${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            if (errorData.error && errorData.error.message) {
              errorMessage += ` - ${errorData.error.message}`;
            }
          } catch (parseError) {
          }
          throw new Error(errorMessage);
        }
        return response.json();
      })
      .then(data => {
        if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
          let cleanText = data.choices[0].message.content.trim();

          cleanText = cleanText.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');

          cleanText = cleanText.replace(/^\d+\.\s+/gm, '');
          cleanText = cleanText.replace(/^\*\s+/gm, '');

          cleanText = cleanText.replace(/[`~>]/g, '');

          cleanText = cleanText.replace(/\n+/g, '\n\n');

          resolve(cleanText);
        } else {
          resolve("No explanation available.");
        }
      })
      .catch(error => {
        reject(error);
      });
  });
}

function getRewrite(text, tone, apiKey) {
  return new Promise((resolve, reject) => {
    const endpoint = "https://api.openai.com/v1/chat/completions";

    let systemPrompt = "";
    if (tone === "professional") {
      systemPrompt = "You are an assistant that rewrites text to be more professional. Fix grammar and improve context appropriately while maintaining the original meaning and keeping the length similar.";
    } else if (tone === "casual") {
      systemPrompt = "You are an assistant that rewrites text to have a casual and conversational tone. Fix grammar and improve context appropriately while maintaining the original meaning and keeping the length similar.";
    } else {
      systemPrompt = "You are an assistant that rewrites text to improve grammar and context appropriately while maintaining the original meaning and keeping the length similar. Choose an appropriate tone based on the context of the text.";
    }

    const requestBody = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Please rewrite the following text to fix grammar and improve context appropriately while keeping the same length as much as possible. Tone: ${tone}.\n\n"${text}"`
        }
      ],
      temperature: 0.5,
      max_tokens: 16000,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0
    };

    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })
      .then(async response => {
        if (!response.ok) {
          let errorMessage = `API Error: ${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            if (errorData.error && errorData.error.message) {
              errorMessage += ` - ${errorData.error.message}`;
            }
          } catch (parseError) {
          }
          throw new Error(errorMessage);
        }
        return response.json();
      })
      .then(data => {
        if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
          let cleanText = data.choices[0].message.content.trim();

          cleanText = cleanText.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');

          cleanText = cleanText.replace(/^\d+\.\s+/gm, '');
          cleanText = cleanText.replace(/^\*\s+/gm, '');

          cleanText = cleanText.replace(/[`~>]/g, '');

          cleanText = cleanText.replace(/\n+/g, '\n\n');

          resolve(cleanText);
        } else {
          resolve("No rewritten text available.");
        }
      })
      .catch(error => {
        reject(error);
      });
  });
}

function sendMessageToContentScript(tabId, message, isError = false) {
  chrome.tabs.sendMessage(tabId, { type: "SHOW_MESSAGE", message, isError }, (response) => {
    if (chrome.runtime.lastError) {
      console.error(`Error sending message to tab ${tabId}:`, chrome.runtime.lastError);
    }
  });
}