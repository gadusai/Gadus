import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  CreateGadusConversationBody,
  CreateGadusMessageBody,
  CreateGadusMessageResponse,
  CreateGadusConversationResponse,
  GetGadusSummaryResponse,
  ListGadusConversationsResponse,
  ListGadusMessagesParams,
  ListGadusMessagesResponse,
  ListGadusModesResponse,
  ListGadusPromptsResponse,
  ListGadusStudioAssetsQueryParams,
  ListGadusStudioAssetsResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import {
  gadusConversations,
  gadusMessages,
  gadusStudioAssets,
} from "@workspace/db/schema";
import {
  GROQ_MODEL,
  groq,
  modeSystemPrompts,
} from "../lib/groq";

const router: IRouter = Router();

const modes = [
  ["general", "General Assistant", "Warm, knowledgeable help for anything.", "sparkles", "#82f6c0"],
  ["research", "Deep Research", "Structured answers with sources and nuance.", "microscope", "#80b9ff"],
  ["creative", "Creative Writing", "Vivid stories, scripts, and unexpected ideas.", "pen-line", "#d69bff"],
  ["content", "Content Creation", "Hooks, calendars, and content that travels.", "megaphone", "#e8bb78"],
  ["sales", "Outreach and Sales", "Human, personalized messages that convert.", "send", "#f0a1bd"],
  ["image-prompts", "Image Prompt Generator", "Production-ready prompts for any visual.", "wand-sparkles", "#75d7e8"],
  ["social", "Social Media Manager", "Platform-native posts for every channel.", "share-2", "#f4a9d6"],
  ["strategy", "Business Strategy", "Clear frameworks for decisive next steps.", "chart-no-axes-combined", "#f0c56d"],
  ["code", "Code Assistant", "Build, debug, and ship with confidence.", "code-2", "#72e3a9"],
  ["data", "Data Analyst", "Find the signal inside your data.", "bar-chart-3", "#8fc8ff"],
  ["productivity", "Personal Productivity", "Routines and systems that make space.", "sun", "#b9e987"],
  ["legal-finance", "Legal and Finance", "Plain-English clarity for complex decisions.", "scale", "#b3bdc8"],
] as const;

const prompts = [
  ["Build a sharp go-to-market plan", "Strategy", "Build a go-to-market plan for a new product with milestones, risks, and first experiments.", "STRATEGY"],
  ["Turn notes into a clear brief", "Content", "Turn these rough notes into a crisp one-page brief with a compelling narrative.", "WRITING"],
  ["Research a complex topic", "Research", "Research this topic deeply, compare viewpoints, and give me a sourced executive summary.", "RESEARCH"],
  ["Debug a stubborn issue", "Code", "Help me debug this issue. Ask only the questions you need, then propose a robust fix.", "CODE"],
  ["Plan a focused week", "Productivity", "Design a realistic weekly plan around my priorities, energy, and constraints.", "FOCUS"],
  ["Write an outreach sequence", "Sales", "Write a thoughtful 4-touch outreach sequence for this audience and offer.", "OUTREACH"],
  ["Create a content calendar", "Content", "Create a 30-day content calendar with hooks, formats, CTAs, and publishing notes.", "CONTENT"],
  ["Explain this like I am smart", "General", "Explain this clearly with a useful analogy, then show me the practical implications.", "CLARITY"],
  ["Analyze a business decision", "Strategy", "Pressure-test this decision with assumptions, tradeoffs, and a recommendation.", "DECISION"],
  ["Shape a visual concept", "Creative", "Turn this rough visual idea into three distinct creative directions with detailed prompts.", "VISUAL"],
  ["Review a contract clause", "Legal", "Explain this clause in plain English and flag questions I should ask a professional.", "REVIEW"],
  ["Find the signal in my data", "Data", "Analyze this dataset for patterns, anomalies, and decisions it should inform.", "INSIGHT"],
].map(([title, category, prompt, tag], index) => ({ id: index + 1, title, category, prompt, tag }));

const modeName = (modeId: string) =>
  modes.find(([id]) => id === modeId)?.[1] ?? "General Assistant";

const modeIds = new Set(modes.map(([id]) => id));

router.get("/gadus/modes", (_req, res) => {
  const data = modes.map(([id, name, description, icon, accent]) => ({
    id,
    name,
    description,
    icon,
    accent,
  }));
  res.json(ListGadusModesResponse.parse(data));
});

