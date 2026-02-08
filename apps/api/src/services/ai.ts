interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateAIResponse(
  messages: ChatMessage[],
  context?: {
    availableProducts?: any[];
    userBudget?: number;
  }
): Promise<string> {
  // Mock AI responses - replace with Groq later
  const mockResponses = [
    'Hallo! Ich habe Sony WH-1000XM5 Kopfhörer gefunden. Der beste Preis ist 268€ bei Amazon.de. Möchtest du mehr Details oder andere Optionen?',
    'Perfekt! Die Apple AirPods Pro kosten nur 152€ bei MediaMarkt. Das ist der beste Preis. Passt das Budget?',
    'Für Kaffeeautomaten empfehle ich den DeLonghi Magnifica für 155€ bei MediaMarkt. Brauchst du noch mehr Optionen?',
    'Gerne helfe ich! Was für Kopfhörer suchst du? Over-Ear oder In-Ear? Noise-Cancelling wichtig?',
    'Ich habe passende Produkte gefunden. Der beste Deal ist bei MediaMarkt. Soll ich dir den Link schicken?',
  ];

  // Use context to make responses smarter
  if (context?.availableProducts?.length > 0) {
    const bestProduct = context.availableProducts[0];
    return `Perfekt! Ich empfehle ${bestProduct.name} für ${bestProduct.bestPrice?.price}€ bei ${bestProduct.bestPrice?.store}. Möchtest du mehr Details?`;
  }

  return mockResponses[Math.floor(Math.random() * mockResponses.length)];
}

export async function extractUserIntent(userMessage: string): Promise<{
  intent: 'search' | 'gift' | 'compare' | 'general';
  keywords: string[];
  budget?: number;
}> {
  const lowerMessage = userMessage.toLowerCase();

  // Simple keyword matching
  if (lowerMessage.includes('suche') || lowerMessage.includes('such')) {
    return {
      intent: 'search',
      keywords: ['Kopfhörer', 'Sony', 'Apple', 'Kaffee'],
      budget: 300,
    };
  }

  return {
    intent: 'general',
    keywords: [],
  };
}
