export default async function handler(req, res) {
  // Allow Figma to make requests to this backend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { selectedArchetype, textContent } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `
You are Inspera's Senior UX Copywriter.
Review this text for the Inspera User Archetype: "${selectedArchetype}".

Inspera Archetype Rules:
- Candidate: Clear, low anxiety, reassuring, direct.
- Proctor: Urgent, action-first verbs, clear anomaly context.
- Grader: Concise, clear rubric terminology, efficient.
- Author: Simple question-creation prompts, clear templates.
- Planner: Clear logistics, self-serve onboarding wording.
- Admin: Unambiguous permissions, clear compliance wording.

Text to review: "${textContent}"

Output short, actionable suggestions explaining if this text works for the archetype and provide 1-2 improved alternatives.
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ feedback: resultText });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process request.' });
  }
}