router.get("/gadus/summary", async (_req, res) => {
  const [conversations, messages, assets] = await Promise.all([
    db.select().from(gadusConversations),
    db.select().from(gadusMessages),
    db.select().from(gadusStudioAssets),
  ]);
  const data = {
    userName: "Alex",
    conversations: conversations.length,
    messages: messages.length,
    images: assets.filter((asset) => asset.kind === "image").length,
    videos: assets.filter((asset) => asset.kind === "video").length,
    files: 8,
    mostUsedMode: conversations[0]?.modeName ?? "General Assistant",
    tip: "Ask Gadus to challenge your assumptions before it gives you a recommendation.",
    goals: [
      { label: "Ship the launch plan", progress: 72, target: 100 },
      { label: "Write with more clarity", progress: 48, target: 100 },
    ],
  };
  res.json(GetGadusSummaryResponse.parse(data));
});

router.get("/gadus/conversations", async (_req, res) => {
  const [rows, messages] = await Promise.all([
    db
    .select()
    .from(gadusConversations)
    .orderBy(desc(gadusConversations.updatedAt)),
    db.select().from(gadusMessages),
  ]);
  const data = rows.map((row) => ({
    ...row,
    messageCount: messages.filter((message) => message.conversationId === row.id).length,
  }));
  res.json(ListGadusConversationsResponse.parse(data));
});

router.post("/gadus/conversations", async (req, res) => {
  const input = CreateGadusConversationBody.parse(req.body);
  const [conversation] = await db
    .insert(gadusConversations)
    .values({
      title: input.title,
      modeId: input.modeId,
      modeName: modeName(input.modeId),
    })
    .returning();
  res.status(201).json(CreateGadusConversationResponse.parse({ ...conversation, messageCount: 0 }));
});

router.get("/gadus/conversations/:conversationId/messages", async (req, res) => {
  const { conversationId } = ListGadusMessagesParams.parse(req.params);
  const rows = await db
    .select()
    .from(gadusMessages)
    .where(eq(gadusMessages.conversationId, conversationId))
    .orderBy(gadusMessages.createdAt);
  res.json(ListGadusMessagesResponse.parse(rows));
});

router.delete("/gadus/conversations/:conversationId/messages", async (req, res) => {
  const { conversationId } = ListGadusMessagesParams.parse(req.params);
  await db.delete(gadusMessages).where(eq(gadusMessages.conversationId, conversationId));
  await db
    .update(gadusConversations)
    .set({ preview: "", updatedAt: new Date() })
    .where(eq(gadusConversations.id, conversationId));
  res.status(204).end();
});

router.post("/gadus/conversations/:conversationId/messages", async (req, res) => {
  const { conversationId } = ListGadusMessagesParams.parse(req.params);
  const input = CreateGadusMessageBody.parse(req.body);
  const [message] = await db
    .insert(gadusMessages)
    .values({ conversationId, role: input.role, content: input.content })
    .returning();
  await db
    .update(gadusConversations)
    .set({ preview: input.content, updatedAt: new Date() })
    .where(eq(gadusConversations.id, conversationId));
  res.status(201).json(CreateGadusMessageResponse.parse(message));
});

router.patch("/gadus/conversations/:conversationId", async (req, res) => {
  const { conversationId } = ListGadusMessagesParams.parse(req.params);
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : undefined;
  const starred = typeof req.body?.starred === "boolean" ? req.body.starred : undefined;
  if (!title && starred === undefined) {
    res.status(400).json({ message: "A title or starred value is required." });
    return;
  }
  const [conversation] = await db
    .update(gadusConversations)
    .set({
      ...(title ? { title } : {}),
      ...(starred === undefined ? {} : { starred }),
      updatedAt: new Date(),
    })
    .where(eq(gadusConversations.id, conversationId))
    .returning();
  if (!conversation) {
    res.status(404).json({ message: "Conversation not found." });
    return;
  }
  res.json(conversation);
});

router.delete("/gadus/conversations/:conversationId", async (req, res) => {
  const { conversationId } = ListGadusMessagesParams.parse(req.params);
  const [conversation] = await db
    .delete(gadusConversations)
    .where(eq(gadusConversations.id, conversationId))
    .returning({ id: gadusConversations.id });
  if (!conversation) {
    res.status(404).json({ message: "Conversation not found." });
    return;
  }
  res.status(204).end();
});

