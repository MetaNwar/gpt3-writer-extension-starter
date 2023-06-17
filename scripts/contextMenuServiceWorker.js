// Function to get + decode API key
const getKey = () => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['openai-key'], (result) => {
        if (result['openai-key']) {
          const decodedKey = atob(result['openai-key']);
          resolve(decodedKey);
        }
      });
    });
};

const sendMessage = (content) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0].id;

        chrome.tabs.sendMessage(
        activeTab,
        { message: 'inject', content },
        (response) => {
            if (response.status === 'failed') {
            console.log('injection failed.');
            }
        }
        );
    });
};  

// Setup our generate function
const generate = async (prompt) => {
    // Get your API key from storage
    const key = await getKey();
    const url = 'https://api.openai.com/v1/completions';
      
    // Call completions endpoint
    const completionResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'text-davinci-003',
        prompt: prompt,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });
      
    // Select the top choice and send back
    const completion = await completionResponse.json();
    return completion.choices.pop();
  }

const generateCompletionAction = async (info) => {
    try {
        // Send mesage with generating text (this will be like a loading indicator)
        sendMessage('generating...');

        const { selectionText } = info;
        const basePromptPrefix = `
        Write me an engaging twitter thread. Number each tweet. Include hashtags for each tweet. Include emojis. Include an elipses at the end of the first tweet. Please make sure the tweets go in-depth and show that the writer is an expert on the topic.
        `;

        // Add this to call GPT-3
    const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);
    
    // Send the output when we're all done
    sendMessage(baseCompletion.text);
    // Let's see what we get!
    // console.log(baseCompletion.text)
      } catch (error) {
        console.log(error);
        // Add this here as well to see if we run into any errors!
        sendMessage(error.toString());
      }
};

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'context-run',
      title: 'Threadleader: Generate tweet thread!',
      contexts: ['selection'],
    });
  });
  
  // Add listener
  chrome.contextMenus.onClicked.addListener(generateCompletionAction);

