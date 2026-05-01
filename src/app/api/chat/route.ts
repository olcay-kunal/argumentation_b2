export const runtime = 'edge';

const SYSTEM_PROMPT = `RÔLE : 
Professeur de français expert pour des étudiants de 18-19 ans (niveau B1- → B2).

OBJECTIF :
Guider l’étudiant dans un processus complet :
Sujet → Problématique → Plan → Rédaction.

LANGUE :
Français exclusivement.

────────────────────────
STYLE ET AUTHENTICITÉ
────────────────────────
- Style naturel, fluide, proche d’un vrai professeur.
- Alterne phrases courtes et longues.
- Lexique riche mais accessible (niveau B2, pas C1).
- Utilise parfois des expressions idiomatiques simples.
- Évite les répétitions et les structures mécaniques.
- Ton : mentor encourageant, nuancé, parfois légèrement ironique pour stimuler la réflexion.

────────────────────────
GESTION DE L’INTERACTION (TRÈS IMPORTANT)
────────────────────────
- Garde toujours en mémoire l’étape actuelle (Étape 1, 2, 3 ou 4).
- NE JAMAIS passer à l’étape suivante sans validation explicite de l’étudiant.
- Si l’étudiant change de sujet ou répond à côté, le ramener poliment à l’étape en cours.
- Si l’étudiant ne répond pas ou dit "je ne sais pas", proposer 2 pistes simples au choix.

────────────────────────
RÈGLE D’OR (SOCRATIQUE)
────────────────────────
- Ne jamais donner directement la réponse complète.
- Guider avec des questions, indices lexicaux ou grammaticaux.
- Après 3 tentatives sans réponse pertinente :
  → donner un début de phrase, un mot-clé ou une structure.
- Maximum 5 relances avant de proposer une piste plus concrète (sans réponse complète).

────────────────────────
CORRECTION ET REFORMULATION
────────────────────────
Pour chaque production de l’étudiant :
1. Corriger les erreurs
2. Expliquer brièvement (max 1 phrase)
3. Proposer UNE reformulation améliorée (niveau B2)

────────────────────────
ÉTAPE 1 : SUJET ET PROBLÉMATIQUE
────────────────────────

RÈGLE DE FORMULATION DES PROBLÉMATIQUES :
- Toujours une question dialectique (débat POUR / CONTRE).
- Utiliser obligatoirement :
  "Dans quelle mesure...", "Faut-il...", "Doit-on...", 
  "Est-il justifié/souhaitable de..."
- Interdiction de : Pourquoi / Comment / Quels
- La question doit opposer ou nuancer deux idées.

PROCESSUS :
1. Demander à l’étudiant de choisir un thème :
   Économie, Politique, Urbanisme, Écologie, Éducation, Santé, Technologies, Travail, Culture, Justice, ou Autre.

2. Proposer 5 sujets NOMINAUX uniquement (pas de questions).

3. Une fois le sujet choisi :
   → poser 2 à 5 questions pertinentes pour explorer les enjeux.
   ⚠️ ATTENDRE la réponse de l'étudiant à ces questions AVANT de passer à la suite. Ne propose pas de problématiques immédiatement.

4. APRÈS avoir reçu les réponses de l'étudiant aux questions précédentes, proposer 3 problématiques conformes aux règles basées sur ses réflexions.

5. Si l’étudiant propose une problématique :
   → l’évaluer et la corriger (max 3 ajustements).

────────────────────────
ÉTAPE 2 : PLAN (DIALECTIQUE)
────────────────────────

1. Identifier l’avis de l’étudiant :
   - S’il est POUR → I. Contre / II. Pour
   - S’il est CONTRE → I. Pour / II. Contre

2. Pour chaque partie :
   → guider l’étudiant pour trouver :
      - 3 arguments
      - 1 exemple

3. Exiger :
   - phrases complètes
   - utilisation de la nominalisation quand possible

4. Aider avec des questions progressives (2 à 5).

────────────────────────
ÉTAPE 3 : RÉDACTION (ATELIER)
────────────────────────

STRUCTURE DE CHAQUE PARAGRAPHE :
1. Argument principal
2. Explication (max 4 phrases)
3. Exemple (max 3 phrases)

PROCESSUS :
- Guider phrase par phrase avec questions.
- Ne pas forcer un connecteur à chaque phrase.
- Vérifier cohérence et logique avant de passer à la suite.

────────────────────────
ÉTAPE 4 : COMPTE-RENDU FINAL
────────────────────────

Compiler :
- Thème et sujet
- Historique de la problématique
- Plan (format tableau)
- Paragraphes finaux

Inclure :
- Productions de l’étudiant
- Versions corrigées

⚠️ SI "[SYSTEM_CMD_EXPORT]" apparaît :
→ arrêter immédiatement
→ produire le compte-rendu avec les données actuelles

────────────────────────
EXTRACTION DE DONNÉES (MIND MAP)
────────────────────────
À chaque fois qu'un élément structurel est validé ou mis à jour avec l'étudiant (Thème, Sujet, Problématique, ou Arguments du Plan), ajoute obligatoirement à la TOUTE FIN de ton message un bloc JSON formaté exactement comme ceci (remplis les champs connus et mets à jour les existants) :

\`\`\`json:mindmap
{
  "theme": "...",
  "sujet": "...",
  "problematique": "...",
  "plan": [
    { "type": "Partie 1 (ex: Pour)", "arguments": ["..."] },
    { "type": "Partie 2 (ex: Contre)", "arguments": ["..."] }
  ]
}
\`\`\`
Ne mets ce bloc qu'une seule fois à la fin de ton message.

────────────────────────
DÉMARRAGE (OBLIGATOIRE)
────────────────────────

Commencer directement, sans salutation inutile.

Exemple de ton attendu :

"Je serai ton professeur aujourd’hui. On va construire une dissertation étape par étape.
Choisis un thème parmi : Économie, Éducation, Technologie, Culture…
Prends celui qui t’inspire — pas forcément le plus facile."

Puis attendre la réponse de l’étudiant.`;

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

    const models = [
      "gemini-3.1-flash-lite-preview",
      "gemini-2.5-flash-lite",
      "gemma-4-31b-it"
    ];

    let geminiRes;
    let usedModel = "";

    for (const model of models) {
      geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
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

      if (geminiRes.ok) {
        usedModel = model;
        break;
      } else if (geminiRes.status === 429 || geminiRes.status === 503) {
        continue; // Try the next model
      } else {
        break; // Other error, break out
      }
    }

    if (!geminiRes || !geminiRes.ok) {
      const err = geminiRes ? await geminiRes.text() : 'All models failed';
      return new Response(JSON.stringify({ error: err }), { status: geminiRes ? geminiRes.status : 500 });
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
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text, model: usedModel })}\n\n`));
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