router.post("/gadus/search", async (req, res) => {
  const query = typeof req.body?.query === "string" ? req.body.query.trim() : "";
  if (!query) {
    res.status(400).json({ message: "A search query is required." });
    return;
  }
  const encoded = encodeURIComponent(query);
  const sources: Array<{ title: string; url: string; snippet: string }> = [];
  if (/\b(weather|forecast|temperature)\b/i.test(query)) {
    const locationMatch = query.match(/\b(?:in|for|at)\s+(.+)$/i);
    const location = locationMatch?.[1]?.replace(/[?.!,]+$/, "").trim() || query;
    try {
      const geocodeResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`,
        { signal: AbortSignal.timeout(8000) },
      );
      const geocode = (await geocodeResponse.json()) as { results?: Array<{ name?: string; latitude?: number; longitude?: number; timezone?: string }> };
      const place = geocode.results?.[0];
      if (place?.latitude !== undefined && place.longitude !== undefined) {
        const forecastResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`,
          { signal: AbortSignal.timeout(8000) },
        );
        const forecast = (await forecastResponse.json()) as { current?: Record<string, unknown> };
        if (forecast.current) {
          sources.push({
            title: `Open-Meteo weather for ${place.name || location}`,
            url: "https://open-meteo.com/",
            snippet: JSON.stringify(forecast.current),
          });
        }
      }
    } catch {
      // Continue with general search when weather lookup is unavailable.
    }
  }
  try {
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (response.ok) {
      const data = (await response.json()) as {
        AbstractText?: string;
        AbstractURL?: string;
        Heading?: string;
        RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
      };
      if (data.AbstractText && data.AbstractURL) {
        sources.push({
          title: data.Heading || "DuckDuckGo",
          url: data.AbstractURL,
          snippet: data.AbstractText,
        });
      }
      for (const topic of data.RelatedTopics ?? []) {
        if (topic.Text && topic.FirstURL && sources.length < 5) {
          sources.push({ title: "DuckDuckGo result", url: topic.FirstURL, snippet: topic.Text });
        }
      }
    }
  } catch {
    // Search is best effort; the model can still answer from its context.
  }
  if (!sources.length) {
    try {
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
        { signal: AbortSignal.timeout(8000) },
      );
      if (response.ok) {
        const data = (await response.json()) as {
          title?: string;
          extract?: string;
          content_urls?: { desktop?: { page?: string } };
        };
        if (data.extract && data.content_urls?.desktop?.page) {
          sources.push({
            title: data.title || "Wikipedia",
            url: data.content_urls.desktop.page,
            snippet: data.extract,
          });
        }
      }
    } catch {
      // Keep the response shape stable when external sources are unavailable.
    }
  }
  if (!sources.length) {
    sources.push({
      title: "DuckDuckGo search",
      url: `https://duckduckgo.com/?q=${encoded}`,
      snippet: `Live search link for: ${query}`,
    });
  }
  res.json({ query, accessedAt: new Date().toISOString(), sources });
});

const imageStyles: Record<string, string> = {
  photorealistic: "photorealistic, hyperrealistic, DSLR photography, 85mm lens, natural lighting, ultra detailed skin texture, professional photograph",
  cinematic: "cinematic, movie still, anamorphic lens, film grain, dramatic lighting, director of photography, 35mm film",
  anime: "anime style, manga illustration, vibrant colors, clean line art, Japanese animation, detailed background",
  watercolor: "watercolor painting, soft edges, transparent layers, delicate brushstrokes, paper texture, flowing colors",
  "3d-render": "3D render, octane render, ray tracing, physically based rendering, studio lighting",
  cyberpunk: "cyberpunk, neon lights, futuristic city, rain reflections, purple and blue neons",
};

router.post("/gadus/images/generate", async (req, res) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  const style = typeof req.body?.style === "string" ? req.body.style : "";
  if (!prompt) {
    res.status(400).json({ message: "Describe the image you want to create." });
    return;
  }
  const enhancedPrompt = [
    prompt,
    imageStyles[style] ?? "",
    "highly detailed, professional quality, perfect lighting, sharp focus, vivid colors",
    "negative: blurry, distorted, low quality, watermark, deformed, duplicate",
  ].filter(Boolean).join(", ");
  const images = Array.from({ length: 4 }, (_, index) => {
    const seed = Math.floor(Math.random() * 999999) + 1;
    const model = index === 1 ? "flux-realism" : "flux";
    const size = index === 2 ? "512" : "1024";
    return {
      seed,
      url: `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${size}&height=${size}&model=${model}&seed=${seed}&nologo=true&enhance=true`,
    };
  });
  res.json({ originalPrompt: prompt, enhancedPrompt, images });
});

