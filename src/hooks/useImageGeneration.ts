import { useState } from "react";
import { generateVisual } from "@services/falService";
export const useImageGeneration = () => { const [isGenerating, setIsGenerating] = useState(false); const runGeneration = async (prompt: string, style: string, profilePhoto: string | null) => { setIsGenerating(true); try { return await generateVisual({ prompt, style, profilePhoto }); } finally { setIsGenerating(false); } }; return { isGenerating, runGeneration }; };
