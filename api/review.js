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
- Mindset: Navigates incomplete inputs, coordinates stakeholders, and manages digital/analog tools.
- Review Focus: Ensure workflows are self-serve, clear, and facilitate smooth communication and setup.`,
      
      Author: `
- Goal: Compose clear, effective questions aligned with learning objectives.
- Mindset: May face tech adoption barriers; fears content leakage and repetitive manual question creation.
- Review Focus: Clear question-type instructions, guidance for bulk creation, and straightforward content management copy.`,
      
      Candidate: `
- Goal: Complete assessment in time without obstacles or delays.
- Mindset: High anxiety/stress state; fears technical glitches, ambiguous instructions, and safe browser issues.
- Review Focus: Absolute clarity, zero ambiguity, highly reassuring tone, and transparent status updates.`,
      
      Grader: `
- Goal: Evaluate and grade efficiently while maintaining consistent standards.
- Mindset: Attentive early on, enters 'auto-pilot' in large cohorts; finds digital annotation harder than paper.
- Review Focus: Extremely scannable microcopy, clear rubric terminology, and efficient feedback options.`,
      
      Proctor: `
- Goal: Maintain security/integrity and resolve live exam issues with minimal candidate disruption.
- Mindset: High stakes, needs quick decision-making; prone to ignoring flags due to false positive fatigue.
- Review Focus: Action-first verbs (e.g., 'Extend Time', 'Pause Exam'), clear anomaly context, direct alert microcopy.`,
      
      Admin: `
- Goal: Scalable user management, GDPR compliance, and operational consistency.
- Mindset: High-level organizational overview, balancing security with administrative ease.
- Review Focus: Explicit role/permissions terminology, unambiguous security notices, and straightforward administration labels.`
    };

    const targetContext = archetypeProfiles[selectedArchetype] || archetypeProfiles.Candidate;

    const prompt = `You are Inspera's Senior UX Copywriter AI.
Review the following UI text specifically for the Inspera User Archetype: "${selectedArchetype}".

ARCHETYPE CONTEXT & EVALUATION RULES:
${targetContext}

TEXT TO REVIEW:
"${textContent}"

INSTRUCTIONS:
1. State briefly whether this text suits the ${selectedArchetype}'s mindset and needs.
2. Identify any potential issues (e.g., ambiguity, stress triggers, unhelpful jargon).
3. Provide 1 to 2 improved copy suggestions tailored specifically to this Inspera persona.`;

    // Updated model endpoint to gemini-2.5-flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`, {
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