router.post("/gadus/studio/assets", async (req, res) => {
  const kind = req.body?.kind === "video" ? "video" : "image";
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "Gadus creation";
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  const url = typeof req.body?.url === "string" ? req.body.url.trim() : "";
  if (!prompt || !url) {
    res.status(400).json({ message: "Asset prompt and URL are required." });
    return;
  }
  const [asset] = await db.insert(gadusStudioAssets).values({ kind, title, prompt, url }).returning();
  res.status(201).json(asset);
});

router.patch("/gadus/studio/assets/:assetId", async (req, res) => {
  const assetId = Number(req.params.assetId);
  const [asset] = await db
    .update(gadusStudioAssets)
    .set({ favorite: Boolean(req.body?.favorite) })
    .where(eq(gadusStudioAssets.id, assetId))
    .returning();
  if (!asset) {
    res.status(404).json({ message: "Asset not found." });
    return;
  }
  res.json(asset);
});

router.delete("/gadus/studio/assets/:assetId", async (req, res) => {
  const assetId = Number(req.params.assetId);
  const [asset] = await db.delete(gadusStudioAssets).where(eq(gadusStudioAssets.id, assetId)).returning({ id: gadusStudioAssets.id });
  if (!asset) {
    res.status(404).json({ message: "Asset not found." });
    return;
  }
  res.status(204).end();
});

router.post("/gadus/videos/generate", async (req, res) => {
  const token = process.env.REPLICATE_API_TOKEN?.trim();
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  const aspectRatio = typeof req.body?.aspectRatio === "string" ? req.body.aspectRatio : "16:9";
  if (!token) {
    res.status(503).json({ message: "Video generation needs a Replicate connection in Replit Secrets." });
    return;
  }
  if (!prompt) {
    res.status(400).json({ message: "Describe the video you want to create." });
    return;
  }
  try {
    const createResponse = await fetch("https://api.replicate.com/v1/models/minimax/video-01/predictions", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ input: { prompt, aspect_ratio: aspectRatio } }),
    });
    const prediction = (await createResponse.json()) as { id?: string; status?: string; detail?: string };
    if (!createResponse.ok || !prediction.id) {
      res.status(502).json({ message: "Gadus is still setting up the video engine. Please check the Replicate connection." });
      return;
    }
    const deadline = Date.now() + 150000;
    let latest = prediction;
    while (Date.now() < deadline && (latest.status === "starting" || latest.status === "processing")) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      latest = (await pollResponse.json()) as typeof latest & { output?: string | string[] };
    }
    const output = (latest as typeof latest & { output?: string | string[] }).output;
    const url = Array.isArray(output) ? output[0] : output;
    if (latest.status !== "succeeded" || !url) {
      res.status(502).json({ message: "Gadus is still working on your video. Please check progress again in a moment." });
      return;
    }
    res.json({ predictionId: prediction.id, url });
  } catch {
    res.status(502).json({ message: "Gadus is still working on your video. Please check progress again in a moment." });
  }
});

