/**
 * Glim Configuration Module
 *
 * This module handles loading and managing configuration settings for Glim.
 * It supports loading from YAML files and environment variables.
 *
 * @module config
 * @author Bagi
 */
import fs from "fs";
import path from "path";
import yaml from "js-yaml";


/**
 * Create a default configuration file with examples
 * @async
 * @returns {Promise<void>}
 */
export async function createDefaultConfig() {
    const configPath = path.join(process.cwd(), "config.yml");

    // Create an enhanced default config with examples for all providers
    const enhancedConfig = {
        api: {
            provider: "google",
            key: "",
            model: "gemini-2.0-flash",
            temperature: 0.7,
            max_tokens: 4000,
            endpoint: "http://localhost:11434/api/generate",
            _examples: {
                google: {
                    provider: "google",
                    key: "YOUR_GOOGLE_API_KEY",
                    model: "gemini-2.0-flash",
                },
                openai: {
                    provider: "openai",
                    key: "YOUR_OPENAI_API_KEY",
                    model: "gpt-4o",
                },
                anthropic: {
                    provider: "anthropic",
                    key: "YOUR_ANTHROPIC_API_KEY",
                    model: "claude-3-sonnet-20240229",
                },
                localai: {
                    provider: "localai",
                    endpoint: "http://localhost:11434/api/generate",
                    model: "llama3",
                },
            },
        },
        content: defaultConfig.content,
        output: defaultConfig.output,
    };

    try {
        // Add comments to the YAML for better user guidance
        let yamlStr = "# Glim Configuration File\n";
        yamlStr += "# =====================\n\n";
        yamlStr += "# API Provider Settings\n";
        yamlStr += "# Provider options: google, openai, anthropic, localai\n";
        yamlStr +=
            "# See README.md for details on setting up each provider\n\n";
        yamlStr += yaml.dump(enhancedConfig);

        // Append extra comments with examples
        yamlStr +=
            "\n# Example configurations for different providers (remove _examples in production):\n";
        yamlStr +=
            "# -------------------------------------------------------------------\n";
        yamlStr +=
            "# For detailed instructions on each provider, see README.md\n";

        await fs.promises.writeFile(configPath, yamlStr, "utf-8");
        console.log(`✅ Default YAML config written to ${configPath}`);
    } catch (error) {
        console.error(`❌ Failed to write config file: ${error.message}`);
    }
}
// Default configuration
const defaultConfig = {
    // API settings
    api: {
        provider: "google", // Options: google, openai, anthropic, localai
        key:
            process.env.GOOGLE_API_KEY ||
            process.env.OPENAI_API_KEY ||
            process.env.ANTHROPIC_API_KEY ||
            "",
        model: "gemini-2.0-flash",
        // Additional model settings
        temperature: 0.7, // Controls randomness (0.0-1.0)
        max_tokens: 4000, // Maximum tokens in the response
        endpoint: "http://localhost:11434/api/generate", // For localai provider
    },
    // Content generation settings
    content: {
        maxTopics: 5,
        maxQuestionsPerTopic: 3,
        codeLang: "en",
    },
    // Output settings
    output: {
        dirname: "output",
    },
};

// Function to load configuration
export function loadConfig(configPath) {
    try {
        // If configPath is provided and file exists, load it
        if (configPath && fs.existsSync(configPath)) {
            const fileContents = fs.readFileSync(configPath, "utf8");
            const userConfig = yaml.load(fileContents);

            // Merge with default config (deep merge)
            return mergeConfigs(defaultConfig, userConfig);
        }

        // Check for default config file locations
        const defaultLocations = [
            "./config.yml",
            "./config.yaml",
            path.join(process.cwd(), "config.yml"),
            path.join(process.cwd(), "config.yaml"),
        ];

        for (const location of defaultLocations) {
            if (fs.existsSync(location)) {
                const fileContents = fs.readFileSync(location, "utf8");
                const userConfig = yaml.load(fileContents);
                return mergeConfigs(defaultConfig, userConfig);
            }
        }

        // If no config file found, return default config
        return defaultConfig;
    } catch (error) {
        console.error(`Error loading configuration: ${error.message}`);
        return defaultConfig;
    }
}

// Helper function to deep merge configs
function mergeConfigs(defaultObj, userObj) {
    if (!userObj) return defaultObj;

    const result = { ...defaultObj };

    for (const [key, value] of Object.entries(userObj)) {
        if (value && typeof value === "object" && !Array.isArray(value)) {
            result[key] = mergeConfigs(defaultObj[key] || {}, value);
        } else {
            result[key] = value;
        }
    }

    return result;
}

// Load configuration
const config = loadConfig();

export { config };
// Export default config for reference
export const defaultConfiguration = defaultConfig;
