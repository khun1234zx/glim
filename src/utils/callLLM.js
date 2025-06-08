import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";
import logger from "./logger.js";

/**
 * Glim LLM Provider Interface
 *
 * This module provides a unified interface for interacting with various
 * Large Language Model (LLM) providers including:
 * - Google Gemini
 * - OpenAI
 * - Anthropic Claude
 * - Local LLMs (via API endpoint)
 *
 * The provider can be configured in the config.yml file.
 *
 * @module callLLM
 * @author Bagi
 */

/**
 * Main function to call the selected LLM provider
 * @param {string} prompt - The prompt to send to the LLM
 * @returns {Promise<string>} - The text response from the LLM
 */
export async function callLLM(prompt) {
    const provider = config.api?.provider?.toLowerCase() || "google";

    switch (provider) {
        case "google":
            return await callGemini(prompt);
        case "openai":
            return await callOpenAI(prompt);
        case "anthropic":
            return await callAnthropic(prompt);
        case "localai":
            return await callLocalAI(prompt);
        default:
            console.warn(
                `Unknown provider '${provider}', falling back to Google Gemini`,
            );
            return await callGemini(prompt);
    }
}

/**
 * Call Google Gemini AI models
 * @param {string} prompt - The prompt to send to the model
 */
export async function callGemini(prompt) {
    try {
        const apiKey = config.api?.key || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new Error(
                "Google API key not found. Set it in config.yml or GOOGLE_API_KEY environment variable.",
            );
        }

        // Create the client
        const genAI = new GoogleGenerativeAI(apiKey);
        const model_name = config.api?.model || "gemini-2.0-flash";
        const model = genAI.getGenerativeModel({ model: model_name });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error calling Google Gemini:", error.message);
        throw new Error(`Failed to call Gemini API: ${error.message}`);
    }
}

/**
 * Call OpenAI models (requires installing the openai package)
 * @param {string} prompt - The prompt to send to the model
 */
export async function callOpenAI(prompt) {
    try {
        // Check if OpenAI package is installed
        let OpenAI;
        try {
            OpenAI = (await import("openai")).default;
        } catch (error) {
            throw new Error(
                "OpenAI package not installed. Run 'npm install openai' to use OpenAI models.",
            );
        }

        const apiKey = config.api?.key || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error(
                "OpenAI API key not found. Set it in config.yml or OPENAI_API_KEY environment variable.",
            );
        }

        const openai = new OpenAI({ apiKey });
        const model = config.api?.model || "gpt-4o";

        const response = await openai.chat.completions.create({
            model,
            messages: [{ role: "user", content: prompt }],
            temperature: config.api?.temperature || 0.7,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("Error calling OpenAI:", error.message);
        throw new Error(`Failed to call OpenAI API: ${error.message}`);
    }
}

/**
 * Call Anthropic Claude models (requires installing the @anthropic-ai/sdk package)
 * @param {string} prompt - The prompt to send to the model
 */
export async function callAnthropic(prompt) {
    try {
        // Check if Anthropic package is installed
        let Anthropic;
        try {
            Anthropic = (await import("@anthropic-ai/sdk")).default;
        } catch (error) {
            throw new Error(
                "Anthropic package not installed. Run 'npm install @anthropic-ai/sdk' to use Claude models.",
            );
        }

        const apiKey = config.api?.key || process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error(
                "Anthropic API key not found. Set it in config.yml or ANTHROPIC_API_KEY environment variable.",
            );
        }

        const anthropic = new Anthropic({ apiKey });
        const model = config.api?.model || "claude-3-sonnet-20240229";

        const response = await anthropic.messages.create({
            model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: config.api?.max_tokens || 4000,
        });

        return response.content[0].text;
    } catch (error) {
        console.error("Error calling Anthropic Claude:", error.message);
        throw new Error(`Failed to call Anthropic API: ${error.message}`);
    }
}

/**
 * Call a local LLM API (Ollama, LocalAI, etc.)
 * @param {string} prompt - The prompt to send to the model
 */
export async function callLocalAI(prompt) {
    try {
        const endpoint =
            config.api?.endpoint || "http://localhost:11434/api/generate";
        const model = config.api?.model || "llama3";

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: config.api?.temperature || 0.7,
                    max_tokens: config.api?.max_tokens || 2000,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.response || data.completion || data.generated_text || "";
    } catch (error) {
        console.error("Error calling Local LLM:", error.message);
        throw new Error(`Failed to call Local LLM API: ${error.message}`);
    }
}

/**
 * Verify that the requirements for the selected provider are met
 * @param {string} provider - The LLM provider name
 * @returns {Promise<boolean>} - Whether the provider can be used
 */
export async function verifyProviderRequirements(provider) {
    if (!provider) return true; // Using default provider

    const lowerProvider = provider.toLowerCase();

    // Check for API key
    const envVarName =
        lowerProvider === "google"
            ? "GOOGLE_API_KEY"
            : lowerProvider === "openai"
              ? "OPENAI_API_KEY"
              : lowerProvider === "anthropic"
                ? "ANTHROPIC_API_KEY"
                : null;

    if (envVarName && !process.env[envVarName] && !config.api?.key) {
        logger.warn(
            `No API key found for provider '${lowerProvider}'. Set it in config.yml or ${envVarName} environment variable.`,
        );
        return false;
    }

    // Check for required packages
    if (lowerProvider === "localai") {
        return true; // No special packages needed
    }

    try {
        if (lowerProvider === "openai") {
            await import("openai");
        } else if (lowerProvider === "anthropic") {
            await import("@anthropic-ai/sdk");
        }
        return true;
    } catch (error) {
        const packageName =
            lowerProvider === "openai" ? "openai" : "@anthropic-ai/sdk";
        logger.warn(
            `Provider '${lowerProvider}' selected but required package not installed.`,
        );
        logger.warn(`Run: npm install ${packageName}`);
        return false;
    }
}
