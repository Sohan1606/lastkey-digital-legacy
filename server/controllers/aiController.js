const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const Asset = require('../models/Asset');
const Beneficiary = require('../models/Beneficiary');
const Capsule = require('../models/Capsule');
const User = require('../models/User');

let openai;

try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} catch (error) {
  openai = null;
}

const generateLegacyMessage = async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({
        success: false,
        error: 'AI service is currently disabled. Please configure OPENAI_API_KEY.'
      });
    }

    const { emotion, recipient, tone, context } = req.body;

    const prompt = `Generate a heartfelt digital legacy message from someone who has passed away. 

Emotion: ${emotion}
Recipient: ${recipient}
Tone: ${tone}
Context: ${context || 'no additional context'}

The message should:
- Be emotional and meaningful
- 150-250 words
- Feel personal and genuine
- End with a farewell

Write only the message, no explanations.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.8,
    });

    const message = completion.choices[0].message.content.trim();

    res.json({
      status: 'success',
      data: {
        message,
        emotion,
        recipient,
        tone,
      },
    });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ status: 'fail', message: 'Failed to generate message' });
  }
};

const getAISuggestions = async (req, res) => {
  try {
    const { user } = req;
    const userId = user._id;

    // Fetch actual stats
    const Asset = require('../models/Asset');
    const Beneficiary = require('../models/Beneficiary');
    const Capsule = require('../models/Capsule');

    const [assetCount, beneficiaryCount, capsuleCount] = await Promise.all([
      Asset.countDocuments({ userId }),
      Beneficiary.countDocuments({ userId }),
      Capsule.countDocuments({ userId })
    ]);

    const stats = {
      assets: assetCount,
      beneficiaries: beneficiaryCount,
      capsules: capsuleCount
    };

    // Enhanced AI analysis based on user stats
    const suggestions = [];
    const lastLoginDays = Math.floor((new Date() - new Date(user.lastActive || user.createdAt)) / (1000 * 60 * 60 * 24));

    // Critical: No beneficiaries
    if (!stats.beneficiaries || stats.beneficiaries === 0) {
      suggestions.push({
        id: 'beneficiaries-critical',
        title: 'Add Emergency Beneficiaries Now',
        description: 'No one will receive your legacy if something happens. Add at least 2 trusted contacts.',
        category: 'setup',
        tone: 'urgent',
        priority: 'critical',
        action: 'beneficiaries',
        icon: 'users'
      });
    } 

    // High: Low vault assets
    if (stats.assets && stats.assets < 3) {
      suggestions.push({
        id: 'vault-low',
        title: 'Strengthen Your Digital Vault',
        description: `${3 - stats.assets} more assets needed for basic security (photos, documents, passwords).`,
        category: 'security',
        tone: 'encouraging',
        priority: 'high',
        action: 'vault',
        icon: 'lock'
      });
    }

    // Medium: No capsules/messages
    if (!stats.capsules || stats.capsules === 0) {
      suggestions.push({
        id: 'capsules-none',
        title: 'Create Your First Time Capsule',
        description: 'Schedule emotional messages for family. AI can help write them.',
        category: 'content',
        tone: 'inspirational',
        priority: 'medium',
        action: 'capsules',
        icon: 'clock'
      });
    }

    // Premium upsell (smart)
    if (!user.isPremium && stats.beneficiaries && stats.beneficiaries > 2) {
      suggestions.push({
        id: 'premium-upsell',
        title: 'Unlock Premium Features',
        description: 'Unlimited beneficiaries, AI message generation, advanced analytics. $4.99/month',
        category: 'upgrade',
        tone: 'opportunity',
        priority: 'medium',
        action: 'upgrade',
        icon: 'sparkles'
      });
    }

    // Low activity nudge
    if (lastLoginDays > 14) {
      suggestions.push({
        id: 'activity-low',
        title: 'Ping Your Dead Man Switch',
        description: `Reset inactivity timer to keep legacy secure. Last login ${lastLoginDays} days ago.`,
        category: 'maintenance',
        tone: 'reminder',
        priority: 'low',
        action: 'ping',
        icon: 'zap'
      });
    }

    res.json({
      status: 'success',
      suggestions: suggestions.slice(0, 4).map(s => ({
        ...s,
        priorityScore: s.priority === 'critical' ? 3 : s.priority === 'high' ? 2 : s.priority === 'medium' ? 1 : 0
      }))
    });
  } catch (error) {
    console.error('AI Suggestions Error:', error);
    res.status(500).json({ status: 'fail', message: 'Failed to generate smart suggestions' });
  }
};

// Generate voice message using OpenAI TTS
const generateVoiceMessage = async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ status: 'fail', message: 'OpenAI not configured' });
    }

    const { text, voice = 'alloy', emotion = 'warm' } = req.body;

    // Validate voice ID - OpenAI TTS only supports specific voices
    const validVoices = ['alloy', 'ash', 'coral', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    const selectedVoice = validVoices.includes(voice) ? voice : 'alloy';

    if (!text) {
      return res.status(400).json({ status: 'fail', message: 'Text is required' });
    }

    // Add emotion context to the text
    let enhancedText = text;
    if (emotion === 'warm') {
      enhancedText = `Speak with warmth and affection: ${text}`;
    } else if (emotion === 'professional') {
      enhancedText = `Speak professionally and clearly: ${text}`;
    } else if (emotion === 'playful') {
      enhancedText = `Speak with a playful, cheerful tone: ${text}`;
    }

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: selectedVoice,
      input: enhancedText,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Save to uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads', 'voices');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `voice_${req.user._id}_${Date.now()}.mp3`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);

    const audioUrl = `/uploads/voices/${filename}`;

    res.json({
      status: 'success',
      data: {
        audioUrl,
        voice,
        emotion,
        duration: Math.ceil(text.length / 15)
      }
    });
  } catch (error) {
    console.error('Voice Generation Error:', error);
    res.status(500).json({ status: 'fail', message: 'Failed to generate voice message' });
  }
};

// Generate memoir chapter
const generateMemoir = async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ status: 'fail', message: 'OpenAI not configured' });
    }

    const { stage, prompts, existingChapters } = req.body;

    if (!stage || !prompts) {
      return res.status(400).json({ status: 'fail', message: 'Stage and prompts are required' });
    }

    const systemPrompt = `You are helping someone write their memoir. Based on their responses, create a compelling, well-written chapter that captures their life experiences. Write in first person, warm and reflective tone. Keep it between 500-800 words.`;

    const userPrompt = `Life Stage: ${stage}\n\nUser Responses:\n${prompts.join('\n')}\n\nPrevious Chapters: ${existingChapters?.length || 0}\n\nWrite a memoir chapter for this life stage.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Changed from gpt-4 to gpt-4o-mini (more available & cheaper)
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const chapterText = completion.choices[0].message.content;

    res.json({
      status: 'success',
      data: {
        chapter: chapterText,
        wordCount: chapterText.split(' ').length,
        stage: stage,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Memoir Generation Error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ status: 'fail', message: 'Failed to generate memoir chapter', error: error.message });
  }
};