router.post("/gadus/chat/stream", async (req, res) => {
  const conversationId = Number(req.body?.conversationId);
  const modeId = typeof req.body?.modeId === "string" ? req.body.modeId : "general";

  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    res.status(400).json({ message: "A valid conversation is required." });
    return;
  }

  const [conversation, storedMessages] = await Promise.all([
    db.select().from(gadusConversations).where(eq(gadusConversations.id, conversationId)),
    db
      .select()
      .from(gadusMessages)
      .where(eq(gadusMessages.conversationId, conversationId))
      .orderBy(gadusMessages.createdAt),
  ]);

  if (!conversation[0]) {
    res.status(404).json({ message: "Conversation not found." });
    return;
  }

  const selectedMode = modeIds.has(modeId) ? modeId : conversation[0].modeId;
  const systemPrompt = modeSystemPrompts[selectedMode] ?? modeSystemPrompts.general;
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...storedMessages.map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    })),
  ];
  const latestUserMessage = [...storedMessages].reverse().find((message) => message.role === "user")?.content ?? "";
  const shouldBrowse = /\b(today|tonight|current|currently|latest|recent|news|weather|forecast|score|scores|standing|price|stock|crypto|bitcoin|ethereum|this week|this month|this year|202[4-9]|203\d)\b/i.test(latestUserMessage) || /https?:\/\//i.test(latestUserMessage);

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let streamStarted = false;
  let assistantContent = "";
  const requestController = new AbortController();

  const writeEvent = (type: string, payload: Record<string, unknown>) => {
    if (!res.writableEnded && !res.destroyed) {
      res.write(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`);
    }
  };

  const run = async () => {
    try {
      if (shouldBrowse) {
        writeEvent("searching", {});
        try {
          const searchResponse = await fetch(
            `https://api.duckduckgo.com/?q=${encodeURIComponent(latestUserMessage)}&format=json&no_html=1&skip_disambig=1`,
            { signal: requestController.signal },
          );
          if (searchResponse.ok) {
            const searchData = (await searchResponse.json()) as {
              AbstractText?: string;
              AbstractURL?: string;
              Heading?: string;
              RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
            };
            const sources = [
              ...(searchData.AbstractText && searchData.AbstractURL
                ? [{ title: searchData.Heading || "DuckDuckGo", url: searchData.AbstractURL, snippet: searchData.AbstractText }]
                : []),
              ...(searchData.RelatedTopics ?? []).slice(0, 4).flatMap((topic) =>
                topic.Text && topic.FirstURL ? [{ title: "DuckDuckGo result", url: topic.FirstURL, snippet: topic.Text }] : [],
              ),
            ];
            if (sources.length) {
              messages.push({
                role: "system",
                content: `Live web context retrieved at ${new Date().toISOString()}:\n${sources.map((source) => `- ${source.title}: ${source.snippet} (${source.url})`).join("\n")}\nUse this context when relevant and include a brief Sources section with the URLs.`,
              });
              writeEvent("sources", { sources: sources.map(({ title, url }) => ({ title, url })) });
            }
          }
        } catch {
          writeEvent("sources", { sources: [] });
        }
      }
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages,
        max_tokens: 768,
        temperature: 0.7,
        top_p: 1,
        stream: true,
      }, { signal: requestController.signal });

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content ?? "";
        if (!content) continue;
        streamStarted = true;
        assistantContent += content;
        writeEvent("token", { content });
      }

      if (!assistantContent.trim()) {
        throw new Error("The model returned an empty response.");
      }

      await db.insert(gadusMessages).values({
        conversationId,
        role: "assistant",
        content: assistantContent,
      });
      await db
        .update(gadusConversations)
        .set({ preview: assistantContent.slice(0, 180), updatedAt: new Date() })
        .where(eq(gadusConversations.id, conversationId));
      writeEvent("done", {});
      res.end();
    } catch (error) {
      if (requestController.signal.aborted || res.writableEnded || res.destroyed) return;
      if (streamStarted) {
        writeEvent("error", {
          message: "Gadus is having a quick rest, please try your message again.",
        });
        res.end();
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
      try {
        const retry = await groq.chat.completions.create({
          model: GROQ_MODEL,
          messages,
          max_tokens: 768,
          temperature: 0.7,
          top_p: 1,
          stream: true,
        }, { signal: requestController.signal });
        for await (const chunk of retry) {
          const content = chunk.choices[0]?.delta?.content ?? "";
          if (!content) continue;
          assistantContent += content;
          writeEvent("token", { content });
        }
        if (!assistantContent.trim()) throw new Error("The model returned an empty response.");
        await db.insert(gadusMessages).values({
          conversationId,
          role: "assistant",
          content: assistantContent,
        });
        await db
          .update(gadusConversations)
          .set({ preview: assistantContent.slice(0, 180), updatedAt: new Date() })
          .where(eq(gadusConversations.id, conversationId));
        writeEvent("done", {});
        res.end();
      } catch {
        writeEvent("error", {
          message: "Gadus is having a quick rest, please try your message again.",
        });
        res.end();
      }
    }
  };

  res.on("close", () => {
    if (!res.writableEnded) requestController.abort();
  });
  void run();
});

router.get("/gadus/prompts", (_req, res) => {
  res.json(ListGadusPromptsResponse.parse(prompts));
});

router.get("/gadus/studio/assets", async (req, res) => {
  const query = ListGadusStudioAssetsQueryParams.parse(req.query);
  const rows = await db
    .select()
    .from(gadusStudioAssets)
    .where(query.kind ? eq(gadusStudioAssets.kind, query.kind) : undefined)
    .orderBy(desc(gadusStudioAssets.createdAt));
  res.json(ListGadusStudioAssetsResponse.parse(rows));
});

export default router;