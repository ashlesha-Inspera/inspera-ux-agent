export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { selectedArchetype, textContent } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing in Vercel settings.' });
    }

    const archetypeProfiles = {
      Planner: `
- Goal: Streamline assessment design across diverse instructional needs and reduce logistics friction.
- Mindset: Navigates incomplete inputs, coordinates stakeholders, and manages digital/analog tools[cite: 1].
- Review Focus: Ensure workflows are self-serve, clear, and facilitate smooth communication and setup[cite: 1].`,
      
      Author: `
- Goal: Compose clear, effective questions aligned with learning objectives[cite: 1].
- Mindset: May face tech adoption barriers; fears content leakage and repetitive manual question creation[cite: 1].
- Review Focus: Clear question-type instructions, guidance for bulk creation, and straightforward content management copy[cite: 1].`,
      
      Candidate: `
- Goal: Complete assessment in time without obstacles or delays[cite: 1].
- Mindset: High anxiety/stress state; fears technical glitches, ambiguous instructions, and safe browser issues[cite: 1].
- Review Focus: Absolute clarity, zero ambiguity, highly reassuring tone, and transparent status updates[cite: 1].`,
      
      Grader: `
- Goal: Evaluate and grade efficiently while maintaining consistent standards[cite: 1].
- Mindset: Attentive early on, enters 'auto-pilot' in large cohorts; finds digital annotation harder than paper[cite: 1].
- Review Focus: Extremely scannable microcopy, clear rubric terminology, and efficient feedback options[cite: 1].`,
      
      Proctor: `
- Goal: Maintain security/integrity and resolve live exam issues with minimal candidate disruption[cite: 1].
- Mindset: High stakes, needs quick decision-making; prone to ignoring flags due to false positive fatigue[cite: 1].
- Review Focus: Action-first verbs (e.g., 'Extend Time', 'Pause Exam'), clear anomaly context, direct alert microcopy[cite: 1].`,
      
      Admin: `
- Goal: Scalable user management, GDPR compliance, and operational consistency[cite: 1].
- Mindset: High-level organizational overview, balancing security with administrative ease[cite: 1].
- Review Focus: Explicit role/permissions terminology, unambiguous security notices, and straightforward administration labels[cite: 1].`
    };

    const targetContext = archetypeProfiles[selectedArchetype] || archetypeProfiles.Candidate;

    const prompt = `You are Inspera's Senior UX Copywriter AI.
Review the following UI text specifically for the Inspera User Archetype: "${selectedArchetype}".

ARCHETYPE CONTEXT & EVALUATION RULES:
${targetContext}

TEXT TO REVIEW:
"${textContent}"

INSTRUCTIONS:
1. State briefly whether this text suits the ${selectedArchetype}'s mindset and needs[cite: 1].
2. Identify any potential issues (e.g., ambiguity, stress triggers, unhelpful jargon).
3. Provide 1 to 2 improved copy suggestions tailored specifically to this Inspera persona.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'Error response from Gemini API.' });
    }

    if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
      return res.status(500).json({ error: 'Unexpected response format from Gemini API.' });
    }

    const resultText = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ feedback: resultText });
  } catch (error) {
    return res.status(500).json({ error: `Server Error: ${error.message}` });
  }
}