// Get legacy score data for gamification
const getLegacyScoreData = async (req, res) => {
  try {
    const { user } = req;
    const userId = user._id;

    // Fetch user stats for scoring
    const Asset = require('../models/Asset');
    const Beneficiary = require('../models/Beneficiary');
    const Capsule = require('../models/Capsule');

    const [assetCount, beneficiaryCount, capsuleCount] = await Promise.all([
      Asset.countDocuments({ userId }),
      Beneficiary.countDocuments({ userId }),
      Capsule.countDocuments({ userId })
    ]);

    // Calculate legacy score
    let score = 0;
    let level = 1;
    let nextLevelScore = 100;

    // Base points
    score += assetCount * 10; // 10 points per asset
    score += beneficiaryCount * 25; // 25 points per beneficiary
    score += capsuleCount * 50; // 50 points per capsule

    // Bonus points
    if (beneficiaryCount >= 1) score += 50; // First beneficiary bonus
    if (assetCount >= 5) score += 100; // Asset collection bonus
    if (capsuleCount >= 3) score += 150; // Time capsule bonus

    // Calculate level
    while (score >= nextLevelScore) {
      level++;
      nextLevelScore = level * 100;
    }

    const progressToNextLevel = ((score - ((level - 1) * 100)) / 100) * 100;

    res.json({
      status: 'success',
      data: {
        score,
        level,
        progressToNextLevel,
        nextLevelScore,
        stats: {
          assets: assetCount,
          beneficiaries: beneficiaryCount,
          capsules: capsuleCount
        },
        achievements: [
          { id: 'first_asset', name: 'First Asset', unlocked: assetCount >= 1 },
          { id: 'guardian', name: 'Guardian', unlocked: beneficiaryCount >= 1 },
          { id: 'time_traveler', name: 'Time Traveler', unlocked: capsuleCount >= 1 },
          { id: 'collector', name: 'Collector', unlocked: assetCount >= 5 },
          { id: 'legacy_builder', name: 'Legacy Builder', unlocked: score >= 500 }
        ]
      }
    });
  } catch (error) {
    console.error('Legacy Score Error:', error);
    res.status(500).json({ status: 'fail', message: 'Failed to calculate legacy score' });
  }
};

const handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id || req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Message is required'
      });
    }

    // Get user's data to give personalized responses
    const [assets, beneficiaries, capsules, user] = await Promise.all([
      Asset.countDocuments({ owner: userId }),
      Beneficiary.countDocuments({ userId }),
      Capsule.countDocuments({
        user: userId, status: 'active'
      }),
      User.findById(userId).select('name email')
    ]);

    const userContext = {
      name: user?.name || 'there',
      vaultItems: assets,
      beneficiaries,
      activeTriggers: capsules
    };

    // Smart response system based on keywords
    const msg = message.toLowerCase().trim();
    let response = '';

    // Vault questions
    if (msg.includes('vault') ||
        msg.includes('password') ||
        msg.includes('store') ||
        msg.includes('add item')) {
      response = `Your vault currently has ${userContext.vaultItems} encrypted item${userContext.vaultItems !== 1 ? 's' : ''}.

To add a new item, go to the Vault section and click "Add Entry". You can store passwords, documents, financial information, medical records, and personal notes. Everything is encrypted with AES-256 before being stored — we cannot read your data.`;
    }

    // Beneficiary questions
    else if (msg.includes('beneficiar') ||
             msg.includes('who') ||
             msg.includes('family') ||
             msg.includes('receive') ||
             msg.includes('heir')) {
      if (userContext.beneficiaries === 0) {
        response = `You have not added any beneficiaries yet.

Beneficiaries are the people who will receive access to your designated vault items when your trigger activates.

Go to the Beneficiaries section to add your first person. You will need their name, email address, and a security question only they can answer.`;
      } else {
        response = `You have ${userContext.beneficiaries} beneficiar${userContext.beneficiaries !== 1 ? 'ies' : 'y'} set up.

Each beneficiary receives access only to the specific vault items you assign to them. They verify their identity with a security question before viewing anything.`;
      }
    }

    // Trigger questions
    else if (msg.includes('trigger') ||
             msg.includes('inactivit') ||
             msg.includes('when') ||
             msg.includes('activat') ||
             msg.includes('happen')) {
      if (userContext.activeTriggers === 0) {
        response = `You have no active triggers set up yet.

A trigger determines WHEN your legacy gets delivered. The most common is an inactivity trigger — if you do not log in for a set number of days (like 90 days), the system automatically notifies your beneficiaries.

Go to Time Capsules to set up your first trigger.`;
      } else {
        response = `You have ${userContext.activeTriggers} active trigger${userContext.activeTriggers !== 1 ? 's' : ''} set up.

Your triggers are actively monitoring your account. Remember to check in regularly from your dashboard to reset the inactivity timer.`;
      }
    }

    // Security questions
    else if (msg.includes('secure') ||
             msg.includes('encrypt') ||
             msg.includes('safe') ||
             msg.includes('hack') ||
             msg.includes('privacy')) {
      response = `LastKey uses AES-256-GCM encryption — the same standard used by banks and governments.

Your data is encrypted BEFORE it leaves your device. We store only ciphertext on our servers. Even we cannot read your vault contents.

Additional security features:
• Account locks after 5 failed login attempts
• Every access is logged with timestamp and IP
• Beneficiaries must answer a security question before viewing anything
• Portal access links expire after 30 days`;
    }

    // Check-in questions
    else if (msg.includes('check in') ||
             msg.includes('checkin') ||
             msg.includes('timer') ||
             msg.includes('reset')) {
      response = `The check-in button on your dashboard resets your inactivity timer.

When you click "I'm Here", your last active date updates and your beneficiaries will not be notified.

If you have a 90-day inactivity trigger, you should check in at least once every 83 days. We will send you a warning email 7 days before your trigger activates.`;
    }

    // Setup help
    else if (msg.includes('setup') ||
             msg.includes('start') ||
             msg.includes('begin') ||
             msg.includes('how do i') ||
             msg.includes('help')) {
      response = `Here is how to set up your digital legacy in 4 steps:

1. 🔒 Add Vault Items — Store your important passwords, documents, and information in the Vault section.

2. 👥 Add Beneficiaries — Go to Beneficiaries and add the people who should receive your legacy. Set a security question for each person.

3. ⚡ Set a Trigger — Go to Time Capsules and create an inactivity trigger. 90 days is a common choice.

4. ✉️ Write a Final Message — Leave a personal message for your loved ones in the Final Message section.

Your legacy score is currently based on completing these steps.`;
    }

    // Greeting
    else if (msg.includes('hello') ||
             msg.includes('hi') ||
             msg.includes('hey') ||
             msg.includes('good')) {
      response = `Hello ${userContext.name}! 👋

I am your LastKey AI assistant. I can help you with:
• Setting up your digital legacy
• Understanding how triggers and beneficiaries work
• Explaining security features
• Improving your legacy completeness score

What would you like to know?`;
    }

    // Score questions
    else if (msg.includes('score') ||
             msg.includes('complet') ||
             msg.includes('progress') ||
             msg.includes('status')) {
      const score =
        (userContext.vaultItems > 0 ? 20 : 0) +
        (userContext.beneficiaries > 0 ? 20 : 0) +
        (userContext.activeTriggers > 0 ? 20 : 0) +
        20 + // email verified assumed
        0    // documents

      response = `Your legacy completeness score helps you understand how protected your family is.

Current status:
${userContext.vaultItems > 0 ? '✅' : '❌'} Vault items: ${userContext.vaultItems}
${userContext.beneficiaries > 0 ? '✅' : '❌'} Beneficiaries: ${userContext.beneficiaries}
${userContext.activeTriggers > 0 ? '✅' : '❌'} Active triggers: ${userContext.activeTriggers}

${score < 60
  ? 'Your legacy needs attention. Start by adding vault items and beneficiaries.'
  : score < 80
  ? 'Good progress! Set up a trigger to automate your legacy delivery.'
  : 'Your legacy is well protected!'
}`;
    }

    // Default response
    else {
      response = `I understand you are asking about "${message}".

As your digital legacy assistant, I can help you with:
• **Vault** — storing and organizing your important items
• **Beneficiaries** — who receives your legacy
• **Triggers** — when your legacy gets delivered
• **Security** — how your data is protected
• **Setup** — getting started with LastKey

Try asking me something like:
• "How do I add a beneficiary?"
• "How secure is my data?"
• "What happens when my trigger activates?"
• "Help me set up my legacy"`;
    }

    return res.status(200).json({
      status: 'success',
      data: {
        message: response,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI chat error:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'AI assistant is temporarily unavailable'
    });
  }
};

module.exports = {
  generateLegacyMessage,
  getAISuggestions,
  getLegacyScoreData,
  generateVoiceMessage,
  generateMemoir,
  handleChat
};

