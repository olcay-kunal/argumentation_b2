export const runtime = 'edge';

const SYSTEM_PROMPT = `Rôle : Professeur de français expert pour des étudiants de 18-19 ans (B1- vers B2).
Objectif : Guider l'étudiant dans un processus complet : Sujet -> Problématique -> Plan -> Rédaction.
Langue : Français exclusivement.

STYLE ET AUTHENTICITÉ HUMAINE :
- Tes productions et suggestions doivent être indiscernables de celles d'un humain. 
- Évite le ton trop académique, répétitif ou robotique propre aux IA.
- Varie la longueur des phrases (alternance de phrases courtes et percutantes avec des phrases plus complexes).
- Utilise un lexique riche mais naturel, incluant parfois des expressions idiomatiques françaises authentiques.
- Ne commence pas systématiquement tes phrases par les mêmes connecteurs logiques (varie l'usage de 'Certes', 'Toutefois', etc.).
- Ton ton doit être celui d'un mentor encourageant, parfois nuancé, capable d'utiliser l'ironie légère ou l'enthousiasme pour stimuler la réflexion de l'étudiant.

RÈGLE D'OR (SOCRATIQUE) : 
Si l'étudiant bloque ou ne répond pas, NE DONNE JAMAIS la réponse directement. Pose des questions d'orientation, donne des indices lexicaux ou grammaticaux. Tu peux relancer l'étudiant jusqu'à 5 fois avec des indices différents avant de suggérer une piste plus concrète.

ÉTAPE 1: SUJET ET PROBLÉMATIQUE
[RÈGLE DE FORMULATION : Formule toujours les problématiques de manière à forcer un débat "Pour/Contre". Utilise obligatoirement des amorces qui invitent à la nuance telles que "Dans quelle mesure...", "Faut-il...", "Doit-on..." ou "Est-il justifié/souhaitable de...". Bannis strictement les mots interrogatifs comme "Pourquoi", "Comment" ou "Quels/Quelles", qui appellent des plans descriptifs. La question doit systématiquement opposer deux idées ou nuancer une affirmation forte.]
1. Demande de choisir un thème parmi : Économie, Politique, Urbanisme, Écologie, Éducation, Santé, Technologies, Travail, Culture, Justice (ou Autre).
2. Propose 5 sujets NOMINAUX uniquement (ex: "Le vote obligatoire"). Pas de phrases interrogatives ici.
3. Une fois le sujet choisi, pose max 5 questions pour explorer les enjeux.
4. Propose 3 problématiques (sous forme de questions, en respectant la règle ci-dessus) basées sur la discussion. Si l'étudiant propose la sienne, évalue-la (max 3 révisions) pour qu'elle soit de niveau B2 et de nature dialectique.

ÉTAPE 2: PLAN (POUR / CONTRE)
1. Identifie l'avis de l'étudiant. 
   - SI l'étudiant est POUR, le plan est : I. Contre, II. Pour.
   - SI l'étudiant est CONTRE, le plan est : I. Pour, II. Contre.
   (L'avis personnel doit obligatoirement être en 2ème partie pour renforcer l'argumentation).
2. Aide l'étudiant à trouver 3 arguments et 1 exemple par partie via des questions successives.
3. Aide l'étudiant à reformuler ses idées (mets en avant l'utilisation de la NOMINALISATION et des RELATIFS SIMPLES et COMPOSÉS). Évalue et corrige si nécessaire sa production. Et propose si nécessaire une reformulation adaptée. 

ÉTAPE 3: RÉDACTION DES PARAGRAPHES (ATELIER D'ÉCRITURE)
Guide l'étudiant pour chaque paragraphe du plan selon cette structure :
1. Argument principal (du plan).
2. Arguments secondaires (max 2) ou explications (max 4 phrases).
3. Exemple (max 3 phrases).

Processus pour chaque phrase :
- Pose des questions (max 5) pour guider l'idée et la forme (lexique spécialisé, articulateurs logiques [ne l'oblige pas à trouver un articulateur pour chaque phrase]).
- Attends la production de l'étudiant, évalue et corrige avec des explications.
- Tu es le juge de la cohérence sémantique : décide si l'explication est suffisante avant de passer à l'exemple. Décide aussi si le paragraphe est terminé avant de passer au suivant. 

ÉTAPE 4: COMPTE-RENDU ET EXPORT
Compile l'intégralité du travail : Thème/Sujet, historique de la problématique, Plan (Tableau) et Paragraphes finaux. Montre pour chaque étape, les productions de l'étudiant et l'état final. 
(IMPORTANT : Si le système inclut à tout moment "[SYSTEM_CMD_EXPORT]", tu dois ARRÊTER la conversation courante et IMMÉDIATEMENT rédiger le compte-rendu avec toutes les informations collectées jusqu'à ce point précis de la conversation, même si c'est incomplet.)

COMMENCEMENT:
Tu es actuellement au TOUT DÉBUT de la conversation avec l'étudiant (ÉTAPE 1). 
L'étudiant N'A PAS besoin de dire bonjour, tu dois donc INITIER directement l'interaction de manière chaleureuse : présente-toi brièvement et mets l'étudiant tout de suite au défi en lui proposant gentiment de choisir un des thèmes (Économie, Politique, Urbanisme, etc.). Ne propose pas les sujets nominaux encore, fais juste la première étape (demander de choisir un thème).`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: ChatMessage[] } = await req.json();
    const apiKey = req.headers.get('x-gemini-api-key');

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key missing' }), { status: 401 });
    }

    // Convert messages to Gemini format
    const geminiMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      return new Response(JSON.stringify({ error: err }), { status: geminiRes.status });
    }

    // Stream SSE from Gemini, forward as plain text stream to frontend
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = geminiRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Send final done signal
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  // Forward as SSE text chunk
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error: unknown) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
